import axiosInstance from "../../../common/AxiosIntance"
import { API_ENDPOINTS } from "../../../common/globas"
import type { Result, LobbyResponse, LobbyWithPlayersResponse, LobbyRequest } from "../../../types/api"

export async function createLobby(request: LobbyRequest): Promise<Result<LobbyWithPlayersResponse>> {
  try {
    console.log("🚀 Enviando petición POST a:", API_ENDPOINTS.LOBBY.CREATE)
    console.log("📤 Datos enviados:", JSON.stringify(request, null, 2))
    
    const response = await axiosInstance.post<LobbyWithPlayersResponse>(
      API_ENDPOINTS.LOBBY.CREATE,
      request
    )
    
    console.log("📥 Respuesta recibida del backend:", response.data)
    console.log("   - isPublic en respuesta:", response.data.isPublic)
    
    // WORKAROUND: Si el backend no devuelve isPublic, usar el valor que enviamos
    if (response.data.isPublic === undefined) {
      console.warn("⚠️ Backend no devolvió isPublic, usando valor enviado:", request.isPublic)
      response.data.isPublic = request.isPublic
    }
    
    return { ok: true, data: response.data }
  } catch (error: any) {
    console.error("❌ Error en createLobby:", error)
    console.error("   - Status:", error.response?.status)
    console.error("   - Data:", error.response?.data)
    return {
      ok: false,
      error: {
        status: error.response?.status || 500,
        message: error.response?.data?.message || "Error al crear el lobby",
        details: error.response?.data?.details,
      },
    }
  }
}

export async function getAllLobbies(): Promise<Result<LobbyResponse[]>> {
  try {
    console.log("🔍 Llamando a:", API_ENDPOINTS.LOBBY.ALL)
    const response = await axiosInstance.get<LobbyResponse[]>(API_ENDPOINTS.LOBBY.ALL)
    console.log("📦 Respuesta recibida:", response.data)
    console.log("📊 Análisis de isPublic por sala:")
    response.data.forEach((lobby, index) => {
      console.log(`   Sala ${index + 1} (${lobby.code}): isPublic = ${lobby.isPublic} (${typeof lobby.isPublic})`)
    })
    return { ok: true, data: response.data }
  } catch (error: any) {
    console.error("🚫 Error en getAllLobbies:", error)
    return {
      ok: false,
      error: {
        status: error.response?.status || 500,
        message: error.response?.data?.message || "Error al obtener los lobbies",
      },
    }
  }
}

export async function getLobbyByCode(code: string): Promise<Result<LobbyWithPlayersResponse>> {
  try {
    console.log("📡 Obteniendo información del lobby:", code)
    const response = await axiosInstance.get<LobbyWithPlayersResponse>(
      API_ENDPOINTS.LOBBY.GET(code)
    )
    console.log("✅ Lobby obtenido:", response.data)
    console.log("   - Jugadores actuales:", response.data.players)
    console.log("   - Total jugadores:", response.data.players?.length || 0)
    return { ok: true, data: response.data }
  } catch (error: any) {
    console.error("❌ Error al obtener lobby:", error.response?.data || error.message)
    return {
      ok: false,
      error: {
        status: error.response?.status || 500,
        message: error.response?.data?.message || "Error al obtener el lobby",
      },
    }
  }
}

export async function joinLobby(code: string): Promise<Result<LobbyWithPlayersResponse>> {
  try {
    console.log("🔗 Enviando petición POST a:", API_ENDPOINTS.LOBBY.JOIN(code))
    const response = await axiosInstance.post<LobbyWithPlayersResponse>(
      API_ENDPOINTS.LOBBY.JOIN(code)
    )
    console.log("✅ Unido exitosamente al lobby:", response.data)
    console.log("   - Jugadores en el lobby:", response.data.players)
    return { ok: true, data: response.data }
  } catch (error: any) {
    console.error("❌ Error al unirse al lobby:", error.response?.data || error.message)
    return {
      ok: false,
      error: {
        status: error.response?.status || 500,
        message: error.response?.data?.message || "Error al unirse al lobby",
        details: error.response?.data?.details,
      },
    }
  }
}

export async function leaveLobby(code: string): Promise<Result<string>> {
  try {
    const response = await axiosInstance.delete<string>(API_ENDPOINTS.LOBBY.LEAVE(code))
    return { ok: true, data: response.data }
  } catch (error: any) {
    return {
      ok: false,
      error: {
        status: error.response?.status || 500,
        message: error.response?.data?.message || "Error al salir del lobby",
      },
    }
  }
}
