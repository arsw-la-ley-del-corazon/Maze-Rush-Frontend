import { useState } from "react"
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import { joinLobby } from "./services/lobbyService"

export default function JoinLobbyPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError("Por favor ingresa un código de lobby")
      return
    }

    setLoading(true)
    setError(null)

    const result = await joinLobby(code.trim().toUpperCase())

    if (result.ok) {
      navigate(`/app/lobby/${result.data.code}`)
    } else {
      setError(result.error.message || "Error al unirse al lobby")
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>
          Unirse a un Lobby
        </Typography>

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Código del Lobby"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                  setError(null)
                }}
                placeholder="ABC123"
                fullWidth
                required
                inputProps={{ maxLength: 6, style: { textTransform: "uppercase" } }}
                helperText="Ingresa el código de 6 caracteres del lobby"
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
                <Button type="submit" variant="contained" disabled={loading || !code.trim()} fullWidth>
                  {loading ? <CircularProgress size={24} /> : "Unirse"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Box>
  )
}

