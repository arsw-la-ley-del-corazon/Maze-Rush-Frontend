import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  Alert,
} from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import GoogleIcon from "@mui/icons-material/Google"
import Loader from "../../components/Loader"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/useAuth"
import { GOOGLE_CONFIG } from "../../common/globas"
import styles from "./LoginPage.module.css"

// Declaración para el objeto global de Google
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: "outline" | "filled_blue" | "filled_black"
              size?: "large" | "medium" | "small"
              text?: "signin_with" | "signup_with" | "continue_with" | "signin"
              shape?: "rectangular" | "pill" | "circle" | "square"
              logo_alignment?: "left" | "center"
              width?: string
            }
          ) => void
          prompt: () => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const [error, setError] = useState("")
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const navigate = useNavigate()
  const { loginWithGoogle, loading } = useAuth()

  useEffect(() => {
    // Cargar el script de Google Identity Services
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => setGoogleLoaded(true)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (!googleLoaded || !window.google) return

    const googleClientId = GOOGLE_CONFIG.CLIENT_ID

    if (!googleClientId) {
      setError("Configuración de Google OAuth no disponible. Por favor, agrega VITE_GOOGLE_CLIENT_ID en tu archivo .env")
      return
    }

    // Inicializar Google Identity Services
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    // Renderizar el botón de Google
    const buttonDiv = document.getElementById("google-signin-button")
    if (buttonDiv) {
      window.google.accounts.id.renderButton(buttonDiv, {
        theme: "filled_blue",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: "100%",
      })
    }
  }, [googleLoaded])

  const handleGoogleResponse = async (response: { credential: string }) => {
    setError("")
    
    const result = await loginWithGoogle(response.credential)
    if (result.ok) {
      navigate("/app")
    } else {
      setError(result.error || "Error de autenticación con Google")
    }
  }

  return (
    <Box className={styles.root}>
      {/* Halo animado detrás */}
      <Box className={styles.halo} />

      {/* Botón volver */}
      <Button
        component={RouterLink}
        to="/"
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{
          position: "absolute",
          top: 32,
          left: 32,
          color: "rgba(255,255,255,0.7)",
          zIndex: 3,
          fontWeight: "bold",
          textTransform: "none",
          "&:hover": { color: "#fff" },
        }}
      >
        Volver
      </Button>

      {/* Card de login estilizada */}
      <Paper elevation={0} className={styles.card}>
        <Typography
          variant="h4"
          fontWeight="bold"
          align="center"
          mb={1}
          className={styles.titleGradient}
        >
          Bienvenido a Maze Rush
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.72)" align="center" mb={3}>
          Inicia sesión con tu cuenta de Google para comenzar
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box mb={3} display="flex" justifyContent="center">
            <Loader />
          </Box>
        )}

        {!loading && (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
              {/* Botón de Google renderizado por Google Identity Services */}
              <Box
                id="google-signin-button"
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  minHeight: "44px",
                }}
              />

              {!googleLoaded && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  disabled
                  sx={{
                    py: 1.5,
                    borderColor: "rgba(255,255,255,0.3)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Cargando Google Sign-In...
                </Button>
              )}
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>
                AUTENTICACIÓN SEGURA
              </Typography>
            </Divider>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 2 }}>
                Al continuar, aceptas nuestros términos de servicio y política de privacidad.
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                🔒 Autenticación segura proporcionada por Google
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}
