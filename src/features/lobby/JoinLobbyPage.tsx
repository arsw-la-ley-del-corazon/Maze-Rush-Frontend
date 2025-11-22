import { useState } from "react"
import {
  Paper,
  Stack,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import { joinLobby } from "./services/lobbyService"
import styles from "./JoinLobbyPage.module.css"

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
    <div className={styles.container}>
      {/* Patrón de laberinto animado */}
      <div className={styles.mazePattern} />
      
      {/* Partículas decorativas */}
      <div className={styles.particles}>
        <div className={styles.particle} />
        <div className={styles.particle} />
        <div className={styles.particle} />
        <div className={styles.particle} />
        <div className={styles.particle} />
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Unirse al Juego</h1>
        <p className={styles.subtitle}>
          Ingresa el código que te compartió el anfitrión
        </p>

        <Paper className={styles.paper}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Instrucciones visuales */}
              <div className={styles.instructions}>
                <div className={styles.instructionIcon}>🎮</div>
                <div className={styles.instructionText}>
                  <div className={styles.instructionTitle}>¿Cómo funciona?</div>
                  <div className={styles.instructionSubtitle}>
                    El anfitrión te compartirá un código único de 6 caracteres. 
                    Ingrésalo aquí para unirte a la partida.
                  </div>
                </div>
              </div>

              {/* Ejemplo visual del código */}
              <div className={styles.exampleSection}>
                <div className={styles.exampleLabel}>Ejemplo de código</div>
                <div className={styles.exampleCode}>ABC123</div>
              </div>

              {/* Input del código */}
              <div className={styles.codeInputWrapper}>
                <TextField
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                    setError(null)
                  }}
                  placeholder="------"
                  fullWidth
                  required
                  variant="outlined"
                  inputProps={{ 
                    maxLength: 6,
                    "aria-label": "Código del Lobby"
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.5rem',
                      textAlign: 'center',
                      fontFamily: "'Courier New', monospace",
                      background: 'rgba(10, 14, 39, 0.5)',
                      borderRadius: '16px',
                      color: '#4cffb3',
                      '& fieldset': {
                        borderColor: 'rgba(76, 255, 179, 0.3)',
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(76, 255, 179, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(76, 255, 179, 0.6)',
                        boxShadow: '0 0 30px rgba(76, 255, 179, 0.2)',
                      },
                      '& input': {
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        padding: '1rem',
                      },
                      '& input::placeholder': {
                        color: 'rgba(76, 255, 179, 0.3)',
                        opacity: 1,
                      }
                    }
                  }}
                />
                <div className={styles.characterCounter}>
                  <span>{code.length}</span> / 6 caracteres
                </div>
              </div>

              {/* Alert de error */}
              {error && (
                <Alert severity="error" className={styles.errorAlert}>
                  {error}
                </Alert>
              )}

              {/* Botones de acción */}
              <div className={styles.buttonGroup}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/app")}
                  className={styles.cancelButton}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={loading || code.length !== 6}
                  className={styles.joinButton}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: "#0a0e27" }} />
                  ) : (
                    <>🚀 Unirse al Lobby</>
                  )}
                </Button>
              </div>
            </Stack>
          </form>
        </Paper>
      </div>
    </div>
  )
}

