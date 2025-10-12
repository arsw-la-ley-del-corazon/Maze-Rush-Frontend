import { useState } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Divider,
  Stack,
} from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EmailIcon from "@mui/icons-material/Email"
import LockIcon from "@mui/icons-material/Lock"
import Loader from "../../components/Loader"
import styles from "./SignUpPage.module.css"

import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/useAuth"
import PersonIcon from "@mui/icons-material/Person"

const SignUpPage = () => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { register, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }
    
    if (!register) {
      setError("Función de registro no disponible")
      return
    }
    
    const result = await register(username, email, password)
    if (result.ok) {
      navigate("/app")
    } else {
      setError(result.error || "Error al registrar usuario")
    }
  }

  return (
    <Box className={styles.root}>
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
      <Paper elevation={0} className={styles.card}>
        <Typography
          variant="h4"
          fontWeight="bold"
          align="center"
          mb={1}
          className={styles.titleGradient}
        >
          Crear cuenta
        </Typography>
        <Typography variant="body2" align="center" mb={3} sx={{ color: "rgba(255,255,255,0.72)" }}>
          Regístrate para unirte a las partidas y competir.
        </Typography>
        {error && (
          <Typography variant="body2" color="error" align="center" mb={2}>
            {error}
          </Typography>
        )}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Nombre de Usuario"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            variant="outlined"
            InputProps={{
              startAdornment: <PersonIcon sx={{ mr: 1, color: "rgba(255,255,255,0.4)" }} />,
            }}
            className={styles.textField}
          />
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: "rgba(255,255,255,0.4)" }} />,
              }}
              className={`${styles.textField} ${styles.passwordField}`}
            />
            <TextField
              label="Confirmar"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: "rgba(255,255,255,0.4)" }} />,
              }}
              className={`${styles.textField} ${styles.passwordField}`}
              error={confirm.length > 0 && confirm !== password}
              helperText={confirm.length > 0 && confirm !== password ? "No coincide" : " "}
            />
          </Stack>
          <FormControlLabel
            control={
              <Checkbox
                sx={{ color: "rgba(255,255,255,0.4)", "&.Mui-checked": { color: "#38f2a4" } }}
              />
            }
            label={<Typography sx={{ color: "rgba(255,255,255,0.7)" }}>Acepto términos</Typography>}
          />
          <Button
            type="submit"
            disabled={loading || !email || !password || password !== confirm}
            fullWidth
            className={styles.submitBtn}
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>
        </Box>
        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>
            O
          </Typography>
        </Divider>
        <Typography align="center" variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
          ¿Ya tienes cuenta?{" "}
          <Button component={RouterLink} to="/login" variant="text" className={styles.linkLink}>
            Inicia sesión
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

export default SignUpPage
