import { useState } from "react"
import { Box, Button, TextField, Typography, Paper, Checkbox, FormControlLabel, Divider } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EmailIcon from "@mui/icons-material/Email"
import LockIcon from "@mui/icons-material/Lock"
import Loader from "../../components/Loader"
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica de login
    console.log("Login:", { email, password })
    // navigate('/profile') // ejemplo de navegación tras login
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
          Bienvenido de nuevo
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.72)" align="center" mb={3}>
          Ingresa tus credenciales para acceder a tu cuenta
        </Typography>
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
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: "rgba(255,255,255,0.4)" }} />,
            }}
            fullWidth
            variant="outlined"
            className={styles.textField}
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: <LockIcon sx={{ mr: 1, color: "rgba(255,255,255,0.4)" }} />,
            }}
            fullWidth
            variant="outlined"
            className={`${styles.textField} ${styles.passwordField}`}
          />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <FormControlLabel
              control={
                <Checkbox
                  sx={{ color: "rgba(255,255,255,0.4)", "&.Mui-checked": { color: "#38f2a4" } }}
                />
              }
              label={<Typography sx={{ color: "rgba(255,255,255,0.7)" }}>Recordarme</Typography>}
            />
            <Button
              component={RouterLink}
              to="/forgot-password"
              variant="text"
              className={styles.linkLink}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </Box>
          <Button type="submit" fullWidth className={styles.submitBtn}>
            Iniciar sesión
          </Button>
        </Box>
        <Divider sx={{ my: 3, "& .MuiDivider-wrapper": { px: 2 } }}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>
            O
          </Typography>
        </Divider>
        <Typography align="center" variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
          ¿No tienes cuenta?{" "}
          <Button component={RouterLink} to="/signup" variant="text" className={styles.linkAlt}>
            Regístrate
          </Button>
        </Typography>
        <Box mt={4} display="flex" justifyContent="center">
          <Loader />
        </Box>
      </Paper>
    </Box>
  )
}
