import axiosInstance from "../../../common/AxiosIntance"
import logger from "../../../common/logger"
import type { Result } from "../../../types/api"

export interface UserProfileData {
  id: string
  username: string
  email: string
  score: number
  level: number
  bio?: string
  avatarColor?: string
  preferredMazeSize?: "Pequeño" | "Mediano" | "Grande"
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  bio?: string
  avatarColor?: string
  preferredMazeSize?: "Pequeño" | "Mediano" | "Grande"
}

export interface UserStatsData {
  totalGames: number
  wins: number
  losses: number
  winRate: number
  currentStreak: number
  bestStreak: number
  totalScore: number
  level: number
  lobbiesCreated: number
  lobbiesJoined: number
}

/**
 * Obtiene el perfil del usuario autenticado
 */
export async function getCurrentUserProfile(): Promise<Result<UserProfileData>> {
  try {
    logger.info("[profileService] Obteniendo perfil del usuario actual")
    const response = await axiosInstance.get<UserProfileData>("/users/me")
    logger.info("[profileService] Perfil obtenido:", response.data)
    return { ok: true, data: response.data }
  } catch (error: any) {
    logger.error("[profileService] Error al obtener perfil:", error)
    return {
      ok: false,
      error: {
        status: error.response?.status || 500,
        message: error.response?.data?.message || "Error al obtener perfil",
      },
    }
  }
}

/**
 * Actualiza el perfil del usuario autenticado
 */
export async function updateUserProfile(
  updates: UpdateProfileRequest
): Promise<Result<UserProfileData>> {
  try {
    logger.info("[profileService] Actualizando perfil:", updates)
    const response = await axiosInstance.patch<UserProfileData>("/users/me", updates)
    logger.info("[profileService] Perfil actualizado:", response.data)
    return { ok: true, data: response.data }
  } catch (error: any) {
    logger.error("[profileService] Error al actualizar perfil:", error)
    return {
      ok: false,
      error: {
        status: error.response?.status || 500,
        message: error.response?.data?.message || "Error al actualizar perfil",
      },
    }
  }
}

/**
 * Obtiene las estadísticas del usuario (mock por ahora)
 */
export async function getUserStats(): Promise<Result<UserStatsData>> {
  try {
    logger.info("[profileService] Obteniendo estadísticas del usuario")
    // TODO: Implementar endpoint real cuando esté disponible
    const mockStats: UserStatsData = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0,
      level: 1,
      lobbiesCreated: 0,
      lobbiesJoined: 0,
    }
    return { ok: true, data: mockStats }
  } catch (error: any) {
    logger.error("[profileService] Error al obtener estadísticas:", error)
    return {
      ok: false,
      error: {
        status: error.response?.status || 500,
        message: error.response?.data?.message || "Error al obtener estadísticas",
      },
    }
  }
}

/**
 * Valida el formato del username
 */
export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, message: "El username no puede estar vacío" }
  }
  if (username.length < 3) {
    return { valid: false, message: "El username debe tener al menos 3 caracteres" }
  }
  if (username.length > 50) {
    return { valid: false, message: "El username no puede tener más de 50 caracteres" }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      message: "El username solo puede contener letras, números, guiones y guiones bajos",
    }
  }
  return { valid: true }
}

/**
 * Valida el formato del email
 */
export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, message: "El email no puede estar vacío" }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Formato de email inválido" }
  }
  if (email.length > 254) {
    return { valid: false, message: "El email no puede tener más de 254 caracteres" }
  }
  return { valid: true }
}
