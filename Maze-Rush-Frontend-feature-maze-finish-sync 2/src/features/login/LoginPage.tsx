import { useState, useEffect, useRef } from "react"
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
  const googleButtonRef = useRef<HTMLDivElement>(null)
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

    // Renderizar el botón de Google en un div oculto
    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "filled_blue",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: "400",
      })
    }
  }, [googleLoaded])

  const handleGoogleResponse = async (response: { credential: string }) => {
    setError("")
    
    try {
      const result = await loginWithGoogle(response.credential)
      if (result.ok) {
        navigate("/app")
      } else {
        setError(result.error || "Error de autenticación con Google")
      }
    } catch (err) {
      console.error("Error durante autenticación:", err)
      setError("No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080")
    }
  }

  const handleGoogleSignIn = () => {
    if (!googleButtonRef.current) {
      setError("Google Identity Services no está cargado")
      return
    }
    
    // Hacer click en el botón invisible de Google
    const googleButton = googleButtonRef.current.querySelector('div[role="button"]') as HTMLElement
    if (googleButton) {
      googleButton.click()
    }
  }

  return (
    <Box className={styles.root}>
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
          color: "rgba(0, 255, 255, 0.8)",
          zIndex: 3,
          fontWeight: "bold",
          textTransform: "none",
          textShadow: "0 0 8px rgba(0, 255, 255, 0.6)",
          transition: "all 0.3s ease",
          "&:hover": { 
            color: "#00ffff",
            textShadow: "0 0 12px rgba(0, 255, 255, 1)",
            transform: "translateX(-4px)",
          },
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
        <Typography 
          variant="body2" 
          align="center" 
          mb={3}
          sx={{ 
            color: "rgba(0, 255, 255, 0.7)",
            textShadow: "0 0 8px rgba(0, 255, 255, 0.3)"
          }}
        >
          Inicia sesión con tu cuenta de Google para comenzar
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: "rgba(255, 0, 0, 0.1)",
              border: "1px solid rgba(255, 0, 0, 0.3)",
              color: "#ff6666",
              "& .MuiAlert-icon": {
                color: "#ff4444"
              }
            }}
          >
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, alignItems: "center" }}>
              {/* Botón personalizado de Google con diseño neón cian */}
              <Button
                fullWidth
                onClick={handleGoogleSignIn}
                disabled={!googleLoaded}
                className={styles.googleBtn}
                startIcon={
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0, 255, 255, 0.15)",
                      borderRadius: "6px",
                      padding: "4px",
                      border: "1px solid rgba(0, 255, 255, 0.3)",
                    }}
                  >
                    <GoogleIcon sx={{ color: "#00ffff", fontSize: 18 }} />
                  </Box>
                }
                sx={{
                  py: 1.75,
                  fontSize: "1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  letterSpacing: "0.5px",
                }}
              >
                {googleLoaded ? "Continuar con Google" : "Cargando Google..."}
              </Button>

              {/* Indicador visual de estado */}
              {googleLoaded && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(0, 255, 255, 0.9)",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    fontWeight: 600,
                    textShadow: "0 0 8px rgba(0, 255, 255, 0.6)",
                  }}
                >
                  <span style={{ fontSize: "10px", animation: "pulse 2s ease-in-out infinite" }}>●</span> 
                  Listo para iniciar sesión
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 3, borderColor: "rgba(0, 255, 255, 0.2)" }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: "rgba(0, 255, 255, 0.6)", 
                  letterSpacing: 2,
                  fontWeight: 600,
                  textShadow: "0 0 8px rgba(0, 255, 255, 0.3)"
                }}
              >
                AUTENTICACIÓN SEGURA
              </Typography>
            </Divider>

            <Box sx={{ textAlign: "center" }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "rgba(255, 255, 255, 0.7)", 
                  mb: 2,
                  lineHeight: 1.6
                }}
              >
                Al continuar, aceptas nuestros términos de servicio y política de privacidad.
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: "rgba(0, 255, 255, 0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  textShadow: "0 0 8px rgba(0, 255, 255, 0.3)"
                }}
              >
                🔒 Autenticación segura proporcionada por Google
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Div oculto con el botón real de Google */}
      <Box
        ref={googleButtonRef}
        sx={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      />
    </Box>
  )
}
