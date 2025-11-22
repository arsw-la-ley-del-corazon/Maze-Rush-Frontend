import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { CircularProgress } from "@mui/material"
import { useLobbySocket } from "../../context/LobbySocketContext"
import { getLobbyByCode, leaveLobby } from "./services/lobbyService"
import { useAuth } from "../../context/useAuth"
import type { LobbyWithPlayersResponse } from "../../types/api"
import styles from "./LobbyPage.module.css"

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    isConnected,
    error: socketError,
    messages,
    players: socketPlayers,
    readyPlayers,
    connect,
    disconnect,
    sendMessage,
    toggleReady,
    startGame,
    updatePlayers,
    setOnDisconnectCallback,
  } = useLobbySocket()

  const [lobby, setLobby] = useState<LobbyWithPlayersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isHost = lobby?.creatorUsername === user?.username
  const isReady = readyPlayers.has(user?.username || "")

  useEffect(() => {
    if (!code) {
      navigate("/app")
      return
    }

    loadLobby()

    // Configurar callback de desconexión para salir del lobby automáticamente
    if (setOnDisconnectCallback && code) {
      setOnDisconnectCallback(async (lobbyCode: string) => {
        try {
          await leaveLobby(lobbyCode)
        } catch (err) {
          console.error("Error al salir del lobby automáticamente:", err)
        }
      })
    }

    return () => {
      disconnect()
    }
  }, [code, setOnDisconnectCallback, disconnect])

  useEffect(() => {
    if (lobby && !isConnected) {
      connect(code!)
    }
  }, [lobby, isConnected, code, connect])

  // Actualizar lista de jugadores periódicamente y cuando se reciben mensajes
  useEffect(() => {
    if (!code || !lobby) return

    const interval = setInterval(() => {
      loadLobby()
    }, 3000) // Actualizar cada 3 segundos

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // Actualizar lista de jugadores cuando cambia el lobby
  useEffect(() => {
    if (lobby && lobby.players) {
      updatePlayers(lobby.players)
    }
  }, [lobby, updatePlayers])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadLobby = async () => {
    if (!code) return

    setLoading(true)
    setError(null)

    const result = await getLobbyByCode(code)

    if (result.ok) {
      setLobby(result.data)
      setLoading(false)
    } else {
      setError(result.error.message || "Error al cargar el lobby")
      setLoading(false)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !isConnected) return

    sendMessage(messageInput.trim())
    setMessageInput("")
  }

  const handleLeave = async () => {
    if (!code) return

    const result = await leaveLobby(code)
    if (result.ok) {
      disconnect()
      navigate("/app")
    }
  }

  const handleStartGame = () => {
    if (isHost && readyPlayers.size >= 2) {
      startGame()
      // Aquí puedes navegar a la página del juego cuando esté lista
      // navigate(`/app/game/${code}`)
    }
  }

  // Usar jugadores del lobby si están disponibles, sino usar los del socket
  const currentPlayers = (lobby?.players && lobby.players.length > 0) ? lobby.players : socketPlayers
  const allPlayersReady = currentPlayers.length >= 2 && currentPlayers.every((p) => readyPlayers.has(p))

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <CircularProgress sx={{ color: '#4cffb3' }} />
      </div>
    )
  }

  if (error || !lobby) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2 className={styles.errorTitle}>⚠️ Error</h2>
          <p className={styles.errorMessage}>{error || "Lobby no encontrado"}</p>
          <button onClick={() => navigate("/app")} className={styles.primaryButton}>
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.lobbyInfo}>
            <h1 className={styles.lobbyTitle}>
              <span className={styles.lobbyLabel}>Lobby</span>
              <span className={styles.lobbyCode}>{lobby.code}</span>
            </h1>
            <div className={styles.badges}>
              <span className={styles.badge}>🎯 Laberinto: {lobby.mazeSize}</span>
              <span className={`${styles.badge} ${currentPlayers.length === lobby.maxPlayers ? styles.badgeFull : ''}`}>
                {isConnected && <span className={styles.statusDot} />}
                👥 {currentPlayers.length}/{lobby.maxPlayers} Jugadores
              </span>
              <span className={styles.badge}>
                {lobby.isPublic ? '🌍 Público' : '🔒 Privado'}
              </span>
            </div>
          </div>
          <button onClick={handleLeave} className={styles.leaveButton}>
            <span>🚪</span>
            Salir
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Panel de Jugadores */}
        <div className={styles.playersPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>👥 Jugadores</h2>
            <span className={styles.playerCount}>{currentPlayers.length}/{lobby.maxPlayers}</span>
          </div>

          <div className={styles.playersList}>
            {currentPlayers.length === 0 ? (
              <p className={styles.emptyMessage}>No hay jugadores conectados</p>
            ) : (
              currentPlayers.map((player) => (
                <div
                  key={player}
                  className={`${styles.playerCard} ${player === user?.username ? styles.playerCardMe : ''}`}
                >
                  <div className={styles.playerInfo}>
                    <div className={styles.playerAvatar}>
                      {player.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.playerDetails}>
                      <span className={styles.playerName}>{player}</span>
                      {player === lobby.creatorUsername && (
                        <span className={styles.hostBadge}>👑 Host</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.playerStatus}>
                    {readyPlayers.has(player) ? (
                      <span className={styles.statusReady}>✓ Listo</span>
                    ) : (
                      <span className={styles.statusNotReady}>○ Esperando</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Botón de acción */}
          <div className={styles.actionSection}>
            {isHost ? (
              <>
                <button
                  onClick={handleStartGame}
                  disabled={!allPlayersReady || !isConnected}
                  className={`${styles.primaryButton} ${styles.startButton} ${!allPlayersReady || !isConnected ? styles.buttonDisabled : ''}`}
                >
                  <span>▶</span>
                  Iniciar Juego
                </button>
                {!allPlayersReady && (
                  <p className={styles.helperText}>
                    Todos los jugadores deben estar listos
                  </p>
                )}
              </>
            ) : (
              <button
                onClick={toggleReady}
                disabled={!isConnected}
                className={`${isReady ? styles.secondaryButton : styles.primaryButton} ${!isConnected ? styles.buttonDisabled : ''}`}
              >
                <span>{isReady ? '✓' : '○'}</span>
                {isReady ? 'No Listo' : 'Listo'}
              </button>
            )}
          </div>
        </div>

        {/* Panel de Chat */}
        <div className={styles.chatPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>💬 Chat en Vivo</h2>
            {isConnected ? (
              <span className={styles.statusConnected}>● Conectado</span>
            ) : (
              <span className={styles.statusDisconnected}>○ Desconectado</span>
            )}
          </div>

          {/* Alertas */}
          {socketError && (
            <div className={styles.alert}>
              ⚠️ {socketError}
            </div>
          )}

          {!isConnected && (
            <div className={styles.alertReconnecting}>
              <CircularProgress size={16} sx={{ color: '#4cffb3' }} />
              <span>Reconectando...</span>
            </div>
          )}

          {/* Mensajes */}
          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <p className={styles.emptyChat}>
                No hay mensajes aún. ¡Sé el primero en escribir!
              </p>
            ) : (
              <div className={styles.messagesList}>
                {messages.map((msg, idx) => {
                  const isSystem = "isSystem" in msg && msg.isSystem
                  const isMe = msg.username === user?.username
                  return (
                    <div
                      key={idx}
                      className={`${styles.message} ${
                        isSystem ? styles.messageSystem :
                        isMe ? styles.messageMe : styles.messageOther
                      }`}
                    >
                      <div className={styles.messageHeader}>
                        <span className={styles.messageUsername}>
                          {isSystem ? '🤖' : isMe ? '👤' : '👥'} {msg.username}
                        </span>
                        {msg.timestamp && (
                          <span className={styles.messageTime}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <p className={styles.messageText}>{msg.message}</p>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input de mensaje */}
          <form onSubmit={handleSendMessage} className={styles.chatForm}>
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={!isConnected}
              className={styles.chatInput}
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || !isConnected}
              className={`${styles.sendButton} ${!messageInput.trim() || !isConnected ? styles.buttonDisabled : ''}`}
            >
              📤
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

