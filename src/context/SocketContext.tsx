import type React from "react"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"

// Tipos básicos de estado de conexión
export type SocketStatus = "idle" | "connecting" | "open" | "closed" | "error"

interface SocketContextValue {
  status: SocketStatus
  error?: string
  quickPlayPlayers: number | null
  joinedQuickPlay: boolean
  joinQuickPlay: () => void
  leaveQuickPlay: () => void
  send: (data: Record<string, unknown>) => void
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
  const wsRef = useRef<WebSocket | null>(null)
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
          bcRef.current.postMessage({
            type: "local_sync",
            count: localCountRef.current,
          } satisfies LocalMessage)
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
      bcRef.current.postMessage({
        type: "local_sync",
        count: localCountRef.current,
      } satisfies LocalMessage)
    } catch {
      // Si el canal fue cerrado (p.e. HMR), intentar recrear y reenviar una vez
      try {
        bcRef.current = new BroadcastChannel(CHANNEL_NAME)
        bcRef.current.postMessage({
          type: "local_sync",
          count: localCountRef.current,
        } satisfies LocalMessage)
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
    try {
      setStatus("connecting")
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => {
        setStatus("open")
        reconnectAttempts.current = 0
        if (joinedRef.current) {
          // Reunirse de nuevo al reconectar
          ws.send(JSON.stringify({ type: "join_quick_play" }))
        }
      }
      ws.onclose = () => {
        setStatus("closed")
        if (reconnectAttempts.current < 5) {
          const timeout = Math.min(1000 * 2 ** reconnectAttempts.current, 8000)
          reconnectAttempts.current += 1
          setTimeout(connect, timeout)
        }
      }
      ws.onerror = () => {
        setError("Error de WebSocket")
        setStatus("error")
      }
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (
            data.type === "players_count" &&
            data.mode === "quick_play" &&
            typeof data.count === "number"
          ) {
            setQuickPlayPlayers(data.count)
          }
        } catch {
          // No JSON válido, ignorar
        }
      }
    } catch {
      setError("No se pudo crear la conexión WebSocket")
      setStatus("error")
    }
  }, [wsUrl])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      if (bcRef.current) {
        try {
          bcRef.current.close()
        } catch {
          /* ignore */
        }
        bcRef.current = null
      }
      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current)
    }
  }, [connect])

  const send = useCallback(
    (data: Record<string, unknown>) => {
      if (wsRef.current && status === "open" && wsUrl) {
        wsRef.current.send(JSON.stringify(data))
      }
    },
    [status, wsUrl]
  )

  const joinQuickPlay = useCallback(() => {
    if (joinedRef.current) return
    joinedRef.current = true
    setJoinedQuickPlay(true)
    if (wsUrl) {
      send({ type: "join_quick_play" })
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
      send({ type: "leave_quick_play" })
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
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error("useSocket debe usarse dentro de SocketProvider")
  return ctx
}
