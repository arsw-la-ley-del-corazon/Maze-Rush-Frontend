import { Box, Typography, Paper, Stack } from "@mui/material"
import PlayCircleIcon from "@mui/icons-material/PlayCircle"
import GroupAddIcon from "@mui/icons-material/GroupAdd"
import KeyIcon from "@mui/icons-material/VpnKey"
import AccountCircleIcon from "@mui/icons-material/AccountCircle"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import SettingsIcon from "@mui/icons-material/Settings"
import styles from "./DashboardPage.module.css"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/useAuth"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
}

function FeatureCard({ icon, title, desc, onClick }: FeatureCardProps) {
  return (
    <Paper elevation={0} className={styles.cardInteractive} onClick={onClick}>
      <Box sx={{ p: 2.6, display: "flex", flexDirection: "column", height: "100%" }}>
        <div className={styles.iconWrap}>{icon}</div>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.68)" }}>
          {desc}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" sx={{ mt: 2, opacity: 0.6 }}>
          Abrir →
        </Typography>
      </Box>
    </Paper>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  return (
    <Box>
      <Stack spacing={3} mb={4}>
        <Typography variant="h4" fontWeight={700} className={styles.headlineGradient}>
          ¡Bienvenido {user?.username}! ⚡
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 760, color: "rgba(255,255,255,0.72)" }}>
          Elige una opción para empezar. Crea un lobby para tus amigos, únete con un código o
          lánzate a un juego rápido. Tu meta: dominar el laberinto antes que los demás.
        </Typography>
      </Stack>
      <Box className={styles.grid}>
        <FeatureCard
          icon={<PlayCircleIcon color="primary" sx={{ fontSize: 32 }} />}
          title="Juego Rápido"
          desc="Emparejamiento rápido con jugadores disponibles."
          onClick={() => navigate("/app/quick-play")}
        />
        <FeatureCard
          icon={<GroupAddIcon color="secondary" sx={{ fontSize: 32 }} />}
          title="Crear Lobby"
          desc="Configura tamaño y comparte el código."
          onClick={() => navigate("/app/create-lobby")}
        />
        <FeatureCard
          icon={<KeyIcon color="primary" sx={{ fontSize: 32 }} />}
          title="Unirse con Código"
          desc="Introduce un código para unirte a un lobby privado."
          onClick={() => navigate("/app/join")}
        />
        <FeatureCard
          icon={<AccountCircleIcon color="secondary" sx={{ fontSize: 32 }} />}
          title="Mi Perfil"
          desc="Edita tu identidad y preferencias."
          onClick={() => navigate("/app/profile")}
        />
        <FeatureCard
          icon={<EmojiEventsIcon color="primary" sx={{ fontSize: 32 }} />}
          title="Leaderboard"
          desc="Clasificaciones (próximamente)."
          onClick={() => navigate("/app/leaderboard")}
        />
        <FeatureCard
          icon={<SettingsIcon color="secondary" sx={{ fontSize: 32 }} />}
          title="Configuración"
          desc="Ajustes de experiencia (futuro)."
          onClick={() => navigate("/app/settings")}
        />
      </Box>
    </Box>
  )
}
