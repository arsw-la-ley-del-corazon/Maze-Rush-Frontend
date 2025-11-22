import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { useAuth } from "./useAuth"
import { API_CONFIG, SOCKET_CONFIG } from "../common/globas"
import type { ChatMessage } from "../types/api"

// Tipo para mensajes STOMP
interface StompMessage {
  body: string
  headers: Record<string, string>
  ack?: () => void
  nack?: () => void
}

export interface SystemMessage extends ChatMessage {
  isSystem: true
  type: "player_joined" | "player_left" | "connection_lost" | "connection_restored"
}

interface LobbySocketContextValue {
  isConnected: boolean
  error: string | null
  messages: (ChatMessage | SystemMessage)[]
  players: string[]
  readyPlayers: Set<string>
  connect: (lobbyCode: string) => void
  disconnect: () => void
  sendMessage: (message: string) => void
  toggleReady: () => void
  startGame: () => void
  updatePlayers: (players: string[]) => void
  setOnDisconnectCallback?: (callback: (lobbyCode: string) => Promise<void>) => void
}

const LobbySocketContext = createContext<LobbySocketContextValue | undefined>(undefined)

export const LobbySocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<(ChatMessage | SystemMessage)[]>([])
  const [players, setPlayers] = useState<string[]>([])
  const [readyPlayers, setReadyPlayers] = useState<Set<string>>(new Set())
  const currentLobbyCodeRef = useRef<string | null>(null)
  const chatSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const readySubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const gameSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const playersSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const onDisconnectCallbackRef = useRef<((lobbyCode: string) => Promise<void>) | undefined>(undefined)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(
    (lobbyCode: string) => {
      if (!user) {
        setError("Usuario no autenticado")
        return
      }

      if (clientRef.current?.connected) {
        disconnect()
      }

      currentLobbyCodeRef.current = lobbyCode

      // Obtener token de autenticación
      const authState = localStorage.getItem("auth_state")
      let token = ""
      if (authState) {
        try {
          const parsed = JSON.parse(authState)
          token = parsed.accessToken || ""
        } catch {
          // Ignorar error de parsing
        }
      }

      // Construir URL del WebSocket
      const wsUrl = `${SOCKET_CONFIG.URL}/ws`
      const socket = new SockJS(wsUrl)
      const client = new Client({
        webSocketFactory: () => socket as any,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          setIsConnected(true)
          setError(null)
          reconnectAttemptsRef.current = 0

          // Agregar mensaje de sistema sobre reconexión
          if (currentLobbyCodeRef.current) {
            const systemMsg: SystemMessage = {
              username: "Sistema",
              message: "Conexión restaurada",
              isSystem: true,
              type: "connection_restored",
              timestamp: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, systemMsg])
          }

          // Conectar al lobby
          if (currentLobbyCodeRef.current) {
            client.publish({
              destination: `/app/lobby/${currentLobbyCodeRef.current}/connect`,
            })
          }

          // Suscribirse a mensajes de chat
          if (currentLobbyCodeRef.current) {
            chatSubscriptionRef.current = client.subscribe(
              `/topic/lobby/${currentLobbyCodeRef.current}/chat`,
              (message: StompMessage) => {
                try {
                  const chatMessage: ChatMessage = JSON.parse(message.body)
                  setMessages((prev) => [...prev, chatMessage])
                } catch (err) {
                  console.error("Error parsing chat message:", err)
                }
              }
            )
          }

          // Suscribirse a cambios de estado "ready"
          if (currentLobbyCodeRef.current) {
            readySubscriptionRef.current = client.subscribe(
              `/topic/lobby/${currentLobbyCodeRef.current}/ready`,
              (message: StompMessage) => {
                try {
                  const data = JSON.parse(message.body)
                  // El backend puede enviar diferentes formatos
                  if (data.username) {
                    setReadyPlayers((prev) => {
                      const newSet = new Set(prev)
                      if (data.isReady !== false) {
                        // Si isReady es true o no está presente, asumimos que está listo
                        newSet.add(data.username)
                      } else {
                        newSet.delete(data.username)
                      }
                      return newSet
                    })
                  }
                } catch (err) {
                  console.error("Error parsing ready message:", err)
                }
              }
            )
          }

          // Suscribirse a eventos de juego
          if (currentLobbyCodeRef.current) {
            gameSubscriptionRef.current = client.subscribe(
              `/topic/lobby/${currentLobbyCodeRef.current}/game`,
              (message: StompMessage) => {
                try {
                  const data = JSON.parse(message.body)
                  // Aquí puedes manejar eventos de inicio de juego
                  console.log("Game event:", data)
                } catch (err) {
                  console.error("Error parsing game message:", err)
                }
              }
            )
          }

          // Suscribirse a eventos de jugadores (unirse/salir)
          if (currentLobbyCodeRef.current) {
            playersSubscriptionRef.current = client.subscribe(
              `/topic/lobby/${currentLobbyCodeRef.current}/players`,
              (message: StompMessage) => {
                try {
                  const data = JSON.parse(message.body)
                  if (data.players && Array.isArray(data.players)) {
                    setPlayers(data.players)
                    
                    // Agregar mensaje de sistema
                    if (data.username && data.action) {
                      const systemMsg: SystemMessage = {
                        username: "Sistema",
                        message: data.action === "joined" 
                          ? `${data.username} se unió al lobby`
                          : `${data.username} salió del lobby`,
                        isSystem: true,
                        type: data.action === "joined" ? "player_joined" : "player_left",
                        timestamp: new Date().toISOString(),
                      }
                      setMessages((prev) => [...prev, systemMsg])
                    }
                  }
                } catch (err) {
                  console.error("Error parsing players message:", err)
                }
              }
            )
          }
        },
        onDisconnect: () => {
          setIsConnected(false)
          
          // Agregar mensaje de sistema sobre desconexión
          if (currentLobbyCodeRef.current) {
            const systemMsg: SystemMessage = {
              username: "Sistema",
              message: "Conexión perdida. Intentando reconectar...",
              isSystem: true,
              type: "connection_lost",
              timestamp: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, systemMsg])
          }

          // Limpiar suscripciones
          chatSubscriptionRef.current?.unsubscribe()
          readySubscriptionRef.current?.unsubscribe()
          gameSubscriptionRef.current?.unsubscribe()
          playersSubscriptionRef.current?.unsubscribe()
          chatSubscriptionRef.current = null
          readySubscriptionRef.current = null
          gameSubscriptionRef.current = null
          playersSubscriptionRef.current = null

          // Intentar reconectar si hay un código de lobby
          if (currentLobbyCodeRef.current && reconnectAttemptsRef.current < 5) {
            const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10000)
            reconnectAttemptsRef.current += 1
            reconnectTimeoutRef.current = window.setTimeout(() => {
              if (currentLobbyCodeRef.current) {
                connect(currentLobbyCodeRef.current)
              }
            }, delay)
          } else if (currentLobbyCodeRef.current && reconnectAttemptsRef.current >= 5) {
            // Desconectar del lobby después de muchos intentos fallidos
            if (onDisconnectCallbackRef.current && currentLobbyCodeRef.current) {
              onDisconnectCallbackRef.current(currentLobbyCodeRef.current).catch(console.error)
            }
          }
        },
        onStompError: (frame) => {
          setError(`Error STOMP: ${frame.headers["message"] || "Error desconocido"}`)
          setIsConnected(false)
        },
        onWebSocketError: (event) => {
          setError("Error de conexión WebSocket")
          setIsConnected(false)
        },
      })

      // Configurar headers de autenticación si es necesario
      if (token) {
        client.configure({
          connectHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      }

      client.activate()
      clientRef.current = client
    },
    [user]
  )

  const disconnect = useCallback(async () => {
    // Limpiar timeout de reconexión
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Ejecutar callback de desconexión si existe
    if (onDisconnectCallbackRef.current && currentLobbyCodeRef.current) {
      try {
        await onDisconnectCallbackRef.current(currentLobbyCodeRef.current)
      } catch (err) {
        console.error("Error en callback de desconexión:", err)
      }
    }

    if (chatSubscriptionRef.current) {
      chatSubscriptionRef.current.unsubscribe()
      chatSubscriptionRef.current = null
    }
    if (readySubscriptionRef.current) {
      readySubscriptionRef.current.unsubscribe()
      readySubscriptionRef.current = null
    }
    if (gameSubscriptionRef.current) {
      gameSubscriptionRef.current.unsubscribe()
      gameSubscriptionRef.current = null
    }
    if (playersSubscriptionRef.current) {
      playersSubscriptionRef.current.unsubscribe()
      playersSubscriptionRef.current = null
    }

    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
    }

    setIsConnected(false)
    setMessages([])
    setPlayers([])
    setReadyPlayers(new Set())
    reconnectAttemptsRef.current = 0
    currentLobbyCodeRef.current = null
    onDisconnectCallbackRef.current = undefined
  }, [])

  const sendMessage = useCallback(
    (message: string) => {
      if (!clientRef.current?.connected || !currentLobbyCodeRef.current) {
        setError("No conectado al lobby")
        return
      }

      clientRef.current.publish({
        destination: `/app/lobby/${currentLobbyCodeRef.current}/chat`,
        body: JSON.stringify({ message }),
      })
    },
    []
  )

  const toggleReady = useCallback(() => {
    if (!clientRef.current?.connected || !currentLobbyCodeRef.current) {
      setError("No conectado al lobby")
      return
    }

    clientRef.current.publish({
      destination: `/app/lobby/${currentLobbyCodeRef.current}/ready`,
    })
  }, [])

  const startGame = useCallback(() => {
    if (!clientRef.current?.connected || !currentLobbyCodeRef.current) {
      setError("No conectado al lobby")
      return
    }

    clientRef.current.publish({
      destination: `/app/lobby/${currentLobbyCodeRef.current}/start`,
    })
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const updatePlayers = useCallback((newPlayers: string[]) => {
    setPlayers(newPlayers)
  }, [])

  const setOnDisconnectCallback = useCallback((callback: (lobbyCode: string) => Promise<void>) => {
    onDisconnectCallbackRef.current = callback
  }, [])

  const value: LobbySocketContextValue = {
    isConnected,
    error,
    messages,
    players,
    readyPlayers,
    connect,
    disconnect,
    sendMessage,
    toggleReady,
    startGame,
    updatePlayers,
    onDisconnectCallback: setOnDisconnectCallback,
  }

  return <LobbySocketContext.Provider value={value}>{children}</LobbySocketContext.Provider>
}

export function useLobbySocket() {
  const context = useContext(LobbySocketContext)
  if (!context) {
    throw new Error("useLobbySocket debe usarse dentro de LobbySocketProvider")
  }
  return context
}

