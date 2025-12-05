import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { useAuth } from "./useAuth"
import { SOCKET_CONFIG } from "../common/globas"
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

// Información del juego iniciado
export interface GameStartedInfo {
  lobbyCode: string
  mazeData: unknown
}

interface LobbySocketContextValue {
  isConnected: boolean
  error: string | null
  messages: (ChatMessage | SystemMessage)[]
  players: string[]
  readyPlayers: Set<string>
  gameStarted: GameStartedInfo | null
  connect: (lobbyCode: string) => void
  disconnect: () => void
  sendMessage: (message: string) => void
  toggleReady: () => void
  startGame: () => void
  updatePlayers: (players: string[]) => void
  setOnDisconnectCallback?: (callback: (lobbyCode: string) => Promise<void>) => void
  clearGameStarted: () => void
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
  const [gameStarted, setGameStarted] = useState<GameStartedInfo | null>(null)
  const currentLobbyCodeRef = useRef<string | null>(null)
  const processedMessageIdsRef = useRef<Set<string>>(new Set())
  const chatSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const readySubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const gameSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const playersSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const onDisconnectCallbackRef = useRef<((lobbyCode: string) => Promise<void>) | undefined>(undefined)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const clearGameStarted = useCallback(() => {
    setGameStarted(null)
  }, [])

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
          if (currentLobbyCodeRef.current && user?.username) {
            client.publish({
              destination: `/app/lobby/${currentLobbyCodeRef.current}/connect`,
              body: JSON.stringify({ username: user.username }),
            })
          }

          // Suscribirse a mensajes de chat
          if (currentLobbyCodeRef.current) {
            chatSubscriptionRef.current = client.subscribe(
              `/topic/lobby/${currentLobbyCodeRef.current}/chat`,
              (message: StompMessage) => {
                try {
                  const chatMessage: ChatMessage = JSON.parse(message.body)
                  
                  // Crear ID único para el mensaje basado en username, message y timestamp
                  const messageId = `${chatMessage.username}-${chatMessage.message}-${chatMessage.timestamp || Date.now()}`
                  
                  // Prevenir duplicación
                  if (!processedMessageIdsRef.current.has(messageId)) {
                    processedMessageIdsRef.current.add(messageId)
                    setMessages((prev) => [...prev, chatMessage])
                    
                    // Limpiar IDs antiguos (mantener solo los últimos 100)
                    if (processedMessageIdsRef.current.size > 100) {
                      const idsArray = Array.from(processedMessageIdsRef.current)
                      processedMessageIdsRef.current = new Set(idsArray.slice(-100))
                    }
                  }
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
                  console.log("Evento de ready recibido:", data)
                  
                  // El backend envía { username: string, isReady: boolean }
                  if (data.username) {
                    setReadyPlayers((prev) => {
                      const newSet = new Set(prev)
                      if (data.isReady !== false) {
                        // Si isReady es true o no está presente, asumimos que está listo
                        newSet.add(data.username)
                      } else {
                        newSet.delete(data.username)
                      }
                      console.log(`${data.username} está ${data.isReady ? 'listo' : 'no listo'}`)
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
                  console.log("Game event recibido:", data)
                  
                  if (data.action === "game_started") {
                    if (data.maze) {
                      // Guardar el laberinto en sessionStorage para usarlo en GamePage
                      sessionStorage.setItem(`maze_${data.lobbyCode}`, JSON.stringify(data.maze))
                      console.log("Laberinto compartido guardado para lobby:", data.lobbyCode)
                    }
                    
                    // Notificar al componente del lobby que el juego ha comenzado
                    // El componente manejará la navegación usando React Router
                    console.log("Juego iniciado, notificando al componente...")
                    setGameStarted({
                      lobbyCode: data.lobbyCode,
                      mazeData: data.maze
                    })
                  }
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
                  console.log("Evento de jugadores recibido:", data)
                  
                  if (data.players && Array.isArray(data.players)) {
                    setPlayers(data.players)
                    
                    // Agregar mensaje de sistema solo si hay acción específica
                    if (data.username && data.action && data.username !== "system") {
                      const systemMsg: SystemMessage = {
                        username: "Sistema",
                        message: data.action === "joined" 
                          ? `${data.username} se unió al lobby`
                          : data.action === "left"
                          ? `${data.username} salió del lobby`
                          : `Lista de jugadores actualizada`,
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
        onWebSocketError: (_event) => {
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
    processedMessageIdsRef.current.clear()
    reconnectAttemptsRef.current = 0
    currentLobbyCodeRef.current = null
    onDisconnectCallbackRef.current = undefined
  }, [])

  const sendMessage = useCallback(
    (message: string) => {
      if (!clientRef.current?.connected || !currentLobbyCodeRef.current || !user?.username) {
        setError("No conectado al lobby")
        return
      }

      clientRef.current.publish({
        destination: `/app/lobby/${currentLobbyCodeRef.current}/chat`,
        body: JSON.stringify({ message, username: user.username }),
      })
    },
    [user]
  )

  const toggleReady = useCallback(() => {
    if (!clientRef.current?.connected || !currentLobbyCodeRef.current || !user?.username) {
      setError("No conectado al lobby")
      return
    }

    clientRef.current.publish({
      destination: `/app/lobby/${currentLobbyCodeRef.current}/ready`,
      body: JSON.stringify({ username: user.username }),
    })
  }, [user])

  const startGame = useCallback(() => {
    if (!clientRef.current?.connected || !currentLobbyCodeRef.current || !user?.username) {
      setError("No conectado al lobby")
      return
    }

    clientRef.current.publish({
      destination: `/app/lobby/${currentLobbyCodeRef.current}/start`,
      body: JSON.stringify({ username: user.username }),
    })
  }, [user])

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
    gameStarted,
    connect,
    disconnect,
    sendMessage,
    toggleReady,
    startGame,
    updatePlayers,
    setOnDisconnectCallback,
    clearGameStarted,
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

