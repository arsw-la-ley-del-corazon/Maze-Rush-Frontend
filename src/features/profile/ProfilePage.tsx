import RefreshIcon from "@mui/icons-material/Autorenew"
import CancelIcon from "@mui/icons-material/Cancel"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import EditIcon from "@mui/icons-material/Edit"
import ErrorIcon from "@mui/icons-material/Error"
import SaveIcon from "@mui/icons-material/Save"
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import { useEffect, useState } from "react"
import { useAuth } from "../../context/useAuth"
import styles from "./ProfilePage.module.css"
import {
  type UserProfileData,
  type UserStatsData,
  getCurrentUserProfile,
  getUserStats,
  updateUserProfile,
  validateEmail,
  validateUsername,
} from "./services/profileService"

const sizes: Array<{ label: string; desc: string; value: "Pequeño" | "Mediano" | "Grande" }> = [
  { label: "Pequeño", desc: "Partidas rápidas (10x10)", value: "Pequeño" },
  { label: "Mediano", desc: "Equilibrado (15x15)", value: "Mediano" },
  { label: "Grande", desc: "Exploración extensa (20x20)", value: "Grande" },
]

const avatarPalette = [
  "#A46AFF",
  "#9B51E0",
  "#C05DFF",
  "#B675FF",
  "#8735CF",
  "#6C28A8",
  "#FF6B9D",
  "#4ECDC4",
  "#FFD93D",
  "#6BCF7F",
]

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()

  // Estado de formulario
  const [username, setUsername] = useState(user?.username || "")
  const [email, setEmail] = useState(user?.email || "")
  const [bio, setBio] = useState(user?.bio || "")
  const [preferred, setPreferred] = useState<"Pequeño" | "Mediano" | "Grande">(
    user?.preferredMazeSize || "Mediano"
  )
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#A46AFF")

  // Estados de UI
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenEta, setTokenEta] = useState<number | null>(null)
  const [stats, setStats] = useState<UserStatsData | null>(null)
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)

  // Validación en tiempo real
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Cargar perfil y estadísticas al montar
  useEffect(() => {
    loadProfileData()
    loadStats()
  }, [])

  const loadProfileData = async () => {
    setLoadingProfile(true)
    const result = await getCurrentUserProfile()
    if (result.ok) {
      setProfileData(result.data)
      setUsername(result.data.username)
      setEmail(result.data.email)
      setBio(result.data.bio || "")
      setPreferred(result.data.preferredMazeSize || "Mediano")
      setAvatarColor(result.data.avatarColor || "#A46AFF")
    } else {
      setError("Error al cargar perfil: " + result.error.message)
    }
    setLoadingProfile(false)
  }

  const loadStats = async () => {
    setLoadingStats(true)
    const result = await getUserStats()
    if (result.ok) {
      setStats(result.data)
    }
    setLoadingStats(false)
  }

  // Simulación de tiempo restante de token leyendo localStorage
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

  // Validación de username
  useEffect(() => {
    if (username !== user?.username) {
      const validation = validateUsername(username)
      setUsernameError(validation.valid ? null : validation.message || null)
    } else {
      setUsernameError(null)
    }
  }, [username, user?.username])

  // Validación de email
  useEffect(() => {
    if (email !== user?.email) {
      const validation = validateEmail(email)
      setEmailError(validation.valid ? null : validation.message || null)
    } else {
      setEmailError(null)
    }
  }, [email, user?.email])

  const randomizeColor = () => {
    let newColor
    do {
      newColor = avatarPalette[Math.floor(Math.random() * avatarPalette.length)]
    } while (newColor === avatarColor && avatarPalette.length > 1)
    setAvatarColor(newColor)
    setDirty(true)
  }

  const handleCancel = () => {
    setUsername(profileData?.username || user?.username || "")
    setEmail(profileData?.email || user?.email || "")
    setBio(profileData?.bio || user?.bio || "")
    setPreferred(profileData?.preferredMazeSize || user?.preferredMazeSize || "Mediano")
    setAvatarColor(profileData?.avatarColor || user?.avatarColor || "#A46AFF")
    setDirty(false)
    setUsernameError(null)
    setEmailError(null)
  }

  const handleSave = async () => {
    // Validaciones finales
    if (usernameError || emailError) {
      setError("Por favor corrige los errores antes de guardar")
      return
    }

    if (!username.trim()) {
      setError("El username no puede estar vacío")
      return
    }

    setLoading(true)
    setError(null)

    const updates = {
      username: username !== user?.username ? username : undefined,
      email: email !== user?.email ? email : undefined,
      bio: bio !== user?.bio ? bio : undefined,
      preferredMazeSize: preferred !== user?.preferredMazeSize ? preferred : undefined,
      avatarColor: avatarColor !== user?.avatarColor ? avatarColor : undefined,
    }

    // Remover propiedades undefined
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    )

    if (Object.keys(cleanUpdates).length === 0) {
      setError("No hay cambios para guardar")
      setLoading(false)
      return
    }

    const result = await updateUserProfile(cleanUpdates)

    if (result.ok) {
      // Actualizar contexto de autenticación
      updateProfile({
        username: result.data.username,
        email: result.data.email,
        bio: result.data.bio,
        preferredMazeSize: result.data.preferredMazeSize,
        avatarColor: result.data.avatarColor,
        score: result.data.score,
        level: result.data.level,
      })
      setProfileData(result.data)
      setDirty(false)
      setSaved(true)
      setError(null)
    } else {
      setError(result.error.message)
    }

    setLoading(false)
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)} icon={<ErrorIcon />}>
          {error}
        </Alert>
      )}

      <div className={styles.layout}>
        {/* Columna principal */}
        <div>
          <Paper elevation={0} className={styles.panel}>
            <Typography className={styles.sectionTitle}>Identidad</Typography>

            {loadingProfile ? (
              <Stack spacing={2}>
                <Stack direction="row" spacing={4} alignItems="center">
                  <Skeleton variant="circular" width={112} height={112} />
                  <Stack spacing={2} sx={{ flexGrow: 1 }}>
                    <Skeleton variant="rectangular" height={56} />
                    <Skeleton variant="rectangular" height={90} />
                  </Stack>
                </Stack>
              </Stack>
            ) : (
              <>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={4}
                  alignItems="center"
                  mb={3}
                >
                  <Box position="relative">
                    <Tooltip title="Cambiar color (click para aleatorio)" arrow>
                      <Avatar
                        sx={{
                          width: 112,
                          height: 112,
                          fontSize: 46,
                          bgcolor: avatarColor,
                          cursor: "pointer",
                          transition: "transform 0.2s",
                          "&:hover": { transform: "scale(1.05)" },
                        }}
                        onClick={randomizeColor}
                      >
                        {username[0]?.toUpperCase() || "?"}
                      </Avatar>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={randomizeColor}
                      sx={{
                        position: "absolute",
                        bottom: 4,
                        right: 4,
                        bgcolor: "rgba(0,0,0,0.6)",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                      }}
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
                      error={!!usernameError}
                      helperText={usernameError || "3-50 caracteres alfanuméricos"}
                      disabled={loading}
                      InputProps={{
                        endAdornment: usernameError ? (
                          <ErrorIcon sx={{ color: "error.main" }} />
                        ) : username !== user?.username ? (
                          <EditIcon sx={{ opacity: 0.4 }} />
                        ) : (
                          <CheckCircleIcon sx={{ color: "success.main" }} />
                        ),
                      }}
                    />
                    <TextField
                      label="Email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setDirty(true)
                      }}
                      error={!!emailError}
                      helperText={emailError || "Correo electrónico verificado"}
                      disabled={loading}
                      InputProps={{
                        endAdornment: emailError ? (
                          <ErrorIcon sx={{ color: "error.main" }} />
                        ) : email !== user?.email ? (
                          <EditIcon sx={{ opacity: 0.4 }} />
                        ) : (
                          <CheckCircleIcon sx={{ color: "success.main" }} />
                        ),
                      }}
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
                      maxRows={6}
                      placeholder="Cazador estratégico de laberintos..."
                      disabled={loading}
                      inputProps={{ maxLength: 200 }}
                      helperText={`${bio.length}/200 caracteres`}
                    />
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      <Chip label={user?.email} color="primary" variant="outlined" size="small" />
                      {user?.level && (
                        <Chip
                          label={"Nivel " + user.level}
                          size="small"
                          sx={{
                            bgcolor: "#26173e",
                            border: "1px solid var(--brand-border-translucent)",
                          }}
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
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
                  Selecciona tu tamaño preferido de laberinto para partidas rápidas
                </Typography>
                <div className={styles.preferenceGrid}>
                  {sizes.map((s) => {
                    const active = preferred === s.value
                    return (
                      <div
                        key={s.label}
                        className={`${styles.prefCard} ${active ? styles.prefCardActive : ""}`}
                        onClick={() => {
                          if (!loading) {
                            setPreferred(s.value)
                            setDirty(true)
                          }
                        }}
                        style={{
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        <Typography fontWeight={600}>{s.label}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.65 }}>
                          {s.desc}
                        </Typography>
                        {active && <CheckCircleIcon sx={{ color: "success.main", mt: 1 }} />}
                      </div>
                    )
                  })}
                </div>

                {/* Paleta de colores */}
                <Divider sx={{ my: 3 }} />
                <Typography className={styles.sectionTitle}>Paleta de Colores</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2 }}>
                  {avatarPalette.map((color) => (
                    <Tooltip key={color} title={color} arrow>
                      <Box
                        onClick={() => {
                          if (!loading) {
                            setAvatarColor(color)
                            setDirty(true)
                          }
                        }}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          bgcolor: color,
                          cursor: loading ? "not-allowed" : "pointer",
                          border:
                            avatarColor === color
                              ? "3px solid #fff"
                              : "2px solid rgba(255,255,255,0.2)",
                          transition: "all 0.2s",
                          "&:hover": {
                            transform: loading ? "none" : "scale(1.1)",
                            border: "3px solid rgba(255,255,255,0.8)",
                          },
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {avatarColor === color && (
                          <CheckCircleIcon sx={{ color: "#fff", fontSize: 24 }} />
                        )}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </div>
        {/* Sidebar derecha */}
        <div>
          <Paper elevation={0} className={styles.panel}>
            <Typography className={styles.sectionTitle}>Resumen</Typography>
            {loadingProfile ? (
              <Stack spacing={2}>
                <Skeleton variant="rectangular" height={40} />
                <Skeleton variant="rectangular" height={40} />
                <Skeleton variant="rectangular" height={40} />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <InfoRow label="Username" value={username || "—"} />
                <InfoRow label="Email" value={email || "—"} />
                <InfoRow label="Preferencia" value={preferred} />
                <InfoRow label="Nivel" value={profileData?.level?.toString() || "—"} />
                <InfoRow label="Puntaje" value={profileData?.score?.toString() || "0"} />
              </Stack>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography className={styles.sectionTitle}>Token</Typography>
            {tokenEta !== null ? (
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (tokenEta / 1000 / 900) * 100)}
                  sx={{ height: 8, borderRadius: 2, mb: 1 }}
                />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Expira en {formatTime(tokenEta)}
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                No autenticado / sin datos de expiración.
              </Typography>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography className={styles.sectionTitle}>Estadísticas</Typography>
            {loadingStats ? (
              <Stack spacing={2}>
                <Skeleton variant="rectangular" height={80} />
                <Skeleton variant="rectangular" height={80} />
              </Stack>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
                }}
              >
                <MiniStat
                  title="Victorias"
                  value={stats?.wins.toString() || "0"}
                  hint={stats && stats.totalGames > 0 ? `de ${stats.totalGames}` : "Sin partidas"}
                />
                <MiniStat
                  title="Win Rate"
                  value={stats ? `${Math.round(stats.winRate)}%` : "—"}
                  hint={stats && stats.totalGames > 0 ? "Porcentaje" : "Sin datos"}
                />
                <MiniStat
                  title="Racha Actual"
                  value={stats?.currentStreak.toString() || "0"}
                  hint="Victorias seguidas"
                />
                <MiniStat
                  title="Mejor Racha"
                  value={stats?.bestStreak.toString() || "0"}
                  hint="Récord personal"
                />
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Button
              variant="outlined"
              fullWidth
              startIcon={<RefreshIcon />}
              onClick={() => {
                loadProfileData()
                loadStats()
              }}
              disabled={loadingProfile || loadingStats}
            >
              {loadingProfile || loadingStats ? "Cargando..." : "Recargar Datos"}
            </Button>
          </Paper>
        </div>
      </div>

      {/* Barra de guardado flotante */}
      {dirty && (
        <div className={styles.saveBar}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Tienes cambios sin guardar
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading || !!usernameError || !!emailError || !username.trim()}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Stack>
        </div>
      )}

      {/* Notificaciones */}
      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{ bgcolor: "#321658" }}
          icon={<CheckCircleIcon />}
        >
          ✅ Perfil actualizado correctamente
        </Alert>
      </Snackbar>
    </Box>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.6 }}>
      <Typography
        variant="caption"
        sx={{ opacity: 0.6, letterSpacing: 1, textTransform: "uppercase" }}
      >
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
        transition: "all 0.2s",
        "&:hover": {
          background: "rgba(38,23,62,0.45)",
          borderColor: "rgba(164,106,255,0.4)",
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{ opacity: 0.6, letterSpacing: 1, textTransform: "uppercase" }}
      >
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

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}
