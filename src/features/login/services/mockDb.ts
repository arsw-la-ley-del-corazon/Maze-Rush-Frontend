// Base de datos simulada en memoria — sólo para desarrollo front sin backend
export const mockDB: {
  users: Array<{ id: string; username: string; email: string; password: string; score: number; level: number }>
  refreshTokens: Array<{ token: string; userId: string; expiresAt: number }>
} = {
  users: [
    {
      id: "seed-1",
      username: "explorer",
      email: "explorer@example.com",
      password: "Password123",
      score: 1500,
      level: 5,
    },
  ],
  refreshTokens: [],
}
