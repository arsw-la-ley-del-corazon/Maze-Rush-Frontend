import type { Result, UserResponse, UserRequest } from "../../../types/api"
interface InternalUser { id: string; username: string; email: string; password: string; score: number; level: number }
import { mockDB } from "./mockDb"

export async function getCurrentUser(userId: string): Promise<Result<UserResponse>> {
  const user = mockDB.users.find((u) => u.id === userId)
  if (!user) return { ok: false, error: { status: 404, message: "Usuario no encontrado" } }
  return { ok: true, data: toResponse(user) }
}

export async function updateCurrentUser(
  userId: string,
  data: UserRequest,
): Promise<Result<UserResponse>> {
  const user = mockDB.users.find((u) => u.id === userId)
  if (!user) return { ok: false, error: { status: 404, message: "Usuario no encontrado" } }
  if (data.email && mockDB.users.some((u) => u.email === data.email && u.id !== userId)) {
    return { ok: false, error: { status: 409, message: "Email ya en uso" } }
  }
  if (data.username && mockDB.users.some((u) => u.username === data.username && u.id !== userId)) {
    return { ok: false, error: { status: 409, message: "Username ya en uso" } }
  }
  Object.assign(user, data)
  return { ok: true, data: toResponse(user) }
}

export async function listUsers(): Promise<Result<UserResponse[]>> {
  return { ok: true, data: mockDB.users.map(toResponse) }
}

function toResponse(u: InternalUser): UserResponse {
  return { id: u.id, email: u.email, username: u.username, score: u.score, level: u.level }
}
