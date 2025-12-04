// Configuración global de la aplicación usando variables de entorno
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
} as const;

// URLs de la API
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: '/auth/google',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VALIDATE: '/auth/validate',
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
  },
  GAME: {
    BASE: '/game',
    ROOMS: '/game/rooms',
  },
  LOBBY: {
    BASE: '/lobby',
    CREATE: '/lobby/create',
    ALL: '/lobby/all',
    JOIN: (code: string) => `/lobby/join/${code}`,
    GET: (code: string) => `/lobby/${code}`,
    LEAVE: (code: string) => `/lobby/${code}/leave`,
  },
} as const;

// Configuración de autenticación
export const AUTH_CONFIG = {
  STORAGE_KEY: import.meta.env.VITE_AUTH_STORAGE_KEY || 'auth_state',
  TOKEN_REFRESH_MARGIN: parseInt(import.meta.env.VITE_AUTH_TOKEN_REFRESH_MARGIN) || 30, // segundos antes de expirar para refrescar token
} as const;

// Configuración de Google OAuth
export const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
} as const;

// Configuración de la aplicación
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Maze Rush',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
} as const;

// Configuración de Socket (para uso futuro)
export const SOCKET_CONFIG = {
  URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080',
} as const;