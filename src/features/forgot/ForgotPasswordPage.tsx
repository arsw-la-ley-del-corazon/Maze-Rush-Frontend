import { useState } from "react"
import { Box, Button, TextField, Typography, Paper, Divider, Alert } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EmailIcon from "@mui/icons-material/Email"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import Loader from "../../components/Loader"
import { forgotPassword } from "../login/services/realAuthService"
import styles from "./ForgotPasswordPage.module.css"

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await forgotPassword({ email })
      
      if (result.ok) {
        setSent(true)
      } else {
        setError(result.error.message || "Error al enviar el correo")
      }
    } catch (err) {
      setError("Error de conexión. Por favor intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className={styles.root}>
      <Button
        component={RouterLink}
        to="/login"
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
      <Paper elevation={0} className={styles.card}>
        <Typography
          variant="h4"
          fontWeight="bold"
          align="center"
          mb={1}
          className={styles.titleGradient}
        >
          Recuperar contraseña
        </Typography>
        <Typography variant="body2" align="center" mb={3} sx={{ color: "rgba(255,255,255,0.72)" }}>
          Ingresa tu email y recibirás un token para restablecer tu contraseña.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!sent && (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: "rgba(255,255,255,0.4)" }} />,
              }}
              className={styles.textField}
            />
            <Button
              type="submit"
              disabled={loading || !email}
              fullWidth
              className={styles.submitBtn}
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </Box>
        )}
        {sent && (
          <Box textAlign="center" mt={2}>
            <CheckCircleIcon sx={{ fontSize: 64, color: "#38f2a4", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "#38f2a4", fontWeight: "bold", mb: 1 }}>
              Email enviado
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", mb: 2 }}>
              Revisa la <strong>consola del servidor</strong> para obtener tu token de recuperación.
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", display: "block", mb: 3 }}>
              En desarrollo, el token se muestra en la consola del backend.
            </Typography>
            <Button 
              component={RouterLink} 
              to="/reset-password" 
              variant="contained"
              sx={{ mt: 1, mb: 2 }}
              className={styles.submitBtn}
            >
              Ir a restablecer contraseña
            </Button>
            <Button 
              component={RouterLink} 
              to="/login" 
              sx={{ display: "block", mx: "auto" }} 
              className={styles.linkLink}
            >
              Volver a iniciar sesión
            </Button>
          </Box>
        )}
        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>
            O
          </Typography>
        </Divider>
        {!sent && (
          <Typography align="center" variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
            ¿Recordaste tu contraseña?{" "}
            <Button component={RouterLink} to="/login" variant="text" className={styles.linkLink}>
              Inicia sesión
            </Button>
          </Typography>
        )}
        {loading && (
          <Box mt={4} display="flex" justifyContent="center">
            <Loader />
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default ForgotPasswordPage
