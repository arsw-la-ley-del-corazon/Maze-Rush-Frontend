import { Box, Paper, Typography, Button, Stack, Chip, Tooltip } from "@mui/material"
import { useSocket } from "../../context/SocketContext"
import { useEffect } from "react"

export default function QuickPlayPage() {
  const { status, quickPlayPlayers, joinQuickPlay, leaveQuickPlay, joinedQuickPlay } = useSocket()

  useEffect(() => {
    // Auto join al entrar para experiencia rápida
    if (!joinedQuickPlay) joinQuickPlay()
    return () => {
      // Auto leave al salir de la vista
      if (joinedQuickPlay) leaveQuickPlay()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const colorByStatus: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    idle: 'default',
    connecting: 'warning',
    open: 'success',
    closed: 'default',
    error: 'error',
  }

  return (
    <Box>
      <Stack spacing={3} mb={4}>
        <Typography variant="h4" fontWeight={700}>
          Juego Rápido
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 760, color: 'rgba(255,255,255,0.72)' }}>
          Emparejamiento instantáneo. Mientras esperas que se llene la sala, puedes abandonar en cualquier momento.
        </Typography>
      </Stack>
      <Paper elevation={0} sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6" fontWeight={600}>Estado conexión:</Typography>
          <Chip
            label={status === 'open' ? 'Conectado' : status}
            color={colorByStatus[status]}
            variant={status === 'open' ? 'filled' : 'outlined'}
            sx={{ textTransform: 'capitalize' }}
          />
          <Tooltip title="Jugadores (real o simulado) que están también en modalidad Juego Rápido">
            <Chip
              label={quickPlayPlayers === null ? '—' : `${quickPlayPlayers} jugador${quickPlayPlayers === 1 ? '' : 'es'}`}
              color="info"
              variant="outlined"
            />
          </Tooltip>
        </Stack>
        <Box>
          {joinedQuickPlay ? (
            <Button variant="outlined" color="secondary" onClick={leaveQuickPlay} sx={{ mr: 2 }}>
              Salir de la cola
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={joinQuickPlay} sx={{ mr: 2 }}>
              Unirse ahora
            </Button>
          )}
          <Button variant="text" disabled>
            Iniciar partida (backend pendiente)
          </Button>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Modo demo: si no existe backend WebSocket, el contador se sincroniza entre pestañas usando BroadcastChannel.
        </Typography>
      </Paper>
    </Box>
  )
}
