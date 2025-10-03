
import { useState } from "react"
import { Box, Button, TextField, Typography, Paper, Checkbox, FormControlLabel, Divider } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'

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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', bgcolor: 'background.default', p: 2, overflow: 'hidden' }}>
      {/* Fondo animado */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <Box sx={{ position: 'absolute', top: '33%', left: '33%', width: 300, height: 300, bgcolor: 'primary.main', opacity: 0.05, borderRadius: '50%', filter: 'blur(48px)', animation: 'pulseGlow 2s infinite' }} />
      </Box>

      {/* Botón volver */}
      <Button
        component={RouterLink}
        to="/"
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{ position: 'absolute', top: 32, left: 32, color: 'text.secondary', zIndex: 2 }}
      >
        Volver
      </Button>

      {/* Card de login */}
      <Paper elevation={3} sx={{ width: '100%', maxWidth: 400, p: 4, position: 'relative', zIndex: 1, borderRadius: 3, backdropFilter: 'blur(8px)' }}>
        <Typography variant="h4" fontWeight="bold" align="center" mb={1}>Bienvenido de nuevo</Typography>
        <Typography variant="body2" color="text.secondary" align="center" mb={3}>
          Ingresa tus credenciales para acceder a tu cuenta
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            fullWidth
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            InputProps={{ startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            fullWidth
          />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <FormControlLabel control={<Checkbox />} label={<Typography color="text.secondary">Recordarme</Typography>} />
            <Button component={RouterLink} to="/forgot-password" variant="text" sx={{ color: 'primary.main', textTransform: 'none' }}>
              ¿Olvidaste tu contraseña?
            </Button>
          </Box>
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ fontWeight: 'bold', height: 48 }}>
            Iniciar sesión
          </Button>
        </Box>
        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">O</Typography>
        </Divider>
        <Typography align="center" variant="body2" color="text.secondary">
          ¿No tienes cuenta?{' '}
          <Button component={RouterLink} to="/signup" variant="text" sx={{ color: 'primary.main', fontWeight: 'bold', textTransform: 'none' }}>
            Regístrate
          </Button>
        </Typography>
      </Paper>
    </Box>
  )
}
