import { createContext } from "react"

export interface UserProfile {
  id: string
  email: string
  username: string
  avatarColor: string
  bio?: string
  preferredMazeSize?: "Pequeño" | "Mediano" | "Grande"
  score?: number
  level?: number
}

export interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<UserProfile>) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
