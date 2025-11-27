import { useState, useEffect, useRef, useCallback } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { SOCKET_CONFIG } from "../common/globas"

interface RoomUpdate {
  code: string
  playerCount: number
  status: string
  lastUpdate: number
}

interface RoomUpdatesMap {
  [roomCode: string]: RoomUpdate
}

/**
 * Hook para recibir actualizaciones en tiempo real de las salas
 * Se suscribe a un topic global que notifica cambios en las salas públicas
 */
export function useRoomUpdates() {
  const [roomUpdates, setRoomUpdates] = useState<RoomUpdatesMap>({})
  const clientRef = useRef<Client | null>(null)

  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      console.log("⚠️ WebSocket ya está conectado")
      return
    }

    console.log("🔌 Intentando conectar WebSocket para actualizaciones de salas...")
    
    // Obtener token de autenticación (para uso futuro si se requiere autenticación)
    const authState = localStorage.getItem("auth_state")
    if (authState) {
      try {
        JSON.parse(authState)
      } catch {
        // Ignorar error de parsing
      }
    }

    const wsUrl = `${SOCKET_CONFIG.URL}/ws`
    console.log("📡 URL WebSocket:", wsUrl)
    
    const socket = new SockJS(wsUrl)
    const client = new Client({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("✅ WebSocket conectado exitosamente para room updates")
        
        // Suscribirse al topic de actualizaciones de salas públicas
        console.log("📬 Suscribiéndose a /topic/lobby/updates")
        client.subscribe("/topic/lobby/updates", (message) => {
          try {
            const update = JSON.parse(message.body) as RoomUpdate
            console.log("🔔 Actualización recibida:", update)
            setRoomUpdates((prev) => ({
              ...prev,
              [update.code]: {
                ...update,
                lastUpdate: Date.now(),
              },
            }))
          } catch (error) {
            console.error("❌ Error procesando actualización de sala:", error)
          }
        })
        console.log("✅ Suscripción completada")
      },
      onDisconnect: () => {
        console.log("⚠️ Desconectado del WebSocket de room updates")
      },
      onStompError: (frame) => {
        console.error("❌ Error STOMP en room updates:", frame)
      },
    })

    console.log("🚀 Activando cliente WebSocket...")
    client.activate()
    clientRef.current = client
  }, [])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return roomUpdates
}
