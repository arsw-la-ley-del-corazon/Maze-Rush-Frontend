import axiosInstance from "../../../common/AxiosIntance"
import { API_ENDPOINTS } from "../../../common/globas"
import type { Result, LobbyResponse, LobbyWithPlayersResponse, LobbyRequest } from "../../../types/api"

export async function createLobby(request: LobbyRequest): Promise<Result<LobbyWithPlayersResponse>> {
  try {
    const response = await axiosInstance.post<LobbyWithPlayersResponse>(
      API_ENDPOINTS.LOBBY.CREATE,
      request
    )
    return { ok: true, data: response.data }
  } catch (error: any) {
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
    const response = await axiosInstance.get<LobbyResponse[]>(API_ENDPOINTS.LOBBY.ALL)
    return { ok: true, data: response.data }
  } catch (error: any) {
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
    const response = await axiosInstance.get<LobbyWithPlayersResponse>(
      API_ENDPOINTS.LOBBY.GET(code)
    )
    return { ok: true, data: response.data }
  } catch (error: any) {
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
    const response = await axiosInstance.post<LobbyWithPlayersResponse>(
      API_ENDPOINTS.LOBBY.JOIN(code)
    )
    return { ok: true, data: response.data }
  } catch (error: any) {
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
