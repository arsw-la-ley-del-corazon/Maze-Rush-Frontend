import { useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import { AuthContext, type UserProfile } from "./AuthTypes"
import { 
  loginWithGoogle as apiLoginWithGoogle, 
  refresh as apiRefresh, 
  logout as apiLogout
} from "../features/login/services/realAuthService"
import type { AuthResponse } from "../types/api"
import { AUTH_CONFIG } from "../common/globas"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

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

  const applyAuth = useCallback((resp: AuthResponse) => {
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
      }),
    )
  }, [scheduleRefresh])

  const loginWithGoogle = useCallback(async (credential: string): Promise<{ ok: boolean; error?: string }> => {
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
      return { ok: false, error: 'Error de conexión' }
    }
  }, [applyAuth])

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
    const raw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed.expiresAt && Date.parse(parsed.expiresAt) > Date.now()) {
        applyAuth({
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
          tokenType: "Bearer",
          expiresIn: Math.floor((Date.parse(parsed.expiresAt) - Date.now()) / 1000),
          expiresAt: parsed.expiresAt,
          user: parsed.user,
        })
      } else {
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY)
      }
    } catch {
      // ignorar
    }
  }, [applyAuth])

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateProfile }}>
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
