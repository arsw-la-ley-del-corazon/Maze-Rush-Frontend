// Tipos alineados con el OpenAPI proporcionado (v1.0.0) — solo simulación local
export interface UserInfo {
  id: string
  username: string
  email: string
  score?: number
  level?: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number // segundos
  expiresAt: string // ISO date-time
  user: UserInfo
}

export interface LoginRequest {
  username?: string
  email?: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export type UserResponse = UserInfo

export interface UserRequest {
  username?: string
  email?: string
  password?: string
}

export interface ApiErrorShape {
  status: number
  message: string
  path?: string
  details?: string[]
}

// Utilidades
export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiErrorShape }
