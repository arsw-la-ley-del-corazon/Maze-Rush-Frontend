// Base de datos simulada en memoria para desarrollo
interface InternalUser {
  id: string
  username: string
  email: string
  password: string
  score: number
  level: number
}

interface RefreshToken {
  token: string
  userId: string
  expiresAt: number
}

interface MockDB {
  users: InternalUser[]
  refreshTokens: RefreshToken[]
}

export const mockDB: MockDB = {
  users: [],
  refreshTokens: [],
}
