// src/features/auth/LoginPage.tsx
import { useState, useEffect, useRef } from "react"
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  Alert,
} from "@mui/material"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import GoogleIcon from "@mui/icons-material/Google"
import Loader from "../../components/Loader"
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
            itp_support?: boolean
            ux_mode?: "popup" | "redirect"
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
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean
            isSkippedMoment: () => boolean
            isDismissedMoment: () => boolean
            getNotDisplayedReason: () => string
            getSkippedReason: () => string
            getDismissedReason: () => string
          }) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const [error, setError] = useState("")
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const initAttempts = useRef(0)
  const navigate = useNavigate()
  const { loginWithGoogle, loading } = useAuth()

  // 1️⃣ Cargar script de Google una sola vez y NO eliminarlo
  useEffect(() => {
    // ¿Ya existe el script?
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-identity="true"]',
    )

    if (existingScript) {
      // Si ya está y window.google existe, marcamos como cargado
      if (window.google?.accounts?.id) {
        setGoogleLoaded(true)
      }
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = "true"
    script.onload = () => {
      console.log("[LoginPage] Google Identity script cargado")
      setGoogleLoaded(true)
    }
    script.onerror = () => {
      console.error("[LoginPage] Error cargando script de Google")
      setError("No se pudo cargar Google Identity Services. Revisa tu conexión.")
    }

    document.head.appendChild(script)

    // ⚠️ NO lo eliminamos en el cleanup para evitar problemas con StrictMode
  }, [])

  // 2️⃣ Inicializar el botón de Google cuando el script esté listo
  useEffect(() => {
    if (!googleLoaded) return
    if (!window.google?.accounts?.id) {
      console.warn("[LoginPage] googleLoaded=true pero window.google.accounts.id no está disponible aún")
      return
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        // Reintentar si aún no está disponible
        if (initAttempts.current < 10) {
          initAttempts.current++
          setTimeout(initializeGoogle, 300)
        } else {
          setError("No se pudo inicializar Google. Por favor, recarga la página.")
        }
        return
      }

    if (!googleClientId) {
      console.error("[LoginPage] VITE_GOOGLE_CLIENT_ID no está configurado")
      setError(
        "Configuración de Google OAuth no disponible. Por favor, agrega VITE_GOOGLE_CLIENT_ID en tu archivo .env",
      )
      return
    }

    console.log("[LoginPage] Inicializando Google Identity con CLIENT_ID:", googleClientId)

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "filled_blue",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: "400",
      })
    }

    initializeGoogle()
  }, [googleLoaded, isInitialized, handleGoogleResponse])

  const handleGoogleSignIn = useCallback(() => {
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
      setError(
        "No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080",
      )
    }

  const handleGoogleSignIn = () => {
    setError("")

    if (!googleLoaded || !window.google?.accounts?.id) {
      setError("Google Identity Services no está completamente cargado todavía")
      return
    }

    if (!googleButtonRef.current) {
      setError("No se encontró el contenedor del botón de Google")
      return
    }

    const googleButton = googleButtonRef.current.querySelector(
      'div[role="button"]',
    ) as HTMLElement | null

    if (googleButton) {
      googleButton.click()
    } else {
      // Fallback: abrir prompt de Google
      try {
        window.google.accounts.id.prompt()
      } catch (e) {
        console.error("[LoginPage] Error lanzando prompt de Google:", e)
        setError("No se pudo iniciar el flujo de Google")
      }
    }

    // Si no hay botón renderizado, usar prompt() como fallback
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason()
        console.log("Prompt no mostrado:", reason)
        setError("No se pudo mostrar el diálogo de Google. Intenta recargar la página.")
      } else if (notification.isSkippedMoment()) {
        console.log("Prompt saltado:", notification.getSkippedReason())
      } else if (notification.isDismissedMoment()) {
        console.log("Prompt cerrado:", notification.getDismissedReason())
      }
    })
  }, [isInitialized])

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
            textShadow: "0 0 8px rgba(0, 255, 255, 0.3)",
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
                color: "#ff4444",
              },
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
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
                alignItems: "center",
              }}
            >
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
                  <span
                    style={{
                      fontSize: "10px",
                      animation: "pulse 2s ease-in-out infinite",
                    }}
                  >
                    ●
                  </span>
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
                  textShadow: "0 0 8px rgba(0, 255, 255, 0.3)",
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
                  lineHeight: 1.6,
                }}
              >
                Al continuar, aceptas nuestros términos de servicio y política
                de privacidad.
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(0, 255, 255, 0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  textShadow: "0 0 8px rgba(0, 255, 255, 0.3)",
                }}
              >
                🔒 Autenticación segura proporcionada por Google
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Contenedor del botón real de Google (oculto, usado como fallback) */}
      <Box
        ref={googleButtonRef}
        sx={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </Box>
  )
}
