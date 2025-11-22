import { useEffect, useRef, useCallback, useState } from "react"
import { Client } from "@stomp/stompjs"
import { useAuth } from "./useAuth"
import type { GameEvent, PlayerGameState, GameSyncMessage, MazeData } from "../types/api"

interface StompMessage {
  body: string
  headers: Record<string, string>
  ack?: () => void
  nack?: () => void
}

interface UseGameSocketOptions {
  lobbyCode: string
  onMazeReceived?: (maze: MazeData) => void
  onPlayerMove?: (username: string, position: { x: number; y: number }) => void
  onPlayerFinish?: (username: string, finishTime: number) => void
  onPlayerJoined?: (username: string) => void
  onPlayerLeft?: (username: string) => void
  onGameSync?: (players: PlayerGameState[]) => void
}

/**
 * Custom hook for managing game WebSocket connections
 * Handles real-time player position synchronization and game events
 */
export function useGameSocket(options: UseGameSocketOptions) {
  const { lobbyCode, onMazeReceived, onPlayerMove, onPlayerFinish, onPlayerJoined, onPlayerLeft, onGameSync } =
    options
  const { user } = useAuth()
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otherPlayers, setOtherPlayers] = useState<Map<string, PlayerGameState>>(new Map())
  const moveSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const syncSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  /**
   * Connect to game WebSocket
   */
  const connect = useCallback(() => {
    if (!user || !lobbyCode) {
      setError("Usuario o código de lobby no disponible")
      return
    }

    // Get auth token
    const authState = localStorage.getItem("auth_state")
    let token = ""
    if (authState) {
      try {
        const parsed = JSON.parse(authState)
        token = parsed.accessToken || ""
      } catch {
        // Ignore parsing error
      }
    }

    // Use existing SockJS connection pattern
    const wsUrl = `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/ws`
    
    // Create SockJS instance
    const socket = new WebSocket(wsUrl.replace("http", "ws"))
    
    const client = new Client({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        setIsConnected(true)
        setError(null)

        // Subscribe to game move events
        moveSubscriptionRef.current = client.subscribe(
          `/topic/game/${lobbyCode}/move`,
          (message: StompMessage) => {
            try {
              const event: GameEvent = JSON.parse(message.body)

              if (event.type === "move" && event.username !== user.username) {
                onPlayerMove?.(event.username, event.position)
                setOtherPlayers((prev) => {
                  const updated = new Map(prev)
                  const existing = updated.get(event.username)
                  updated.set(event.username, {
                    username: event.username,
                    position: event.position,
                    isFinished: existing?.isFinished || false,
                    finishTime: existing?.finishTime,
                    avatarColor: existing?.avatarColor,
                  })
                  return updated
                })
              } else if (event.type === "finish" && event.username !== user.username) {
                onPlayerFinish?.(event.username, event.finishTime)
                setOtherPlayers((prev) => {
                  const updated = new Map(prev)
                  const existing = updated.get(event.username)
                  if (existing) {
                    updated.set(event.username, {
                      ...existing,
                      isFinished: true,
                      finishTime: event.finishTime,
                    })
                  }
                  return updated
                })
              } else if (event.type === "start") {
                if (event.maze) {
                  onMazeReceived?.(event.maze)
                }
              } else if (event.type === "player_joined") {
                onPlayerJoined?.(event.username)
              } else if (event.type === "player_left") {
                onPlayerLeft?.(event.username)
                setOtherPlayers((prev) => {
                  const updated = new Map(prev)
                  updated.delete(event.username)
                  return updated
                })
              }
            } catch (err) {
              console.error("Error parsing game event:", err)
            }
          }
        )

        // Subscribe to game sync events (periodic full state updates)
        syncSubscriptionRef.current = client.subscribe(
          `/topic/game/${lobbyCode}/sync`,
          (message: StompMessage) => {
            try {
              const syncData: GameSyncMessage = JSON.parse(message.body)
              onGameSync?.(syncData.players)
              
              // Update other players state
              const playersMap = new Map<string, PlayerGameState>()
              syncData.players.forEach((player) => {
                if (player.username !== user.username) {
                  playersMap.set(player.username, player)
                }
              })
              setOtherPlayers(playersMap)
            } catch (err) {
              console.error("Error parsing game sync:", err)
            }
          }
        )

        // Notify backend that player joined the game
        client.publish({
          destination: `/app/game/${lobbyCode}/join`,
          body: JSON.stringify({ username: user.username }),
        })
      },
      onDisconnect: () => {
        setIsConnected(false)
        moveSubscriptionRef.current?.unsubscribe()
        syncSubscriptionRef.current?.unsubscribe()
        moveSubscriptionRef.current = null
        syncSubscriptionRef.current = null
      },
      onStompError: (frame) => {
        setError(`Error STOMP: ${frame.headers["message"] || "Error desconocido"}`)
        setIsConnected(false)
      },
      onWebSocketError: () => {
        setError("Error de conexión WebSocket")
        setIsConnected(false)
      },
    })

    client.activate()
    clientRef.current = client
  }, [user, lobbyCode, onMazeReceived, onPlayerMove, onPlayerFinish, onPlayerJoined, onPlayerLeft, onGameSync])

  /**
   * Send player move to backend
   */
  const sendMove = useCallback(
    (position: { x: number; y: number }) => {
      if (!clientRef.current?.connected || !user?.username) {
        console.warn("Cannot send move: not connected")
        return
      }

      clientRef.current.publish({
        destination: `/app/game/${lobbyCode}/move`,
        body: JSON.stringify({
          username: user.username,
          position,
          timestamp: new Date().toISOString(),
        }),
      })
    },
    [user, lobbyCode]
  )

  /**
   * Send player finish event
   */
  const sendFinish = useCallback(
    (finishTime: number) => {
      if (!clientRef.current?.connected || !user?.username) {
        console.warn("Cannot send finish: not connected")
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
    [user, lobbyCode]
  )

  /**
   * Disconnect from game WebSocket
   */
  const disconnect = useCallback(() => {
    moveSubscriptionRef.current?.unsubscribe()
    syncSubscriptionRef.current?.unsubscribe()
    moveSubscriptionRef.current = null
    syncSubscriptionRef.current = null

    if (clientRef.current) {
      // Notify backend that player left
      if (user?.username) {
        clientRef.current.publish({
          destination: `/app/game/${lobbyCode}/leave`,
          body: JSON.stringify({ username: user.username }),
        })
      }
      clientRef.current.deactivate()
      clientRef.current = null
    }

    setIsConnected(false)
    setOtherPlayers(new Map())
  }, [user, lobbyCode])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    error,
    otherPlayers: Array.from(otherPlayers.values()),
    sendMove,
    sendFinish,
    disconnect,
  }
}
