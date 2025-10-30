export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VALIDATE: '/auth/validate',
    ME: '/auth/me',
    GOOGLE: '/auth/google',
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
  },
  GAME: {
    BASE: '/game',
    ROOMS: '/game/rooms',
  },
} as const;

export const AUTH_CONFIG = {
  STORAGE_KEY: import.meta.env.VITE_AUTH_STORAGE_KEY || 'auth_state',
  TOKEN_REFRESH_MARGIN: parseInt(import.meta.env.VITE_AUTH_TOKEN_REFRESH_MARGIN) || 30, // segundos antes de expirar para refrescar token
} as const;

export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Maze Rush',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
} as const;

export const SOCKET_CONFIG = {
  URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080',
} as const;