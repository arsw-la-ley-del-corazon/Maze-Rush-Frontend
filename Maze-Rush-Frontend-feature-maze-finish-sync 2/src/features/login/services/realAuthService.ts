import axiosInstance from '../../../common/AxiosIntance';
import { API_ENDPOINTS } from '../../../common/globas';
import type {
  AuthResponse,
  RefreshTokenRequest,
  Result,
  ApiErrorShape,
} from "../../../types/api";

// Servicio de autenticación que se conecta al backend real
export async function loginWithGoogle(credential: string): Promise<Result<AuthResponse>> {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.GOOGLE, { idToken: credential });
    
    return success(mapBackendAuthResponse(response.data));
  } catch (error: any) {
    return handleApiError(error, API_ENDPOINTS.AUTH.GOOGLE);
  }
}

export async function refresh(req: RefreshTokenRequest): Promise<Result<AuthResponse>> {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH, req);
    
    return success(mapBackendAuthResponse(response.data));
  } catch (error: any) {
    return handleApiError(error, API_ENDPOINTS.AUTH.REFRESH);
  }
}

export async function logout(accessToken: string): Promise<Result<null>> {
  try {
    await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    return { ok: true, data: null };
  } catch (error: any) {
    // Incluso si el logout falla en el backend, limpiamos el estado local
    return { ok: true, data: null };
  }
}

// Mapear la respuesta del backend al formato esperado por el frontend
function mapBackendAuthResponse(backendResponse: any): AuthResponse {
  return {
    accessToken: backendResponse.accessToken,
    refreshToken: backendResponse.refreshToken,
    tokenType: backendResponse.tokenType || 'Bearer',
    expiresIn: backendResponse.expiresIn,
    expiresAt: backendResponse.expiresAt,
    user: {
      id: backendResponse.user.id,
      username: backendResponse.user.username,
      email: backendResponse.user.email,
      score: backendResponse.user.score || 0,
      level: backendResponse.user.level || 1,
    },
  };
}

// Manejar errores de la API
function handleApiError(error: any, path: string): Result<never> {
  let apiError: ApiErrorShape = {
    status: 500,
    message: 'Error interno del servidor',
    path,
  };

  if (error.response) {
    // Error de respuesta HTTP
    apiError = {
      status: error.response.status,
      message: error.response.data?.message || error.response.statusText || 'Error desconocido',
      path,
    };
  } else if (error.request) {
    // Error de red
    apiError = {
      status: 0,
      message: 'Error de conexión. Verifique su conexión a internet.',
      path,
    };
  } else {
    // Error de configuración
    apiError = {
      status: 400,
      message: error.message || 'Error en la configuración de la petición',
      path,
    };
  }

  return { ok: false, error: apiError };
}

function success<T>(data: T): Result<T> {
  return { ok: true, data };
}