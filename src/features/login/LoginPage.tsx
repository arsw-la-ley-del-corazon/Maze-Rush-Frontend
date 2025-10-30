/**
 * Página de inicio de sesión
 * Permite al usuario autenticarse mediante Google OAuth2
 */

import {
  Box,
  Button,
  Typography,
  Paper,
} from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import GoogleIcon from "@mui/icons-material/Google"
import Loader from "../../components/Loader"
import { useAuth } from "../../context/useAuth"
import { useGoogleLogin } from "../auth/hooks"
import styles from "./LoginPage.module.css"

/**
 * Componente de página de login con autenticación de Google
 */
export default function LoginPage() {
  const { loading } = useAuth()
  const { handleGoogleLogin } = useGoogleLogin()

  return (
    <Box className={styles.root}>
      {/* Halo animado detrás */}
      <Box className={styles.halo} />

      {/* Botón volver NEÓN CIAN */}
      <Button
        component={RouterLink}
        to="/"
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{
          position: "absolute",
          top: 32,
          left: 32,
          color: "#00ffff",
          zIndex: 3,
          fontWeight: "bold",
          textTransform: "none",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: "10px 20px",
          borderRadius: "12px",
          backdropFilter: "blur(10px)",
          border: "2px solid rgba(0, 255, 255, 0.5)",
          boxShadow: "0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(0, 255, 255, 0.05)",
          textShadow: "0 0 8px rgba(0, 255, 255, 0.8)",
          transition: "all 0.3s ease",
          "&:hover": { 
            color: "#ffffff",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            transform: "translateX(-4px)",
            borderColor: "rgba(0, 255, 255, 0.9)",
            boxShadow: "0 0 25px rgba(0, 255, 255, 0.7), inset 0 0 15px rgba(0, 255, 255, 0.15)",
            textShadow: "0 0 12px rgba(0, 255, 255, 1), 0 0 20px rgba(0, 200, 255, 0.8)",
          },
        }}
      >
        Volver
      </Button>

      {/* Card de login estilizada */}
      <Paper elevation={0} className={styles.card}>
        {/* Ícono animado NEÓN CIAN */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 3,
            animation: 'bounce 2.5s ease-in-out infinite',
            '@keyframes bounce': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-8px)' }
            }
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00ffff 0%, #00c8ff 50%, #00ffff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(0, 255, 255, 0.7), 0 0 50px rgba(0, 200, 255, 0.4)',
              animation: 'rotate 25s linear infinite, cianPulse 3s ease-in-out infinite',
              border: '2px solid rgba(0, 255, 255, 0.5)',
              '@keyframes rotate': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              },
              '@keyframes cianPulse': {
                '0%, 100%': { 
                  borderColor: 'rgba(0, 255, 255, 0.5)',
                  boxShadow: '0 0 25px rgba(0, 255, 255, 0.7), 0 0 50px rgba(0, 200, 255, 0.4)'
                },
                '50%': { 
                  borderColor: 'rgba(0, 255, 255, 0.9)',
                  boxShadow: '0 0 35px rgba(0, 255, 255, 1), 0 0 70px rgba(0, 200, 255, 0.6)'
                }
              }
            }}
          >
            <GoogleIcon sx={{ fontSize: '2.5rem', color: '#fff', filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))' }} />
          </Box>
        </Box>

        <Typography
          variant="h4"
          fontWeight="bold"
          align="center"
          mb={1}
          className={styles.titleGradient}
        >
          ¡Bienvenido!
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#00ffff', 
            fontWeight: 500,
            textShadow: '0 0 8px rgba(0, 255, 255, 0.7)',
            animation: 'fadeIn 1s ease-out 0.3s both, textGlowCian 4s ease-in-out infinite',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(10px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' }
            },
            '@keyframes textGlowCian': {
              '0%, 100%': { textShadow: '0 0 8px rgba(0, 255, 255, 0.7)' },
              '50%': { textShadow: '0 0 15px rgba(0, 255, 255, 1), 0 0 25px rgba(0, 200, 255, 0.6)' }
            }
          }} 
          align="center" 
          mb={4}
        >
          Inicia sesión con tu cuenta de Google para comenzar
        </Typography>

        {/* Botón de Google Sign-In */}
        <Button
          onClick={handleGoogleLogin}
          disabled={loading}
          fullWidth
          className={styles.submitBtn}
          startIcon={<GoogleIcon sx={{ fontSize: '1.8rem' }} />}
        >
          {loading ? "Conectando..." : "Continuar con Google"}
        </Button>

        <Typography 
          align="center" 
          variant="body2" 
          sx={{ 
            color: "#00ffff", 
            fontWeight: 500, 
            mt: 4,
            textShadow: "0 0 5px rgba(0, 255, 255, 0.6)",
            animation: 'fadeIn 1s ease-out 0.5s both',
            '@keyframes fadeIn': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 }
            }
          }}
        >
          ¿No tienes cuenta?{" "}
          <Button component={RouterLink} to="/signup" variant="text" className={styles.linkAlt}>
            Regístrate
          </Button>
        </Typography>
        {loading && (
          <Box mt={4} display="flex" justifyContent="center">
            <Loader />
          </Box>
        )}
      </Paper>
    </Box>
  )
}
