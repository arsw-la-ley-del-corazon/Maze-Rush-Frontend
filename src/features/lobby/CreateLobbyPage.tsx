import { Box, Paper, Typography, Button, Stack, TextField, MenuItem, Alert, FormControl, InputLabel, Select, type SelectChangeEvent } from "@mui/material"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import AddCircleIcon from "@mui/icons-material/AddCircle"
import GroupIcon from "@mui/icons-material/Group"
import LockIcon from "@mui/icons-material/Lock"
import PublicIcon from "@mui/icons-material/Public"
import styles from "./CreateLobbyPage.module.css"

export default function CreateLobbyPage() {
  const navigate = useNavigate()
  const [maxPlayers, setMaxPlayers] = useState("4")
  const [isPrivate, setIsPrivate] = useState(true)
  const [lobbyName, setLobbyName] = useState("")
  const [creating, setCreating] = useState(false)

  const handleMaxPlayersChange = (event: SelectChangeEvent) => {
    setMaxPlayers(event.target.value)
  }

  const handleCreateLobby = async () => {
    setCreating(true)
    
    // TODO: Llamar al backend para crear el lobby
    // Simulación de creación
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    const mockLobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Navegar al lobby creado
    navigate(`/app/lobby/${mockLobbyCode}`)
  }

  return (
    <Box>
      <Stack spacing={3} mb={4}>
        <Typography variant="h4" fontWeight={700} className={styles.headlineGradient}>
          Crear Lobby
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 760, color: "rgba(255,255,255,0.72)" }}>
          Configura tu sala personalizada y comparte el código con tus amigos para jugar juntos.
        </Typography>
      </Stack>

      <Box className={styles.container}>
        <Paper elevation={0} className={styles.formPanel}>
          <Stack spacing={4}>
            {/* Nombre del lobby (opcional) */}
            <TextField
              label="Nombre del Lobby (Opcional)"
              placeholder="Mi sala épica"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
              fullWidth
              helperText="Dale un nombre personalizado a tu sala"
            />

            {/* Número de jugadores */}
            <FormControl fullWidth>
              <InputLabel id="max-players-label">Jugadores Máximos</InputLabel>
              <Select
                labelId="max-players-label"
                value={maxPlayers}
                label="Jugadores Máximos"
                onChange={handleMaxPlayersChange}
              >
                <MenuItem value="2">2 Jugadores</MenuItem>
                <MenuItem value="3">3 Jugadores</MenuItem>
                <MenuItem value="4">4 Jugadores</MenuItem>
                <MenuItem value="6">6 Jugadores</MenuItem>
                <MenuItem value="8">8 Jugadores</MenuItem>
              </Select>
            </FormControl>

            {/* Modo público/privado */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tipo de Sala
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant={isPrivate ? "contained" : "outlined"}
                  color="secondary"
                  fullWidth
                  startIcon={<LockIcon />}
                  onClick={() => setIsPrivate(true)}
                >
                  Privada
                </Button>
                <Button
                  variant={!isPrivate ? "contained" : "outlined"}
                  color="primary"
                  fullWidth
                  startIcon={<PublicIcon />}
                  onClick={() => setIsPrivate(false)}
                >
                  Pública
                </Button>
              </Stack>
              <Typography variant="caption" sx={{ mt: 1, display: "block", opacity: 0.7 }}>
                {isPrivate
                  ? "Solo jugadores con el código pueden unirse"
                  : "Cualquier jugador puede encontrar y unirse a tu sala"}
              </Typography>
            </Box>

            {/* Información adicional */}
            <Alert severity="info" variant="outlined" icon={<GroupIcon />}>
              Se generará un código único que podrás compartir con tus amigos.
            </Alert>

            {/* Botones */}
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => navigate("/app/dashboard")}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<AddCircleIcon />}
                onClick={handleCreateLobby}
                disabled={creating}
              >
                {creating ? "Creando..." : "Crear Lobby"}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Panel de vista previa */}
        <Paper elevation={0} className={styles.previewPanel}>
          <Stack spacing={3}>
            <Typography variant="h6" fontWeight={600}>
              Vista Previa
            </Typography>

            <Box className={styles.previewCard}>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Nombre
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {lobbyName || "Sin nombre"}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Jugadores
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    0 / {maxPlayers}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Tipo
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {isPrivate ? <LockIcon fontSize="small" /> : <PublicIcon fontSize="small" />}
                    <Typography variant="body1" fontWeight={500}>
                      {isPrivate ? "Privada" : "Pública"}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Typography variant="caption" sx={{ opacity: 0.6, textAlign: "center" }}>
              Así verán los demás jugadores tu lobby
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}
