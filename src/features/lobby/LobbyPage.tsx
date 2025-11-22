import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Chip,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import ExitToAppIcon from "@mui/icons-material/ExitToApp"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked"
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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !lobby) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", py: 4 }}>
        <Alert severity="error">{error || "Lobby no encontrado"}</Alert>
        <Button onClick={() => navigate("/app")} sx={{ mt: 2 }}>
          Volver al Dashboard
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: 4, px: 2 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Lobby: {lobby.code}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`Laberinto: ${lobby.mazeSize}`} size="small" />
                <Chip
                label={`${currentPlayers.length}/${lobby.maxPlayers} Jugadores`}
                size="small"
                color={currentPlayers.length === lobby.maxPlayers ? "success" : "primary"}
                icon={
                  isConnected ? (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "success.main",
                        ml: 0.5,
                      }}
                    />
                  ) : undefined
                }
              />
                <Chip label={lobby.isPublic ? "Público" : "Privado"} size="small" variant="outlined" />
              </Stack>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ExitToAppIcon />}
              onClick={handleLeave}
            >
              Salir
            </Button>
          </Stack>
        </Paper>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {/* Panel de Jugadores */}
          <Paper sx={{ p: 3, flex: 1, minWidth: 300 }}>
            <Typography variant="h6" gutterBottom>
              Jugadores
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              {currentPlayers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay jugadores conectados
                </Typography>
              ) : (
                currentPlayers.map((player) => (
                  <Stack
                    key={player}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: player === user?.username ? "action.selected" : "transparent",
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Tooltip title={player === user?.username ? "Tú" : player}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                          {player.charAt(0).toUpperCase()}
                        </Avatar>
                      </Tooltip>
                      <Box>
                        <Typography variant="body1" fontWeight={player === user?.username ? 600 : 400}>
                          {player}
                        </Typography>
                        {player === lobby.creatorUsername && (
                          <Chip label="Host" size="small" sx={{ mt: 0.5, height: 20 }} />
                        )}
                      </Box>
                    </Stack>
                    <Tooltip title={readyPlayers.has(player) ? "Listo" : "No listo"}>
                      {readyPlayers.has(player) ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <RadioButtonUncheckedIcon color="disabled" />
                      )}
                    </Tooltip>
                  </Stack>
                ))
              )}
            </Stack>

            {isHost && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStartGame}
                  disabled={!allPlayersReady || !isConnected}
                >
                  Iniciar Juego
                </Button>
                {!allPlayersReady && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Todos los jugadores deben estar listos
                  </Typography>
                )}
              </Box>
            )}

            {!isHost && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant={isReady ? "outlined" : "contained"}
                  fullWidth
                  onClick={toggleReady}
                  disabled={!isConnected}
                  startIcon={isReady ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                >
                  {isReady ? "No Listo" : "Listo"}
                </Button>
              </Box>
            )}
          </Paper>

          {/* Panel de Chat */}
          <Paper sx={{ p: 3, flex: 1, minWidth: 300, display: "flex", flexDirection: "column", height: 600 }}>
            <Typography variant="h6" gutterBottom>
              Chat en Vivo
            </Typography>
            <Divider sx={{ my: 2 }} />

            {socketError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {socketError}
              </Alert>
            )}

            {!isConnected && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2">Reconectando...</Typography>
                </Stack>
              </Alert>
            )}

            {/* Mensajes */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                mb: 2,
                p: 1,
                bgcolor: "background.default",
                borderRadius: 1,
                maxHeight: 400,
              }}
              className={styles.chatContainer}
            >
              {messages.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  No hay mensajes aún. ¡Sé el primero en escribir!
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {messages.map((msg, idx) => {
                    const isSystem = "isSystem" in msg && msg.isSystem
                    return (
                      <Box
                        key={idx}
                        sx={{
                          p: isSystem ? 1 : 1.5,
                          borderRadius: 2,
                          bgcolor: isSystem
                            ? "warning.dark"
                            : msg.username === user?.username
                            ? "primary.dark"
                            : "action.hover",
                          alignSelf: msg.username === user?.username ? "flex-end" : "flex-start",
                          maxWidth: isSystem ? "100%" : "80%",
                          opacity: isSystem ? 0.8 : 1,
                          border: isSystem ? "1px solid" : "none",
                          borderColor: isSystem ? "warning.main" : "transparent",
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={isSystem ? 500 : 600}
                          display="block"
                          gutterBottom
                          color={isSystem ? "warning.contrastText" : "inherit"}
                        >
                          {msg.username}
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: isSystem ? "italic" : "normal" }}>
                          {msg.message}
                        </Typography>
                        {msg.timestamp && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </Typography>
                        )}
                      </Box>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </Stack>
              )}
            </Box>

            {/* Input de mensaje */}
            <form onSubmit={handleSendMessage}>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Escribe un mensaje..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={!isConnected}
                />
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={!messageInput.trim() || !isConnected}
                >
                  <SendIcon />
                </IconButton>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  )
}

