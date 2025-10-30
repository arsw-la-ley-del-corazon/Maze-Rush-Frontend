import { Box, Paper, Typography, Button, Stack, Chip, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, TextField, InputAdornment, IconButton, Tooltip, Alert } from "@mui/material"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import PersonIcon from "@mui/icons-material/Person"
import ExitToAppIcon from "@mui/icons-material/ExitToApp"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import SettingsIcon from "@mui/icons-material/Settings"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import { useSocket } from "../../context/SocketContext"
import { useAuth } from "../../context/useAuth"
import axios from "../../common/AxiosIntance"
import styles from "./LobbyPage.module.css"

interface Player {
  id: string
  username: string
  isReady: boolean
  isHost: boolean
}

export default function LobbyPage() {
  const navigate = useNavigate()
  const { lobbyCode } = useParams<{ lobbyCode: string }>()
  const { user } = useAuth()
  const { status, send, subscribe, unsubscribe } = useSocket()

  // Estado del lobby (sin simulación)
  const [players, setPlayers] = useState<Player[]>([])
  const [isReady, setIsReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [lobbySettings, setLobbySettings] = useState({
    maxPlayers: 4,
    isPrivate: true,
  })

  const [chatMessages, setChatMessages] = useState<{ username: string; message: string }[]>([])
  const [chatText, setChatText] = useState("")

  const currentPlayer = players.find((p) => p.id === user?.id)
  const isHost = currentPlayer?.isHost || false
  const allPlayersReady = players.every((p) => p.isReady) && players.length >= 2

  useEffect(() => {
    if (!lobbyCode) return

    // Obtener estado inicial del lobby por REST
    axios.get(`/lobby/${lobbyCode}`)
      .then(res => {
        const data = res.data
        if (data.maxPlayers) {
          setLobbySettings({
            maxPlayers: data.maxPlayers,
            isPrivate: !!data.isPrivate,
          })
        }
        if (Array.isArray(data.players)) {
          setPlayers(data.players.map((p: any) => ({
            id: p.id,
            username: p.username,
            isReady: !!p.isReady,
            isHost: !!p.isHost,
          })))
          
          // Establecer mi estado ready si ya estoy en el lobby
          const me = data.players.find((p: any) => p.id === user?.id)
          if (me) {
            setIsReady(!!me.isReady)
          }
        }
      })
      .catch(err => {
        console.warn('No se pudo obtener el lobby:', err)
      })

    // Suscripciones STOMP
    const base = `/topic/lobby/${lobbyCode}`

    const handleJoinLeft = (payload: any) => {
      if (!payload) return
      const action = payload.action
      const player = payload.player
      if (action === 'joined' && player) {
        setPlayers(prev => [...prev, {
          id: player.id,
          username: player.username,
          isReady: !!player.isReady,
          isHost: !!player.isHost,
        }])
      } else if (action === 'left' && player) {
        setPlayers(prev => prev.filter(p => p.id !== player.id))
      } else if (action === 'lobby_closed') {
        // Volver al dashboard si el host cerró el lobby
        navigate('/app/dashboard')
      }
    }

    const handleReady = (payload: any) => {
      if (!payload) return
      setPlayers(prev => prev.map(p => p.id === payload.playerId ? { ...p, isReady: !!payload.isReady } : p))
      if (user && payload.playerId === user.id) setIsReady(!!payload.isReady)
    }

    const handleChat = (payload: any) => {
      if (!payload) return
      setChatMessages(prev => [...prev, { username: payload.username, message: payload.message }])
    }

    const handleGame = (payload: any) => {
      if (payload === 'starting') {
        navigate(`/app/game/${lobbyCode}`)
      }
    }

    try {
      subscribe(base, handleJoinLeft)
      subscribe(base + '/ready', handleReady)
      subscribe(base + '/chat', handleChat)
      subscribe(base + '/game', handleGame)
    } catch (e) {
      // ignore subscribe errors
    }

    // Notify server we connected to lobby WS (optional)
    try { send({}, `/app/lobby/${lobbyCode}/connect`) } catch {}

    return () => {
      try {
        unsubscribe(base)
        unsubscribe(base + '/ready')
        unsubscribe(base + '/chat')
        unsubscribe(base + '/game')
      } catch {}
    }
  }, [lobbyCode, navigate, send, subscribe, unsubscribe, user])

  const handleCopyCode = () => {
    if (lobbyCode) {
      navigator.clipboard.writeText(lobbyCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleReady = () => {
    const next = !isReady
    setIsReady(next)
    // Enviar toggle ready al servidor vía STOMP
    if (lobbyCode) {
      try {
        send({}, `/app/lobby/${lobbyCode}/ready`)
      } catch {}
    }
    // optimist update (will be overwritten by server event)
    setPlayers((prev) => prev.map((p) => p.id === user?.id ? { ...p, isReady: next } : p))
  }

  const handleLeaveLobby = () => {
    if (lobbyCode) {
      axios.post(`/lobby/leave/${lobbyCode}`).finally(() => {
        navigate('/app/dashboard')
      })
    } else {
      navigate('/app/dashboard')
    }
  }

  const handleStartGame = () => {
    if (isHost && allPlayersReady) {
      if (lobbyCode) {
        try { send({}, `/app/lobby/${lobbyCode}/start`) } catch {}
      }
    }
  }

  const handleSendChat = () => {
    if (!chatText || !lobbyCode) return
    try {
      send({ message: chatText }, `/app/lobby/${lobbyCode}/chat`)
      setChatText("")
    } catch {}
  }

  const colorByStatus: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
    idle: "default",
    connecting: "warning",
    open: "success",
    closed: "default",
    error: "error",
  }

  return (
    <Box>
      <Stack spacing={3} mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={700} className={styles.headlineGradient}>
            Sala de Espera
          </Typography>
          <Stack direction="row" spacing={2}>
            <Chip
              label={status === "open" ? "Conectado" : status}
              color={colorByStatus[status]}
              variant={status === "open" ? "filled" : "outlined"}
              size="small"
              sx={{ textTransform: "capitalize" }}
            />
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ExitToAppIcon />}
              onClick={handleLeaveLobby}
              size="small"
            >
              Salir
            </Button>
          </Stack>
        </Box>
        <Typography variant="body1" sx={{ maxWidth: 760, color: "rgba(255,255,255,0.72)" }}>
          Comparte el código con tus amigos. Cuando todos estén listos, el host puede iniciar la
          partida.
        </Typography>
      </Stack>

      <Box className={styles.grid}>
        {/* Panel izquierdo: Código y configuración */}
        <Paper elevation={0} className={styles.panel}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Código de Sala
              </Typography>
              <TextField
                fullWidth
                value={lobbyCode || "LOADING"}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={copied ? "¡Copiado!" : "Copiar código"}>
                        <IconButton onClick={handleCopyCode} edge="end">
                          {copied ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ContentCopyIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                sx={{ fontFamily: "monospace", fontSize: "1.2rem", letterSpacing: 2 }}
              />
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                <SettingsIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                Configuración
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Jugadores máximos
                  </Typography>
                  <Chip label={lobbySettings.maxPlayers} color="primary" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Modo
                  </Typography>
                  <Chip
                    label={lobbySettings.isPrivate ? "Privado" : "Público"}
                    color={lobbySettings.isPrivate ? "secondary" : "info"}
                    size="small"
                  />
                </Box>
              </Stack>
            </Box>

            {isHost && (
              <>
                <Divider />
                <Alert severity="info" variant="outlined">
                  Eres el host. Puedes iniciar la partida cuando todos estén listos.
                </Alert>
              </>
            )}
          </Stack>
        </Paper>

        {/* Panel derecho: Lista de jugadores */}
        <Paper elevation={0} className={styles.panel}>
          <Stack spacing={3} sx={{ height: "100%" }}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Jugadores ({players.length}/{lobbySettings.maxPlayers})
              </Typography>
              <List sx={{ py: 0 }}>
                {players.map((player, index) => (
                  <Box key={player.id}>
                    {index > 0 && <Divider sx={{ my: 1 }} />}
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: player.isReady ? "success.main" : "grey.700",
                            transition: "all 0.3s ease",
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight={500}>
                              {player.username}
                            </Typography>
                            {player.isHost && (
                              <Chip label="Host" color="primary" size="small" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            sx={{
                              color: player.isReady ? "success.main" : "text.secondary",
                              fontWeight: player.isReady ? 600 : 400,
                            }}
                          >
                            {player.isReady ? "✓ Listo" : "Esperando..."}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Box>

              {/* Chat del lobby */}
              <Box sx={{ maxHeight: 200, overflowY: 'auto', bgcolor: 'rgba(0,0,0,0.06)', p: 1, borderRadius: 1 }}>
                {chatMessages.map((m, i) => (
                  <Box key={i} sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{m.username}: </Typography>
                    <Typography variant="body2" component="span" sx={{ ml: 1 }}>{m.message}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ mt: 1 }}>
                <TextField
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  size="small"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleSendChat} edge="end">Enviar</IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              <Box sx={{ flexGrow: 1 }} />

            {/* Botones de acción */}
            <Stack spacing={2}>
              {!isHost && (
                <Button
                  variant={isReady ? "outlined" : "contained"}
                  color={isReady ? "secondary" : "primary"}
                  size="large"
                  fullWidth
                  onClick={handleToggleReady}
                  startIcon={isReady ? <CheckCircleIcon /> : undefined}
                >
                  {isReady ? "Cancelar listo" : "Estoy listo"}
                </Button>
              )}

              {isHost && (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleStartGame}
                  disabled={!allPlayersReady}
                  startIcon={<PlayArrowIcon />}
                  className={allPlayersReady ? styles.pulseButton : ""}
                >
                  {allPlayersReady ? "¡Iniciar Partida!" : "Esperando jugadores..."}
                </Button>
              )}

              {isHost && !allPlayersReady && (
                <Typography variant="caption" sx={{ textAlign: "center", opacity: 0.6 }}>
                  Necesitas al menos 2 jugadores listos para comenzar
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}
