import { Box, Paper, Typography, Button, Stack, TextField, Alert } from "@mui/material"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import VpnKeyIcon from "@mui/icons-material/VpnKey"
import LoginIcon from "@mui/icons-material/Login"
import axios from "../../common/AxiosIntance"
import styles from "./JoinLobbyPage.module.css"

export default function JoinLobbyPage() {
  const navigate = useNavigate()
  const [lobbyCode, setLobbyCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    if (value.length <= 6) {
      setLobbyCode(value)
      setError(null)
    }
  }

  const handleJoinLobby = async () => {
    if (lobbyCode.length !== 6) {
      setError("El código debe tener 6 caracteres")
      return
    }

    setJoining(true)
    setError(null)

    try {
      await axios.post(`/lobby/join/${lobbyCode}`)
      
      // Si la unión fue exitosa, navegar al lobby
      navigate(`/app/lobby/${lobbyCode}`)
    } catch (err: any) {
      console.error("Error uniéndose al lobby:", err)
      const errorMessage = err.response?.data?.message || "Lobby no encontrado. Verifica el código e intenta de nuevo."
      setError(errorMessage)
      setJoining(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && lobbyCode.length === 6) {
      handleJoinLobby()
    }
  }

  return (
    <Box>
      <Stack spacing={3} mb={4}>
        <Typography variant="h4" fontWeight={700} className={styles.headlineGradient}>
          Unirse con Código
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 760, color: "rgba(255,255,255,0.72)" }}>
          Introduce el código de 6 caracteres que te compartió el host del lobby para unirte a la
          partida.
        </Typography>
      </Stack>

      <Box className={styles.container}>
        <Paper elevation={0} className={styles.joinPanel}>
          <Stack spacing={4} alignItems="center">
            <Box className={styles.iconContainer}>
              <VpnKeyIcon sx={{ fontSize: 64 }} color="primary" />
            </Box>

            <TextField
              label="Código del Lobby"
              placeholder="ABC123"
              value={lobbyCode}
              onChange={handleCodeChange}
              onKeyPress={handleKeyPress}
              error={!!error}
              helperText={error || `${lobbyCode.length}/6 caracteres`}
              fullWidth
              autoFocus
              sx={{
                "& input": {
                  textAlign: "center",
                  fontSize: "2rem",
                  letterSpacing: "0.5rem",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                },
              }}
            />

            {error && (
              <Alert severity="error" variant="outlined" sx={{ width: "100%" }}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => navigate("/app/dashboard")}
                disabled={joining}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<LoginIcon />}
                onClick={handleJoinLobby}
                disabled={lobbyCode.length !== 6 || joining}
              >
                {joining ? "Uniéndose..." : "Unirse"}
              </Button>
            </Stack>

            <Typography variant="caption" sx={{ opacity: 0.6, textAlign: "center" }}>
              Los códigos distinguen entre mayúsculas y minúsculas
            </Typography>
          </Stack>
        </Paper>

        {/* Panel de instrucciones */}
        <Paper elevation={0} className={styles.infoPanel}>
          <Stack spacing={3}>
            <Typography variant="h6" fontWeight={600}>
              💡 Consejos
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  1. Obtén el código
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pide al host del lobby que te comparta el código de 6 caracteres.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  2. Ingrésalo aquí
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Escribe el código exactamente como te lo compartieron.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  3. ¡Listo para jugar!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Una vez dentro, marca que estás listo y espera a que inicie la partida.
                </Typography>
              </Box>
            </Stack>

            <Alert severity="info" variant="outlined">
              Si el código no funciona, verifica que el lobby siga activo y que el código sea
              correcto.
            </Alert>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}
