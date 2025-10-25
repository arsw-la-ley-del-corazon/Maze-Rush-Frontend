import { useState } from "react"
import { Box, Button, TextField, Typography, Paper, Alert, InputAdornment, IconButton } from "@mui/material"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { Visibility, VisibilityOff } from "@mui/icons-material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import LockResetIcon from "@mui/icons-material/LockReset"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import { resetPassword } from "../login/services/realAuthService"
import styles from "./ForgotPasswordPage.module.css"

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    if (!token.trim()) {
      setError("El token es obligatorio")
      return
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      const result = await resetPassword({ token: token.trim(), newPassword })
      
      if (result.ok) {
        setSuccess(true)
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate("/login")
        }, 3000)
      } else {
        setError(result.error.message || "Error al restablecer la contraseña")
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
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <LockResetIcon sx={{ fontSize: 64, color: "#38f2a4", mb: 2 }} />
          <Typography
            variant="h4"
            fontWeight="bold"
            align="center"
            mb={1}
            className={styles.titleGradient}
          >
            Restablecer contraseña
          </Typography>
          <Typography variant="body2" align="center" sx={{ color: "rgba(255,255,255,0.72)" }}>
            Ingresa el token que recibiste y tu nueva contraseña
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!success ? (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Token de recuperación"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              fullWidth
              variant="outlined"
              placeholder="Copia el token de la consola del servidor"
              multiline
              rows={2}
              className={styles.textField}
              helperText="Revisa la consola del servidor backend para obtener el token"
            />

            <TextField
              label="Nueva contraseña"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
              className={styles.textField}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Mínimo 8 caracteres"
            />

            <TextField
              label="Confirmar contraseña"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
              className={styles.textField}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              disabled={loading || !token || !newPassword || !confirmPassword}
              fullWidth
              className={styles.submitBtn}
            >
              {loading ? "Restableciendo..." : "Restablecer contraseña"}
            </Button>

            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                ¿No tienes un token?{" "}
                <Button
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{ textTransform: "none", color: "#38f2a4" }}
                >
                  Solicitar uno
                </Button>
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box textAlign="center" mt={2}>
            <CheckCircleIcon sx={{ fontSize: 64, color: "#38f2a4", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "#38f2a4", fontWeight: "bold", mb: 1 }}>
              ¡Contraseña restablecida!
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", mb: 2 }}>
              Tu contraseña ha sido actualizada exitosamente.
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
              Serás redirigido al login en unos segundos...
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default ResetPasswordPage
