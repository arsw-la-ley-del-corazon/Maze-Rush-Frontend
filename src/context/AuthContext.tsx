import { useState, useCallback, useEffect, type ReactNode } from "react"
import { AuthContext, type UserProfile } from "./AuthTypes"
import { 
  logoutUser,
  fetchCurrentUser
} from "../features/auth"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const login = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    // La autenticación solo se realiza mediante Google OAuth2
    console.warn('Login tradicional no soportado. Usa Google OAuth2');
    return { ok: false, error: 'Autenticación solo disponible mediante Google OAuth2' };
  }, [])


  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } catch (err) {
      console.error('Error during logout:', err)
    }
    setUser(null)
  }, [])

  const register = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    // El registro solo se realiza mediante Google OAuth2
    console.warn('Registro tradicional no soportado. Usa Google OAuth2');
    return { ok: false, error: 'Registro solo disponible mediante Google OAuth2' };
  }, [])

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev))
  }, [])

  // Verificar autenticación al montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await fetchCurrentUser()
        if (result.ok && result.data) {
          setUser({
            id: result.data.id,
            email: result.data.email,
            username: result.data.username,
            avatarColor: pickColorFromEmail(result.data.email),
            preferredMazeSize: "Mediano",
            bio: "Nuevo explorador de laberintos",
            score: result.data.score ?? 0,
            level: result.data.level ?? 1,
          } as UserProfile)
        }
      } catch (err) {
        // Usuario no autenticado, esto es normal
        console.debug('Usuario no autenticado', err)
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
