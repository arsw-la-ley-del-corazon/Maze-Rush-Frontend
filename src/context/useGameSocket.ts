// src/context/useGameSocket.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { useAuth } from "./useAuth"
import { SOCKET_CONFIG } from "../common/globas"
import type { GameSyncMessage, PlayerGameState } from "../types/api"

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

export interface PowerUpNotification {
  type: "POWER_UP"
  message: string
  sourceUser: string
  powerUpType: "FREEZE" | "CONFUSION" | "CLEAR_FOG"
}

interface StompMessage {
  body: string
  headers: Record<string, string>
  ack?: () => void
  nack?: () => void
}

interface UseGameSocketParams {
  lobbyCode: string
  gameId: string
}

interface UseGameSocketResult {
  isConnected: boolean
  error: string | null
  otherPlayers: PlayerGameState[]
  sendMove: (direction: Direction) => void
  sendFinish: (finishTime: number) => void
  disconnect: () => void
  gameState: GameSyncMessage | null
  myPlayer: PlayerGameState | null
  isMyPlayerFrozen: boolean
  hasClearFog: boolean
  lastNotification: PowerUpNotification | null
  clearNotification: () => void
}

/**
 * Hook unificado de WebSocket del juego
 * - SockJS + JWT
 * - Suscripción a estado del juego por gameId
 * - Suscripción a notificaciones de Power-Ups
 * - Envía movimientos por direction
 */
export function useGameSocket({
  lobbyCode,
  gameId,
}: UseGameSocketParams): UseGameSocketResult {
  const { user } = useAuth()

  const clientRef = useRef<Client | null>(null)
  const moveSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const notificationsSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [gameState, setGameState] = useState<GameSyncMessage | null>(null)
  const [otherPlayers, setOtherPlayers] = useState<Map<string, PlayerGameState>>(new Map())
  const [lastNotification, setLastNotification] = useState<PowerUpNotification | null>(null)

  // -------- helpers ----------
  const generatePlayerColor = (username: string) => {
    const colors = ["#F7FF3C", "#22D3EE", "#A855F7", "#FB7185", "#98D8C8", "#F7DC6F"]
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // -------- conectar ----------
  const connect = useCallback(() => {
    if (!user || !lobbyCode || !gameId) {
      setError("Usuario, código de lobby o gameId no disponible")
      return
    }

    const authState = localStorage.getItem("auth_state")
    let token = ""
    if (authState) {
      try {
        const parsed = JSON.parse(authState)
        token = parsed.accessToken || ""
      } catch {
        // ignore
      }
    }

    const wsUrl = `${SOCKET_CONFIG.URL}/ws`
    const socket = new SockJS(wsUrl)

    const client = new Client({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        console.log("[useGameSocket] Conectado", { lobbyCode, gameId })
        setIsConnected(true)
        setError(null)

        // 🧠 Estado del juego (GameState) por gameId
        moveSubscriptionRef.current = client.subscribe(
          `/topic/game/${gameId}/move`,
          (message: StompMessage) => {
            try {
              const state = JSON.parse(message.body) as GameSyncMessage
              setGameState(state)

              // Mapa de otros jugadores (excluye al local)
              const others = new Map<string, PlayerGameState>()
              state.players.forEach((p) => {
                if (p.username !== user.username) {
                  others.set(p.username, {
                    ...p,
                    avatarColor: p.avatarColor ?? generatePlayerColor(p.username),
                  })
                }
              })
              setOtherPlayers(others)
            } catch (err) {
              console.error("[useGameSocket] Error parseando GameState:", err)
            }
          }
        )

        // 🔔 Notificaciones de Power-Ups
        notificationsSubscriptionRef.current = client.subscribe(
          `/topic/game/${gameId}/notifications`,
          (message: StompMessage) => {
            try {
              const notif = JSON.parse(message.body) as PowerUpNotification
              setLastNotification(notif)
            } catch (err) {
              console.error("[useGameSocket] Error parseando notificación:", err)
            }
          }
        )

        // Avisar que el jugador entró a la partida (si backend lo usa)
        client.publish({
          destination: `/app/game/${lobbyCode}/join`,
          body: JSON.stringify({ username: user.username }),
        })
      },
      onDisconnect: () => {
        console.log("[useGameSocket] Desconectado")
        setIsConnected(false)
        moveSubscriptionRef.current?.unsubscribe()
        notificationsSubscriptionRef.current?.unsubscribe()
        moveSubscriptionRef.current = null
        notificationsSubscriptionRef.current = null
      },
      onStompError: (frame) => {
        console.error("[useGameSocket] STOMP error", frame)
        setError(`Error STOMP: ${frame.headers["message"] ?? "Error desconocido"}`)
        setIsConnected(false)
      },
      onWebSocketError: () => {
        console.error("[useGameSocket] WebSocket error")
        setError("Error de conexión WebSocket")
        setIsConnected(false)
      },
    })

    client.activate()
    clientRef.current = client
  }, [user, lobbyCode, gameId])

  // -------- enviar movimiento (direction) ----------
  const sendMove = useCallback(
    (direction: Direction) => {
      if (!clientRef.current?.connected || !user?.username) {
        console.warn("[useGameSocket] No se puede enviar move: sin conexión")
        return
      }

      clientRef.current.publish({
        destination: `/app/game/${lobbyCode}/move`,
        body: JSON.stringify({
          gameId,
          direction,
        }),
      })
    },
    [user, lobbyCode, gameId],
  )

  // -------- enviar finish ----------
  const sendFinish = useCallback(
    (finishTime: number) => {
      if (!clientRef.current?.connected || !user?.username) {
        console.warn("[useGameSocket] No se puede enviar finish: sin conexión")
        return
      }

      clientRef.current.publish({
        destination: `/app/game/${lobbyCode}/finish`,
        body: JSON.stringify({
          username: user.username,
          finishTime,
          timestamp: new Date().toISOString(),
        }),
      })
    },
    [user, lobbyCode],
  )

  // -------- desconectar ----------
  const disconnect = useCallback(() => {
    moveSubscriptionRef.current?.unsubscribe()
    notificationsSubscriptionRef.current?.unsubscribe()
    moveSubscriptionRef.current = null
    notificationsSubscriptionRef.current = null

    if (clientRef.current) {
      try {
        if (clientRef.current.connected && user?.username && lobbyCode) {
          clientRef.current.publish({
            destination: `/app/game/${lobbyCode}/leave`,
            body: JSON.stringify({ username: user.username }),
          })
        }
      } catch (err) {
        console.error("[useGameSocket] Error enviando leave:", err)
      }

      clientRef.current.deactivate()
      clientRef.current = null
    }

    setIsConnected(false)
    setOtherPlayers(new Map())
    setGameState(null)
    setLastNotification(null)
  }, [user, lobbyCode])

  // -------- ciclo de vida ----------
  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // -------- player local & efectos ----------
  const myPlayer: PlayerGameState | null = useMemo(() => {
    if (!gameState || !user?.username) return null
    return gameState.players.find((p) => p.username === user.username) ?? null
  }, [gameState, user])

  const isMyPlayerFrozen = !!myPlayer?.activeEffects?.FREEZE
  const hasClearFog = !!myPlayer?.activeEffects?.CLEAR_FOG

  const clearNotification = () => setLastNotification(null)

  return {
    isConnected,
    error,
    otherPlayers: Array.from(otherPlayers.values()),
    sendMove,
    sendFinish,
    disconnect,
    gameState,
    myPlayer,
    isMyPlayerFrozen,
    hasClearFog,
    lastNotification,
    clearNotification,
  }
}
