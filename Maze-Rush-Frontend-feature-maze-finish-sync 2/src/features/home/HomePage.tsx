import { Box, Button, Typography, Stack, Divider } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import BoltIcon from "@mui/icons-material/Bolt"
import TrackChangesIcon from "@mui/icons-material/TrackChanges"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import PersonAddIcon from "@mui/icons-material/PersonAdd"
import styles from "./HomePage.module.css"

export default function HomePage() {
  return (
    <Box className={styles.root}>
      {/* Fondo minimalista aplicado */}
      <Box className={styles.vignette} />

      {/* Contenido principal */}
      <Box className={styles.panel}>
        <Stack spacing={6} alignItems="center" sx={{ width: "100%" }}>
          {/* Logo y título */}
          <Stack spacing={2} alignItems="center">
            <MazeLogo />
            <Typography
              variant="h2"
              align="center"
              fontWeight="bold"
              className={styles.titleGradient}
              sx={{ fontSize: { xs: "2.8rem", sm: "3.6rem", md: "4.2rem" } }}
            >
              RUSH
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              sx={{ 
                color: '#00ffff', 
                maxWidth: 560, 
                fontWeight: 500, 
                fontSize: '1.1rem',
                textShadow: '0 0 8px rgba(0, 255, 255, 0.6)'
              }}
            >
              Corre contra el tiempo. Resuelve el laberinto. Vence a tus rivales.
            </Typography>
          </Stack>

          {/* Botones CTA */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ width: "100%", maxWidth: 400 }}
          >
            <Button
              component={RouterLink}
              to="/login"
              size="large"
              fullWidth
              className={styles.ctaPrimary}
              startIcon={<PlayArrowIcon />}
            >
              Jugar ahora
            </Button>
            <Button
              component={RouterLink}
              to="/signup"
              size="large"
              fullWidth
              className={styles.ctaSecondary}
              startIcon={<PersonAddIcon />}
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
        objectFit: "contain",
        mb: 1,
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
      }}
    />
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 80 }}>
      <Box sx={{ 
        mb: 1,
        display: 'flex',
        justifyContent: 'center',
        '& svg': { 
          fontSize: '2rem',
          color: '#00ffff',
          filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.7))'
        }
      }}>
        {icon}
      </Box>
      <Typography variant="h5" fontWeight="bold" sx={{ 
        color: '#00ffff',
        textShadow: '0 0 8px rgba(0, 255, 255, 0.6)'
      }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ 
        color: '#00c8ff', 
        fontWeight: 600,
        textShadow: '0 0 5px rgba(0, 200, 255, 0.4)'
      }}>
        {label}
      </Typography>
    </Box>
  )
}
