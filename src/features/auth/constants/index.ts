export const OAUTH2_CONFIG = {
  GOOGLE: {
    PROVIDER: 'google',
    AUTHORIZATION_PATH: '/oauth2/authorization/google',
  },
} as const;

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos',
  USER_NOT_FOUND: 'Usuario no encontrado',
  USER_ALREADY_EXISTS: 'El usuario ya existe',
  INVALID_TOKEN: 'Token inválido',
  TOKEN_EXPIRED: 'La sesión ha expirado',
  NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
  OAUTH_ERROR: 'Error en la autenticación con Google. Intenta nuevamente.',
  UNKNOWN_ERROR: 'Error desconocido. Intenta nuevamente.',
} as const;

export const AUTH_ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  OAUTH2_REDIRECT: '/auth/oauth2/redirect',
  DASHBOARD: '/app',
  HOME: '/',
} as const;

export const AUTH_TIMING = {
  COOKIE_SETUP_DELAY: 500,
  ERROR_REDIRECT_DELAY: 2000,
} as const;
