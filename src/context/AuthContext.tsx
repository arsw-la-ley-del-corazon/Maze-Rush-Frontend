import { useState, useCallback, useEffect, type ReactNode } from "react"
import { AuthContext, type UserProfile } from "./AuthTypes"
import { 
  login as apiLogin, 
  logout as apiLogout,
  register as apiRegister,
  getCurrentUser
} from "../features/login/services/realAuthService"
import type { AuthResponse } from "../types/api"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const applyAuth = useCallback((resp: AuthResponse) => {
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
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    setLoading(true)
    try {
      const result = await apiLogin({ email, password })
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


  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
    setUser(null)
  }, [])

  const register = useCallback(async (username: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    setLoading(true)
    try {
      const result = await apiRegister({ username, email, password })
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

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev))
  }, [])

  // Verificar autenticación al montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await getCurrentUser()
        if (result.ok && result.data) {
          setUser({
            id: result.data.id,
            email: result.data.email,
            username: result.data.username,
            avatarColor: pickColorFromEmail(result.data.email),
            preferredMazeSize: "Mediano",
            bio: "Nuevo explorador de laberintos",
            score: result.data.score || 0,
            level: result.data.level || 1,
          } as UserProfile)
        }
      } catch (error) {
        // Usuario no autenticado, esto es normal
        console.debug('Usuario no autenticado')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, register }}>
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
