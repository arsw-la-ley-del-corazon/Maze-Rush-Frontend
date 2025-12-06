import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { AUTH_CONFIG } from "../common/globas"
import {
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  refresh as apiRefresh,
} from "../features/login/services/realAuthService"
import type { AuthResponse } from "../types/api"
import { AuthContext, type UserProfile } from "./AuthTypes"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const accessRef = useRef<string | null>(null)
  const refreshRef = useRef<string | null>(null)
  const expiryRef = useRef<number | null>(null)
  const refreshTimer = useRef<number | null>(null)

  const scheduleRefresh = useCallback((expiresInSeconds: number) => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current)
    // refrescar usando el margen configurado antes de expirar
    const timeoutMs = Math.max((expiresInSeconds - AUTH_CONFIG.TOKEN_REFRESH_MARGIN) * 1000, 5000)
    refreshTimer.current = window.setTimeout(async () => {
      if (refreshRef.current) {
        const result = await apiRefresh({ refreshToken: refreshRef.current })
        if (result.ok) applyAuth(result.data)
      }
    }, timeoutMs)
  }, [])

  const applyAuth = useCallback(
    (resp: AuthResponse) => {
      accessRef.current = resp.accessToken
      refreshRef.current = resp.refreshToken
      expiryRef.current = Date.parse(resp.expiresAt)
      setUser({
        id: resp.user.id,
        email: resp.user.email,
        username: resp.user.username,
        avatarColor: pickColorFromEmail(resp.user.email),
        preferredMazeSize: "Mediano",
        bio: "Nuevo explorador de laberintos",
        score: resp.user.score,
        level: resp.user.level,
      } as UserProfile)
      scheduleRefresh(resp.expiresIn)
      // Persistencia mínima
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEY,
        JSON.stringify({
          accessToken: resp.accessToken,
          refreshToken: resp.refreshToken,
          expiresAt: resp.expiresAt,
          user: resp.user,
        })
      )
    },
    [scheduleRefresh]
  )

  const loginWithGoogle = useCallback(
    async (credential: string): Promise<{ ok: boolean; error?: string }> => {
      setLoading(true)
      try {
        const result = await apiLoginWithGoogle(credential)
        if (result.ok) {
          applyAuth(result.data)
          setLoading(false)
          return { ok: true }
        } else {
          setLoading(false)
          return { ok: false, error: result.error.message }
        }
      } catch (error) {
        setLoading(false)
        return { ok: false, error: "Error de conexión" }
      }
    },
    [applyAuth]
  )

  const logout = useCallback(() => {
    if (accessRef.current) apiLogout(accessRef.current)
    accessRef.current = null
    refreshRef.current = null
    expiryRef.current = null
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current)
    setUser(null)
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY)
  }, [])

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev))
  }, [])

  // Rehidratación al montar
  useEffect(() => {
    const restoreSession = async () => {
      setInitializing(true)
      const raw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY)

      if (!raw) {
        setInitializing(false)
        return
      }

      try {
        const parsed = JSON.parse(raw)
        const expiresAt = parsed.expiresAt ? Date.parse(parsed.expiresAt) : null
        const now = Date.now()

        // Si el token aún es válido, restaurar directamente
        if (expiresAt && expiresAt > now) {
          applyAuth({
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken,
            tokenType: "Bearer",
            expiresIn: Math.floor((expiresAt - now) / 1000),
            expiresAt: parsed.expiresAt,
            user: parsed.user,
          })
          setInitializing(false)
        }
        // Si el token expiró pero tenemos refreshToken, intentar refrescar
        else if (parsed.refreshToken) {
          try {
            const result = await apiRefresh({ refreshToken: parsed.refreshToken })
            if (result.ok) {
              applyAuth(result.data)
            } else {
              // Si el refresh falla, limpiar todo
              localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY)
            }
          } catch (error) {
            // Si hay error al refrescar, limpiar todo
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY)
          }
          setInitializing(false)
        }
        // Si no hay refreshToken, limpiar
        else {
          localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY)
          setInitializing(false)
        }
      } catch (error) {
        // Si hay error al parsear, limpiar
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY)
        setInitializing(false)
      }
    }

    restoreSession()
  }, [applyAuth])

  return (
    <AuthContext.Provider
      value={{ user, loading: loading || initializing, loginWithGoogle, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function pickColorFromEmail(email: string) {
  const colors = ["#A46AFF", "#9B51E0", "#C05DFF", "#B675FF", "#8735CF"]
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
