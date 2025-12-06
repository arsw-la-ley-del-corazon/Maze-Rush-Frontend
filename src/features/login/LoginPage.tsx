import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import GoogleIcon from "@mui/icons-material/Google"
import { Alert, Box, Button, Divider, Paper, Typography } from "@mui/material"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { GOOGLE_CONFIG } from "../../common/globas"
import Loader from "../../components/Loader"
import { useAuth } from "../../context/useAuth"
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
          prompt: (
            callback?: (notification: {
              isNotDisplayed: () => boolean
              isSkippedMoment: () => boolean
              isDismissedMoment: () => boolean
              getNotDisplayedReason: () => string
              getSkippedReason: () => string
              getDismissedReason: () => string
            }) => void
          ) => void
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

  // Callback estable para manejar la respuesta de Google
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
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
        setError("No se pudo conectar con el servidor. Verifica tu conexión a internet.")
      }
    },
    [loginWithGoogle, navigate]
  )

  // Cargar el script de Google Identity Services
  useEffect(() => {
    // Verificar si el script ya está cargado
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    )

    if (existingScript) {
      // El script ya existe, verificar si Google está disponible
      if (window.google?.accounts?.id) {
        setGoogleLoaded(true)
      } else {
        // Esperar a que se cargue
        existingScript.addEventListener("load", () => setGoogleLoaded(true))
      }
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true

    script.onload = () => {
      // Pequeño delay para asegurar que el objeto google esté disponible
      setTimeout(() => {
        if (window.google?.accounts?.id) {
          setGoogleLoaded(true)
        }
      }, 100)
    }

    script.onerror = () => {
      setError("No se pudo cargar Google Identity Services. Por favor, recarga la página.")
    }

    document.head.appendChild(script)

    return () => {
      // No remover el script en cleanup para evitar problemas de recarga
    }
  }, [])

  // Inicializar Google Identity Services cuando esté cargado
  useEffect(() => {
    if (!googleLoaded || isInitialized) return

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

      const googleClientId = GOOGLE_CONFIG.CLIENT_ID

      if (!googleClientId) {
        setError(
          "Configuración de Google OAuth no disponible. Por favor, verifica la configuración."
        )
        return
      }

      try {
        // Inicializar Google Identity Services con configuración optimizada
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          ux_mode: "popup",
        })

        // Renderizar el botón de Google
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "filled_blue",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: "400",
          })

          // Esperar un poco para asegurar que el botón esté renderizado
          setTimeout(() => {
            setIsInitialized(true)
          }, 200)
        } else {
          setIsInitialized(true)
        }
      } catch (err) {
        console.error("Error inicializando Google:", err)
        setError("Error al inicializar Google. Por favor, recarga la página.")
      }
    }

    initializeGoogle()
  }, [googleLoaded, isInitialized, handleGoogleResponse])

  const handleGoogleSignIn = useCallback(() => {
    setError("")

    if (!window.google?.accounts?.id) {
      setError("Google no está disponible. Por favor, recarga la página.")
      return
    }

    if (!isInitialized) {
      setError("Espera un momento, Google se está cargando...")
      return
    }

    // Intentar hacer click directo en el botón renderizado de Google
    // Esto es más confiable que usar prompt() en algunos navegadores
    if (googleButtonRef.current) {
      const googleButton = googleButtonRef.current.querySelector(
        'div[role="button"]'
      ) as HTMLElement
      if (googleButton) {
        googleButton.click()
        return
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
