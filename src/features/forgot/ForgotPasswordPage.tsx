import { useState } from "react"
import { Box, Button, TextField, Typography, Paper, Divider } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EmailIcon from "@mui/icons-material/Email"
import Loader from "../../components/Loader"
import styles from './ForgotPasswordPage.module.css'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 1600)
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
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
        </Typography>
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
            <Button type="submit" disabled={loading || !email} fullWidth className={styles.submitBtn}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </Box>
        )}
        {sent && (
          <Box textAlign="center" mt={2}>
            <Typography variant="h6" sx={{ color: "#38f2a4", fontWeight: "bold", mb: 1 }}>
              Email enviado
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)" }}>
              Revisa tu bandeja de entrada (y spam) para continuar.
            </Typography>
            <Button component={RouterLink} to="/login" sx={{ mt: 3 }} className={styles.linkLink}>
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
