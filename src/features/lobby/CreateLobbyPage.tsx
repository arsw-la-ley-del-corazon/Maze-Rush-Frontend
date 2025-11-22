import { useState } from "react"
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import { createLobby } from "./services/lobbyService"
import type { LobbyRequest } from "../../types/api"

const MAZE_SIZES = ["Pequeño", "Mediano", "Grande"]

export default function CreateLobbyPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<LobbyRequest>({
    mazeSize: "Mediano",
    maxPlayers: 4,
    isPublic: true,
    status: "EN_ESPERA",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createLobby(formData)

    if (result.ok) {
      navigate(`/app/lobby/${result.data.code}`)
    } else {
      setError(result.error.message)
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>
          Crear Lobby
        </Typography>

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                select
                label="Tamaño del Laberinto"
                value={formData.mazeSize}
                onChange={(e) => setFormData({ ...formData, mazeSize: e.target.value })}
                fullWidth
                required
              >
                {MAZE_SIZES.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="number"
                label="Máximo de Jugadores"
                value={formData.maxPlayers}
                onChange={(e) =>
                  setFormData({ ...formData, maxPlayers: parseInt(e.target.value) || 2 })
                }
                inputProps={{ min: 2, max: 4 }}
                fullWidth
                required
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                }
                label="Lobby Público"
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Stack direction="row" spacing={2}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/app")}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" disabled={loading} fullWidth>
                  {loading ? <CircularProgress size={24} /> : "Crear Lobby"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Box>
  )
}

