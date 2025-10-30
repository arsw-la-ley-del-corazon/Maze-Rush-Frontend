import axiosInstance from '@common/AxiosIntance';
import { API_ENDPOINTS } from '@common/globas';
import type { Result, ApiErrorShape } from '../../../types/api';
import type { AuthResponse, UserInfo } from '../types';

export async function refreshAccessToken(): Promise<Result<AuthResponse>> {
  try {
    const response = await axiosInstance.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      {}
    );

    return createSuccessResult(mapAuthResponse(response.data));
  } catch (error: unknown) {
    return handleAuthError(error, API_ENDPOINTS.AUTH.REFRESH);
  }
}

export async function logoutUser(): Promise<Result<null>> {
  try {
    await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT, {});
    return { ok: true, data: null };
  } catch (error: unknown) {
    return handleAuthError(error, API_ENDPOINTS.AUTH.LOGOUT);
  }
}

export async function validateAuthToken(): Promise<boolean> {
  try {
    const response = await axiosInstance.get<boolean>(API_ENDPOINTS.AUTH.VALIDATE);
    return response.data === true;
  } catch (error: unknown) {
    const result = handleAuthError(error, API_ENDPOINTS.AUTH.VALIDATE);
    return result.ok;
  }
}

export async function fetchCurrentUser(): Promise<Result<UserInfo>> {
  try {
    const response = await axiosInstance.get<UserInfo>(API_ENDPOINTS.AUTH.ME);
    return { ok: true, data: response.data };
  } catch (error: unknown) {
    return handleAuthError(error, API_ENDPOINTS.AUTH.ME);
  }
}

function mapAuthResponse(backendResponse: AuthResponse): AuthResponse {
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
      score: backendResponse.user.score ?? 0,
      level: backendResponse.user.level ?? 1,
    },
  };
}

function handleAuthError(error: unknown, path: string): Result<never> {
  let apiError: ApiErrorShape = {
    status: 500,
    message: 'Error interno del servidor',
    path,
  };
  if (isAxiosError(error)) {
    if (error.response) {
      apiError = {
        status: error.response.status,
        message:
          error.response.data?.message ||
          error.response.statusText ||
          'Error desconocido',
        path,
      };
    } else if (error.request) {
      // Error de red
      apiError = {
        status: 0,
        message: 'Error de conexión. Verifique su conexión a internet.',
        path,
      };
    }
  } else if (error instanceof Error) {
    apiError = {
      status: 400,
      message: error.message || 'Error en la configuración de la petición',
      path,
    };
  }

  return { ok: false, error: apiError };
}

function isAxiosError(error: unknown): error is {
  response?: { status: number; statusText: string; data?: { message?: string } };
  request?: unknown;
  message: string;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'request' in error || 'message' in error)
  );
}

function createSuccessResult<T>(data: T): Result<T> {
  return { ok: true, data };
}
