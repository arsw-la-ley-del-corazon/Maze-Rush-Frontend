import { useState, useEffect } from "react"
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Tooltip,
  Snackbar,
  Alert,
  LinearProgress,
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import SaveIcon from "@mui/icons-material/Save"
import RefreshIcon from "@mui/icons-material/Autorenew"
import styles from "./ProfilePage.module.css"
import { useAuth } from "../../context/useAuth"

const sizes: Array<{ label: string; desc: string }> = [
  { label: "Pequeño", desc: "Partidas rápidas" },
  { label: "Mediano", desc: "Equilibrado" },
  { label: "Grande", desc: "Exploración extensa" },
]

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [username, setUsername] = useState(user?.username || "")
  const [bio, setBio] = useState(user?.bio || "")
  const [preferred, setPreferred] = useState<"Pequeño" | "Mediano" | "Grande">(
    user?.preferredMazeSize || "Mediano",
  )
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#A46AFF")
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tokenEta, setTokenEta] = useState<number | null>(null)

  // Simulación de tiempo restante de token leyendo localStorage (solo front mock)
  useEffect(() => {
    const calc = () => {
      const raw = localStorage.getItem("auth_state")
      if (!raw) return setTokenEta(null)
      try {
        const parsed = JSON.parse(raw)
        if (!parsed.expiresAt) return setTokenEta(null)
        const diff = Date.parse(parsed.expiresAt) - Date.now()
        setTokenEta(diff > 0 ? diff : 0)
      } catch {
        setTokenEta(null)
      }
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [])

  const randomizeColor = () => {
    const palette = ["#A46AFF", "#9B51E0", "#C05DFF", "#B675FF", "#8735CF", "#6C28A8"]
    setAvatarColor(palette[Math.floor(Math.random() * palette.length)])
    setDirty(true)
  }

  const handleSave = () => {
    updateProfile({ username, bio, preferredMazeSize: preferred, avatarColor })
    setDirty(false)
    setSaved(true)
  }

  return (
    <Box>
      <Stack spacing={3} mb={4}>
        <Typography variant="h4" fontWeight={700} className={styles.gradientTitle}>
          Mi Perfil
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 760, color: "rgba(255,255,255,0.7)" }}>
          Ajusta tu identidad y preferencias. Estas opciones se usarán para emparejamiento y
          estadísticas futuras.
        </Typography>
      </Stack>
      <div className={styles.layout}>
        {/* Columna principal */}
        <div>
          <Paper elevation={0} className={styles.panel}>
            <Typography className={styles.sectionTitle}>Identidad</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={4} alignItems="center" mb={3}>
              <Box position="relative">
                <Tooltip title="Cambiar color" arrow>
                  <Avatar
                    sx={{ width: 112, height: 112, fontSize: 46, bgcolor: avatarColor }}
                    className={styles.avatarEditable}
                    onClick={randomizeColor}
                  >
                    {username[0]?.toUpperCase()}
                  </Avatar>
                </Tooltip>
                <IconButton
                  size="small"
                  onClick={randomizeColor}
                  sx={{ position: "absolute", bottom: 4, right: 4, bgcolor: "rgba(0,0,0,0.45)" }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
              <Stack spacing={2} sx={{ flexGrow: 1, width: "100%" }}>
                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setDirty(true)
                  }}
                  InputProps={{ endAdornment: <EditIcon sx={{ opacity: 0.4 }} /> }}
                />
                <TextField
                  label="Bio"
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value)
                    setDirty(true)
                  }}
                  multiline
                  minRows={3}
                  placeholder="Cazador estratégico de laberintos..."
                />
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <Chip label={user?.email} color="primary" variant="outlined" size="small" />
                  {user?.level && (
                    <Chip
                      label={"Nivel " + user.level}
                      size="small"
                      sx={{ bgcolor: "#26173e", border: "1px solid var(--brand-border-translucent)" }}
                    />
                  )}
                  {user?.score !== undefined && (
                    <Chip
                      label={user.score + " pts"}
                      color="secondary"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>
              </Stack>
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Typography className={styles.sectionTitle}>Preferencias de Laberinto</Typography>
            <div className={styles.preferenceGrid}>
              {sizes.map((s) => {
                const active = preferred === s.label
                return (
                  <div
                    key={s.label}
                    className={`${styles.prefCard} ${active ? styles.prefCardActive : ""}`}
                    onClick={() => {
                      setPreferred(s.label as "Pequeño" | "Mediano" | "Grande")
                      setDirty(true)
                    }}
                  >
                    <Typography fontWeight={600}>{s.label}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.65 }}>
                      {s.desc}
                    </Typography>
                  </div>
                )
              })}
            </div>
          </Paper>
        </div>
        {/* Sidebar derecha */}
        <div>
          <Paper elevation={0} className={styles.panel}>
            <Typography className={styles.sectionTitle}>Resumen</Typography>
            <Stack spacing={2}>
              <InfoRow label="Username" value={username || "—"} />
              <InfoRow label="Email" value={user?.email || "—"} />
              <InfoRow label="Preferencia" value={preferred} />
              <InfoRow label="Nivel" value={user?.level?.toString() || "—"} />
              <InfoRow label="Puntaje" value={user?.score?.toString() || "0"} />
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Typography className={styles.sectionTitle}>Token</Typography>
            {tokenEta !== null ? (
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(
                    100,
                    ((tokenEta / 1000) / 900) * 100, // 900s = 15 min (simulado)
                  )}
                  sx={{ height: 8, borderRadius: 2, mb: 1 }}
                />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Expira en {Math.floor((tokenEta || 0) / 1000)}s
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                No autenticado / sin datos de expiración.
              </Typography>
            )}
            <Divider sx={{ my: 3 }} />
            <Typography className={styles.sectionTitle}>Progreso</Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
              }}
            >
              <MiniStat title="Victorias" value={"—"} hint="Próximamente" />
              <MiniStat title="Lobbies" value={"—"} hint="Próximamente" />
              <MiniStat title="Win Rate" value={"—"} hint="Próximamente" />
              <MiniStat title="Racha" value={"—"} hint="Próximamente" />
            </Box>
          </Paper>
        </div>
      </div>
      {dirty && (
        <div className={styles.saveBar}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!username.trim()}
          >
            Guardar cambios
          </Button>
        </div>
      )}
      <Snackbar open={saved} autoHideDuration={2800} onClose={() => setSaved(false)}>
        <Alert severity="success" variant="filled" sx={{ bgcolor: "#321658" }}>
          Perfil actualizado
        </Alert>
      </Snackbar>
    </Box>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.6 }}>
      <Typography variant="caption" sx={{ opacity: 0.6, letterSpacing: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Stack>
  )
}

function MiniStat({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Box
      sx={{
        p: 1.5,
        border: "1px solid var(--brand-border-translucent)",
        borderRadius: 2,
        background: "rgba(38,23,62,0.25)",
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.6, letterSpacing: 1 }}>
        {title}
      </Typography>
      <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" sx={{ opacity: 0.4 }}>
          {hint}
        </Typography>
      )}
    </Box>
  )
}
