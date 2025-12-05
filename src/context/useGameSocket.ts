// src/context/useGameSocket.ts
import { useEffect, useRef, useCallback, useState } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { useAuth } from "./useAuth"
import { SOCKET_CONFIG } from "../common/globas"
import type { GameEvent, PlayerGameState, GameSyncMessage, MazeData } from "../types/api"

interface UseGameSocketOptions {
  lobbyCode: string
  onMazeReceived?: (maze: MazeData) => void
  onPlayerMove?: (username: string, position: { x: number; y: number }) => void
  onPlayerFinish?: (username: string, finishTime: number) => void
  onPlayerJoined?: (username: string) => void
  onPlayerLeft?: (username: string) => void
  onGameSync?: (players: PlayerGameState[]) => void
}

interface StompMessage {
  body: string
  headers: Record<string, string>
  ack?: () => void
  nack?: () => void
}

type CallbackBundle = {
  onMazeReceived?: (maze: MazeData) => void
  onPlayerMove?: (username: string, position: { x: number; y: number }) => void
  onPlayerFinish?: (username: string, finishTime: number) => void
  onPlayerJoined?: (username: string) => void
  onPlayerLeft?: (username: string) => void
  onGameSync?: (players: PlayerGameState[]) => void
}

export function useGameSocket(options: UseGameSocketOptions) {
  const { lobbyCode } = options
  const { user } = useAuth()

  const clientRef = useRef<Client | null>(null)
  const moveSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const syncSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const callbacksRef = useRef<CallbackBundle>({})

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otherPlayers, setOtherPlayers] = useState<Map<string, PlayerGameState>>(new Map())

  // Mantener SIEMPRE las callbacks más recientes sin cambiar la referencia de connect()
  useEffect(() => {
    callbacksRef.current = {
      onMazeReceived: options.onMazeReceived,
      onPlayerMove: options.onPlayerMove,
      onPlayerFinish: options.onPlayerFinish,
      onPlayerJoined: options.onPlayerJoined,
      onPlayerLeft: options.onPlayerLeft,
      onGameSync: options.onGameSync,
    }
  }, [
    options.onMazeReceived,
    options.onPlayerMove,
    options.onPlayerFinish,
    options.onPlayerJoined,
    options.onPlayerLeft,
    options.onGameSync,
  ])

  // ---------- helpers ----------
  const classifyMessage = (
    raw: any,
  ): "move" | "finish" | "player_joined" | "player_left" | "unknown" => {
    if (!raw || typeof raw !== "object") return "unknown"

    if (
      raw.type === "move" ||
      raw.type === "finish" ||
      raw.type === "player_joined" ||
      raw.type === "player_left"
    ) {
      return raw.type
    }

    if (raw.position && typeof raw.position.x === "number" && typeof raw.position.y === "number") {
      return "move"
    }

    if ("finishTime" in raw) {
      return "finish"
    }

    if (raw.event === "player_joined") return "player_joined"
    if (raw.event === "player_left") return "player_left"

    return "unknown"
  }

  const generatePlayerColor = (username: string) => {
    const colors = ["#F7FF3C", "#22D3EE", "#A855F7", "#FB7185", "#98D8C8", "#F7DC6F"]
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // ---------- conexión (solo depende de user y lobbyCode) ----------
  const connect = useCallback(() => {
    if (!user || !lobbyCode) {
      setError("Usuario o código de lobby no disponible")
      return
    }

    // Token igual que en LobbySocketContext
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
      onConnect: () => {
        console.log("[useGameSocket] Conectado a lobby de juego", lobbyCode)
        setIsConnected(true)
        setError(null)

        // Suscripción a movimientos / finish / join / left
        moveSubscriptionRef.current = client.subscribe(
          `/topic/game/${lobbyCode}/move`,
          (message: StompMessage) => {
            try {
              const raw = JSON.parse(message.body)
              const kind = classifyMessage(raw)
              const username: string | undefined = raw.username
              const {
                onPlayerMove,
                onPlayerFinish,
                onPlayerJoined,
                onPlayerLeft,
              } = callbacksRef.current

              console.log("[useGameSocket] mensaje /move:", raw)

              switch (kind) {
                case "move": {
                  if (!username || !raw.position) return
                  const position = { x: raw.position.x, y: raw.position.y }

                  onPlayerMove?.(username, position)

                  setOtherPlayers((prev) => {
                    const updated = new Map(prev)
                    const existing = updated.get(username)
                    updated.set(username, {
                      username,
                      position,
                      isFinished: existing?.isFinished ?? false,
                      finishTime: existing?.finishTime,
                      avatarColor: existing?.avatarColor ?? generatePlayerColor(username),
                    })
                    return updated
                  })
                  break
                }

                case "finish": {
                  if (!username) return
                  const finishTime: number =
                    typeof raw.finishTime === "number" ? raw.finishTime : 0

                  // 🔴 esto se ejecuta en TODOS los clientes conectados
                  onPlayerFinish?.(username, finishTime)

                  setOtherPlayers((prev) => {
                    const updated = new Map(prev)
                    const existing = updated.get(username)
                    updated.set(username, {
                      username,
                      position: existing?.position ?? { x: 0, y: 0 },
                      isFinished: true,
                      finishTime,
                      avatarColor: existing?.avatarColor ?? generatePlayerColor(username),
                    })
                    return updated
                  })
                  break
                }

                case "player_joined": {
                  if (!username) return
                  onPlayerJoined?.(username)
                  setOtherPlayers((prev) => {
                    const updated = new Map(prev)
                    if (!updated.has(username)) {
                      updated.set(username, {
                        username,
                        position: { x: 0, y: 0 },
                        isFinished: false,
                        avatarColor: generatePlayerColor(username),
                      })
                    }
                    return updated
                  })
                  break
                }

                case "player_left": {
                  if (!username) return
                  onPlayerLeft?.(username)
                  setOtherPlayers((prev) => {
                    const updated = new Map(prev)
                    updated.delete(username)
                    return updated
                  })
                  break
                }

                default:
                  console.warn("[useGameSocket] mensaje desconocido en /move:", raw)
              }
            } catch (err) {
              console.error("[useGameSocket] Error parseando mensaje /move:", err)
            }
          },
        )

        // Suscripción a sincronización periódica
        syncSubscriptionRef.current = client.subscribe(
          `/topic/game/${lobbyCode}/sync`,
          (message: StompMessage) => {
            try {
              const syncData: GameSyncMessage = JSON.parse(message.body)
              const { onGameSync } = callbacksRef.current

              console.log("[useGameSocket] mensaje /sync:", syncData)

              onGameSync?.(syncData.players)

              const playersMap = new Map<string, PlayerGameState>()
              syncData.players.forEach((p) => {
                if (p.username !== user.username) {
                  playersMap.set(p.username, {
                    ...p,
                    avatarColor: p.avatarColor ?? generatePlayerColor(p.username),
                  })
                }
              })
              setOtherPlayers(playersMap)
            } catch (err) {
              console.error("[useGameSocket] Error parseando /sync:", err)
            }
          },
        )

        // Avisar al backend que entramos al juego
        client.publish({
          destination: `/app/game/${lobbyCode}/join`,
          body: JSON.stringify({ username: user.username }),
        })
      },
      onDisconnect: () => {
        console.log("[useGameSocket] desconectado")
        setIsConnected(false)
        moveSubscriptionRef.current?.unsubscribe()
        syncSubscriptionRef.current?.unsubscribe()
        moveSubscriptionRef.current = null
        syncSubscriptionRef.current = null
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

    if (token) {
      client.configure({
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    }

    client.activate()
    clientRef.current = client
  }, [user, lobbyCode])

  // ---------- enviar movimiento ----------
  const sendMove = useCallback(
    (position: { x: number; y: number }) => {
      if (!clientRef.current?.connected || !user?.username) {
        console.warn("[useGameSocket] no se puede enviar move: sin conexión")
        return
      }
      const body: GameEvent = {
        username: user.username,
        position,
        timestamp: new Date().toISOString(),
        type: "move",
      }
      clientRef.current.publish({
        destination: `/app/game/${lobbyCode}/move`,
        body: JSON.stringify(body),
      })
    },
    [user, lobbyCode],
  )

  // ---------- enviar finish ----------
  const sendFinish = useCallback(
    (finishTime: number) => {
      if (!clientRef.current?.connected || !user?.username) {
        console.warn("[useGameSocket] no se puede enviar finish: sin conexión")
        return
      }
      const body: GameEvent = {
        username: user.username,
        finishTime,
        timestamp: new Date().toISOString(),
        type: "finish",
      }
      clientRef.current.publish({
        destination: `/app/game/${lobbyCode}/finish`,
        body: JSON.stringify(body),
      })
    },
    [user, lobbyCode],
  )

  // ---------- desconectar ----------
  const disconnect = useCallback(() => {
    moveSubscriptionRef.current?.unsubscribe()
    syncSubscriptionRef.current?.unsubscribe()
    moveSubscriptionRef.current = null
    syncSubscriptionRef.current = null

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
  }, [user, lobbyCode])

  // ---------- ciclo de vida ----------
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
