/**
 * @deprecated Este archivo se mantiene por compatibilidad.
 * Usa las importaciones desde '@features/auth' en su lugar.
 * 
 * NOTA: La aplicación solo soporta autenticación OAuth2 con Google.
 * Las funciones de login/register tradicionales no están disponibles.
 */

import {
  refreshAccessToken,
  logoutUser,
  validateAuthToken,
  fetchCurrentUser,
} from '../../auth/services/authService';

// Re-exportar con nombres anteriores para compatibilidad
export const refresh = refreshAccessToken;
export const logout = logoutUser;
export const validateToken = validateAuthToken;
export const getCurrentUser = fetchCurrentUser;

// Funciones legacy no soportadas (solo OAuth2)
export const login = () => {
  throw new Error('Login con credenciales no soportado. Usa Google OAuth2');
};

export const register = () => {
  throw new Error('Registro tradicional no soportado. Usa Google OAuth2');
};

export const authenticateWithGoogle = () => {
  throw new Error('Autenticación OAuth2 se maneja automáticamente por el backend');
};