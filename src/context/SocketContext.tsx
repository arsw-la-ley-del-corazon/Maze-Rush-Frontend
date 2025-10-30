import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { Client } from "@stomp/stompjs"
import type { IMessage, StompSubscription } from "@stomp/stompjs"
import SockJS from "sockjs-client"

// Tipos básicos de estado de conexión
export type SocketStatus = "idle" | "connecting" | "open" | "closed" | "error"

interface SocketContextValue {
  status: SocketStatus
  error?: string
  quickPlayPlayers: number | null
  joinedQuickPlay: boolean
  joinQuickPlay: () => void
  leaveQuickPlay: () => void
  send: (data: Record<string, unknown>, destination?: string) => void
  subscribe: (destination: string, handler: (body: any) => void) => void
  unsubscribe: (destination: string) => void
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined)

// Mensajes esperados desde un backend real (documentación para futuro)
// { type: 'players_count', mode: 'quick_play', count: number }
// { type: 'pong' }

// Fallback local (sin backend) usando BroadcastChannel para simular conteo de jugadores entre pestañas
interface LocalMessage {
  type: "local_join" | "local_leave" | "local_sync"
  mode?: "quick_play"
  count?: number
}

const CHANNEL_NAME = "maze_rush_quick_play"

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stompRef = useRef<Client | null>(null)
  const subsRef = useRef<Record<string, StompSubscription | null>>({})
  const pendingSubsRef = useRef<Record<string, (msg: IMessage) => void>>({})
  const [status, setStatus] = useState<SocketStatus>("idle")
  const [error, setError] = useState<string | undefined>()
  const [quickPlayPlayers, setQuickPlayPlayers] = useState<number | null>(null)
  const [joinedQuickPlay, setJoinedQuickPlay] = useState(false)
  const reconnectAttempts = useRef(0)
  const joinedRef = useRef(false)

  // BroadcastChannel fallback
  const bcRef = useRef<BroadcastChannel | null>(null)
  const localCountRef = useRef(0)
  const syncTimeoutRef = useRef<number | null>(null)

  // Acceso seguro a variable de entorno Vite; si no existe, se activa modo fallback local
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsUrl = (import.meta as any)?.env?.VITE_WS_URL as string | undefined

  const setupBroadcastChannel = () => {
    if (bcRef.current) return
    try {
      bcRef.current = new BroadcastChannel(CHANNEL_NAME)
      bcRef.current.onmessage = (ev) => {
        const msg = ev.data as LocalMessage
        if (msg.type === "local_join" || msg.type === "local_leave" || msg.type === "local_sync") {
          if (typeof msg.count === "number") {
            setQuickPlayPlayers(msg.count)
            localCountRef.current = msg.count
          }
        }
      }
      // Sincroniza al entrar
      syncTimeoutRef.current = window.setTimeout(() => {
        if (!bcRef.current) return
        try {
          bcRef.current.postMessage({ type: "local_sync", count: localCountRef.current } satisfies LocalMessage)
        } catch {
          // Canal ya cerrado (HMR), ignorar
        }
      }, 50)
    } catch {
      // Ignorar si BroadcastChannel no está disponible (Safari privado u otros entornos)
    }
  }

  const broadcastCount = () => {
    if (!bcRef.current) return
    try {
      bcRef.current.postMessage({ type: "local_sync", count: localCountRef.current } satisfies LocalMessage)
    } catch {
      // Si el canal fue cerrado (p.e. HMR), intentar recrear y reenviar una vez
      try {
        bcRef.current = new BroadcastChannel(CHANNEL_NAME)
        bcRef.current.postMessage({ type: "local_sync", count: localCountRef.current } satisfies LocalMessage)
      } catch {
        // desistir silenciosamente
      }
    }
  }

  const connect = useCallback(() => {
    if (!wsUrl) {
      // Sin backend: usar fallback local
      setStatus("open")
      setupBroadcastChannel()
      return
    }

    setStatus("connecting")
    const client = new Client({
      // use SockJS for better compatibility
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: (msg) => {
        // console.debug("STOMP:", msg)
      },
      onConnect: () => {
        setStatus("open")
        reconnectAttempts.current = 0
        // Subscribe to generic lobby topics used by quick play if needed
        // Ejemplo: suscribirse a conteo de quick play
        try {
          const sub = client.subscribe('/topic/quickplay', (msg: IMessage) => {
            try {
              const payload = JSON.parse(msg.body)
              if (payload?.type === 'players_count' && typeof payload.count === 'number') {
                setQuickPlayPlayers(payload.count)
              }
            } catch {}
          })
          subsRef.current['/topic/quickplay'] = sub
        } catch {
          // ignore
        }
        // Re-subscribe to any pending subscriptions requested before connect
        Object.entries(pendingSubsRef.current).forEach(([dest, handler]) => {
          try {
            const sub = client.subscribe(dest, handler)
            subsRef.current[dest] = sub
          } catch {
            // ignore
          }
        })
        // clear pending (they are now active)
        pendingSubsRef.current = {}
        // Re-join if needed
        if (joinedRef.current) {
          client.publish({ destination: '/app/quickplay/join', body: JSON.stringify({}) })
        }
      },
      onStompError: (frame) => {
        setError(frame && frame.headers && frame.headers['message'] ? frame.headers['message'] : 'STOMP error')
        setStatus('error')
      },
      onWebSocketClose: () => {
        setStatus('closed')
      }
    })

    stompRef.current = client
    client.activate()
  }, [wsUrl])

  useEffect(() => {
    connect()
    return () => {
      try {
        stompRef.current?.deactivate()
      } catch {}
      Object.values(subsRef.current).forEach(s => s?.unsubscribe())
      subsRef.current = {}
      if (bcRef.current) {
        try { bcRef.current.close() } catch { /* ignore */ }
        bcRef.current = null
      }
      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current)
    }
  }, [connect])

  const send = useCallback((data: Record<string, unknown>, destination = '/app/quickplay') => {
    const client = stompRef.current
    if (client && status === 'open') {
      try {
        client.publish({ destination, body: JSON.stringify(data) })
      } catch (e) {
        // ignore publish errors
      }
    }
  }, [status])

  const subscribe = useCallback((destination: string, handler: (body: any) => void) => {
    const client = stompRef.current
    const wrapped = (msg: IMessage) => {
      try {
        const parsed = msg.body ? JSON.parse(msg.body) : null
        handler(parsed)
      } catch (e) {
        // if not JSON, pass raw
        handler(msg.body)
      }
    }

    // If connected, subscribe immediately
    if (client && status === 'open') {
      try {
        const sub = client.subscribe(destination, wrapped)
        subsRef.current[destination] = sub
      } catch (e) {
        // fallback to pending
        pendingSubsRef.current[destination] = wrapped
      }
      return
    }

    // Not connected yet: register as pending subscription
    pendingSubsRef.current[destination] = wrapped
  }, [status])

  const unsubscribe = useCallback((destination: string) => {
    try {
      const sub = subsRef.current[destination]
      if (sub) {
        sub.unsubscribe()
        delete subsRef.current[destination]
      }
    } catch {}
    // ensure pending removed as well
    try { delete pendingSubsRef.current[destination] } catch {}
  }, [])

  const joinQuickPlay = useCallback(() => {
    if (joinedRef.current) return
    joinedRef.current = true
    setJoinedQuickPlay(true)
    if (wsUrl) {
      send({}, '/app/quickplay/join')
    } else {
      // Fallback local
      localCountRef.current += 1
      setQuickPlayPlayers(localCountRef.current)
      broadcastCount()
    }
  }, [send, wsUrl])

  const leaveQuickPlay = useCallback(() => {
    if (!joinedRef.current) return
    joinedRef.current = false
    setJoinedQuickPlay(false)
    if (wsUrl) {
      send({}, '/app/quickplay/leave')
    } else {
      localCountRef.current = Math.max(0, localCountRef.current - 1)
      setQuickPlayPlayers(localCountRef.current)
      broadcastCount()
    }
  }, [send, wsUrl])

  const value: SocketContextValue = {
    status,
    error,
    quickPlayPlayers,
    joinedQuickPlay,
    joinQuickPlay,
    leaveQuickPlay,
    send,
    subscribe,
    unsubscribe,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error("useSocket debe usarse dentro de SocketProvider")
  return ctx
}
