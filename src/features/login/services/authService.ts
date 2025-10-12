import { v4 as uuid } from "uuid"
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  Result,
  ApiErrorShape,
  UserInfo,
} from "../../../types/api"
import { mockDB } from "./mockDb"

// Simulación (sin llamadas de red) replicando contrato del backend
const ACCESS_LIFETIME_SEC = 60 * 15 // 15 minutos
const REFRESH_LIFETIME_SEC = 60 * 60 * 24 * 7 // 7 días


function generateToken(prefix: string) {
  return `${prefix}.${uuid()}.${Math.random().toString(36).slice(2)}`
}

export async function login(req: LoginRequest): Promise<Result<AuthResponse>> {
  if ((!req.email && !req.username) || !req.password) {
    return error(400, "Faltan credenciales", "/api/v1/auth/login")
  }
  const user = mockDB.users.find(
    (u) => u.email === req.email || u.username === req.username,
  )
  if (!user || user.password !== req.password) {
    return error(401, "Credenciales inválidas", "/api/v1/auth/login")
  }
  return success(authPayload(user))
}

export async function register(req: RegisterRequest): Promise<Result<AuthResponse>> {
  if (mockDB.users.some((u) => u.email === req.email || u.username === req.username)) {
    return error(409, "El username o email ya están en uso", "/api/v1/auth/register")
  }
  const user = {
    id: uuid(),
    username: req.username,
    email: req.email,
    password: req.password,
    score: 0,
    level: 1,
  }
  mockDB.users.push(user)
  return success(authPayload(user))
}

export async function refresh(
  req: RefreshTokenRequest,
): Promise<Result<AuthResponse>> {
  const session = mockDB.refreshTokens.find((r) => r.token === req.refreshToken)
  if (!session) return error(401, "Refresh token inválido", "/api/v1/auth/refresh")
  if (session.expiresAt < Date.now())
    return error(401, "Refresh token expirado", "/api/v1/auth/refresh")
  const user = mockDB.users.find((u) => u.id === session.userId)
  if (!user) return error(404, "Usuario no encontrado", "/api/v1/auth/refresh")
  // Rotación simple (invalida el anterior)
  mockDB.refreshTokens = mockDB.refreshTokens.filter((r) => r !== session)
  return success(authPayload(user))
}

export async function logout(accessToken: string): Promise<Result<null>> {
  // Estrategia simple: eliminar refresh tokens ligados al usuario del access token parseado
  const parts = accessToken.split(".")
  if (parts.length < 3) return error(400, "Token inválido", "/api/v1/auth/logout")
  const userId = parts[1]
  mockDB.refreshTokens = mockDB.refreshTokens.filter((r) => r.userId !== userId)
  return { ok: true, data: null }
}

interface InternalUser extends UserInfo { password: string }

function authPayload(user: InternalUser): AuthResponse {
  const accessToken = generateToken("acc") + "." + user.id
  const refreshToken = generateToken("ref")
  const expiresIn = ACCESS_LIFETIME_SEC
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
  mockDB.refreshTokens.push({
    token: refreshToken,
    userId: user.id,
    expiresAt: Date.now() + REFRESH_LIFETIME_SEC * 1000,
  })
  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn,
    expiresAt,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      score: user.score,
      level: user.level,
    },
  }
}

function success<T>(data: T): Result<T> {
  return { ok: true, data }
}
function error<T = never>(status: number, message: string, path?: string): Result<T> {
  const e: ApiErrorShape = { status, message, path }
  return { ok: false, error: e }
}
