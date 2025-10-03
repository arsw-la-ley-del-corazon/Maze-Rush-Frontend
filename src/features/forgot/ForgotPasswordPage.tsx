import { useState } from 'react'
import { Box, Button, TextField, Typography, Paper, Divider } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import Loader from '../../components/Loader'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); setSent(true) }, 1600)
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', px: 2,
      background: `linear-gradient(135deg, #0d1f2e 0%, #12344a 45%, #1a4963 70%, #1f5a74 100%)`,
      '&:before': {
        content: '""', position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 20% 25%, rgba(255,255,255,0.10), rgba(255,255,255,0) 55%),
                     radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08), rgba(255,255,255,0) 60%)`,
        mixBlendMode: 'overlay', pointerEvents: 'none'
      },
      '&:after': {
        content: '""', position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 80px),
                     repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 80px)`,
        opacity: 0.17, pointerEvents: 'none', backgroundSize: '160px 160px,160px 160px', animation: 'gridMove 28s linear infinite'
      },
      '@keyframes gridMove': { '0%': { backgroundPosition: '0px 0px, 0px 0px' }, '50%': { backgroundPosition: '80px 80px, 0px 40px' }, '100%': { backgroundPosition: '160px 160px, 0px 0px' } },
      '@keyframes cardIn': { '0%': { opacity: 0, transform: 'translateY(18px) scale(.97)' }, '60%': { opacity: 1 }, '100%': { opacity: 1, transform: 'translateY(0) scale(1)' } }
    }}>
      <Button component={RouterLink} to="/login" variant="text" startIcon={<ArrowBackIcon />} sx={{ position: 'absolute', top: 32, left: 32, color: 'rgba(255,255,255,0.7)', zIndex: 3, fontWeight: 'bold', textTransform: 'none', '&:hover': { color: '#fff' } }}>Volver</Button>
      <Paper elevation={0} sx={{
        width: '100%', maxWidth: 460, p: { xs: 3.5, sm: 5 }, position: 'relative', zIndex: 2, borderRadius: 4,
        background: 'rgba(16,40,56,0.55)', backdropFilter: 'blur(18px) saturate(160%)', WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 26px -6px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset', overflow: 'hidden', animation: 'cardIn 900ms cubic-bezier(.16,.84,.44,1)'
      }}>
        <Typography variant="h4" fontWeight="bold" align="center" mb={1} sx={{ background: 'linear-gradient(90deg,#38f2a4 0%, #4ae46d 22%, #48d43c 42%, #4fb3ff 68%, #c87dff 92%)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Recuperar contraseña</Typography>
        <Typography variant="body2" align="center" mb={3} sx={{ color: 'rgba(255,255,255,0.72)' }}>
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
        </Typography>
        {!sent && (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth variant="outlined" InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.4)' }} /> }} sx={fieldSx} />
            <Button type="submit" disabled={loading || !email} fullWidth sx={submitButtonSx}>{loading ? 'Enviando...' : 'Enviar enlace'}</Button>
          </Box>
        )}
        {sent && (
          <Box textAlign="center" mt={2}>
            <Typography variant="h6" sx={{ color: '#38f2a4', fontWeight: 'bold', mb: 1 }}>Email enviado</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>Revisa tu bandeja de entrada (y spam) para continuar.</Typography>
            <Button component={RouterLink} to="/login" sx={{ mt: 3, color: '#4fb3ff', fontWeight: 'bold', '&:hover': { color: '#38f2a4' } }}>Volver a iniciar sesión</Button>
          </Box>
        )}
        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>O</Typography>
        </Divider>
        {!sent && <Typography align="center" variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>¿Recordaste tu contraseña? <Button component={RouterLink} to="/login" variant="text" sx={{ color: '#4fb3ff', fontWeight: 'bold', textTransform: 'none', '&:hover': { color: '#38f2a4' } }}>Inicia sesión</Button></Typography>}
        {loading && <Box mt={4} display="flex" justifyContent="center"><Loader /></Box>}
      </Paper>
    </Box>
  )
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    backdropFilter: 'blur(4px)', background: 'rgba(255,255,255,0.04)', borderRadius: 3,
    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
    '&:hover fieldset': { borderColor: '#38f2a4' },
    '&.Mui-focused fieldset': { borderColor: '#4fb3ff' }
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
  '& .MuiInputBase-input': { color: '#fff' }
}

const submitButtonSx = {
  fontWeight: 'bold', height: 54, fontSize: '1.05rem', borderRadius: 999,
  background: 'linear-gradient(145deg,#27b38d 0%, #34c15d 45%, #48d43c 100%)', color: '#031b24',
  textShadow: '0 1px 0 rgba(255,255,255,0.45)',
  boxShadow: '0 4px 12px -2px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12) inset', transition: 'all .35s cubic-bezier(.16,.84,.44,1)', position: 'relative', overflow: 'hidden',
  '&:before': { content: '""', position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.35) 100%)', mixBlendMode: 'overlay', opacity: 0, transition: 'opacity .4s' },
  '&:hover': { background: 'linear-gradient(145deg,#2fc79e 0%, #47d46b 45%, #66e751 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 18px -4px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.18) inset' },
  '&:hover:before': { opacity: 1 },
  '&:active': { transform: 'translateY(0)', boxShadow: '0 4px 10px -2px rgba(0,0,0,0.55) inset' },
  '&.Mui-disabled': { opacity: .5, color: '#0d1f2e' }
}

export default ForgotPasswordPage
