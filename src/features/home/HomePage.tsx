import { Box, Button, Typography, Stack, Paper, Divider } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import BoltIcon from '@mui/icons-material/Bolt'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        // Fondo minimalista inspirado en la paleta del logo (azules profundos + acentos luminosos)
        background: `linear-gradient(135deg, #0d1f2e 0%, #12344a 45%, #1a4963 70%, #1f5a74 100%)`,
        '&:before': {
          content: '""',
            position: 'absolute',
            inset: 0,
            // Sutil textura radial para dar profundidad sin distraer
            background: `radial-gradient(circle at 20% 25%, rgba(255,255,255,0.10), rgba(255,255,255,0) 55%),
                         radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08), rgba(255,255,255,0) 60%)`,
            mixBlendMode: 'overlay',
            pointerEvents: 'none'
        },
        '&:after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          // Líneas muy ligeras (grid suave) para sensación de espacio tecnológico
          background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 80px),
                       repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 80px)`,
          opacity: 0.18,
          pointerEvents: 'none',
          backgroundSize: '160px 160px, 160px 160px',
          animation: 'gridMove 28s linear infinite'
        },
        // Viñeta oscura para centrar la atención (capa adicional dentro del contenedor principal)
        '& .vignette': {
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 48%, rgba(10,25,36,0) 0%, rgba(10,25,36,0.15) 55%, rgba(5,12,18,0.6) 100%)',
          pointerEvents: 'none',
          zIndex: 0
        },
        '@keyframes gridMove': {
          '0%': { backgroundPosition: '0px 0px, 0px 0px' },
          '50%': { backgroundPosition: '80px 80px, 0px 40px' },
          '100%': { backgroundPosition: '160px 160px, 0px 0px' }
        },
        '@keyframes panelIn': {
          '0%': { opacity: 0, transform: 'translateY(14px) scale(.985)' },
          '60%': { opacity: 1 },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' }
        },
        '@keyframes sheen': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '120% 50%' }
        },
        '@media (prefers-reduced-motion: reduce)': {
          '&:after': { animation: 'none' }
        }
      }}
    >
      {/* Fondo minimalista aplicado */}
  <Box className="vignette" />

      {/* Contenido principal */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          px: { xs: 2.5, sm: 4 },
          py: { xs: 4, sm: 6 },
          width: '100%',
          maxWidth: 960,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          borderRadius: 4,
          background: 'rgba(16,40,56,0.50)',
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 28px -6px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
          overflow: 'hidden',
          animation: 'panelIn 900ms cubic-bezier(.16,.84,.44,1) 40ms both',
          '&:before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.12), transparent 65%)',
            opacity: 0.55,
            pointerEvents: 'none'
          },
          '&:after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(115deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 68%, rgba(255,255,255,0.16) 100%)',
            mixBlendMode: 'overlay',
            opacity: 0.35,
            pointerEvents: 'none',
            backgroundSize: '220% 100%',
            animation: 'sheen 11s linear infinite'
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            '&:after': { animation: 'none' }
          },
          '&:hover': {
            background: 'rgba(20,48,66,0.56)',
            boxShadow: '0 10px 34px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset'
          }
        }}
      >
        <Stack spacing={6} alignItems="center" sx={{ width: '100%' }}>
        {/* Logo y título */}
        <Stack spacing={2} alignItems="center">
          <MazeLogo />
          <Typography
            variant="h2"
            align="center"
            fontWeight="bold"
            sx={{
              background: 'linear-gradient(90deg,#38f2a4 0%, #4ae46d 22%, #58d243 40%, #4fb3ff 63%, #c87dff 85%)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 2px 10px rgba(0,0,0,0.55)',
              fontSize: { xs: '2.4rem', sm: '3.2rem', md: '3.6rem' }
            }}
          >
            <Box component="span" color="primary.main" ml={2}>RUSH</Box>
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            sx={{ color: 'rgba(255,255,255,0.72)', maxWidth: 560 }}
          >
            Compite en tiempo real. Domina el laberinto.
          </Typography>
        </Stack>

        {/* Botones CTA */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', maxWidth: 400 }}>
          <Button
            component={RouterLink}
            to="/login"
            size="large"
            fullWidth
            sx={{
              fontWeight: 'bold',
              fontSize: '1.05rem',
              height: 56,
              borderRadius: 999,
              background: 'linear-gradient(145deg,#27b38d 0%, #34c15d 45%, #48d43c 100%)',
              color: '#031b24',
              textShadow: '0 1px 0 rgba(255,255,255,0.4)',
              boxShadow: '0 4px 12px -2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12) inset',
              transition: 'all .35s cubic-bezier(.16,.84,.44,1)',
              '&:hover': {
                background: 'linear-gradient(145deg,#2fc79e 0%, #47d46b 45%, #66e751 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 18px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.18) inset'
              },
              '&:active': { transform: 'translateY(0)', boxShadow: '0 4px 10px -2px rgba(0,0,0,0.55) inset' }
            }}
          >
            Jugar ahora
          </Button>
          <Button
            component={RouterLink}
            to="/signup"
            size="large"
            fullWidth
            sx={{
              fontWeight: 'bold',
              fontSize: '1.05rem',
              height: 56,
              borderRadius: 999,
              background: 'linear-gradient(145deg,#103144 0%, #123e52 50%, #15526c 100%)',
              color: '#e5f7ff',
              boxShadow: '0 4px 12px -2px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.15) inset',
              transition: 'all .35s cubic-bezier(.16,.84,.44,1)',
              '&:hover': {
                background: 'linear-gradient(145deg,#16445a 0%, #16506a 50%, #1a6487 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 18px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.22) inset'
              },
              '&:active': { transform: 'translateY(0)', boxShadow: '0 4px 10px -2px rgba(0,0,0,0.55) inset' }
            }}
          >
            Crear cuenta
          </Button>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={4} alignItems="center" mt={2}>
          <Stat icon={<EmojiEventsIcon color="primary" />} label="Jugadores" value="2-4" />
          <Divider orientation="vertical" flexItem />
          <Stat icon={<BoltIcon color="secondary" />} label="Latencia" value="<200ms" />
          <Divider orientation="vertical" flexItem />
          <Stat icon={<TrackChangesIcon color="primary" />} label="Laberintos" value="∞" />
        </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

function MazeLogo() {
  return (
    <Box
      component="img"
      src="/img/icono.png"
      alt="Logo Maze Rush"
      sx={{
        width: { xs: 160, sm: 260, md: 340, lg: 420 },
        objectFit: 'contain',
        mb: 1,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
      }}
    />
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Paper elevation={0} sx={{ px: 2, py: 1, bgcolor: 'background.paper', textAlign: 'center', minWidth: 80 }}>
      <Box sx={{ mb: 0.5 }}>{icon}</Box>
      <Typography variant="h5" fontWeight="bold">{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  )
}
