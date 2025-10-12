/// <reference types="vite/client" />

// Definición de tipos para las variables de entorno de Vite
interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string

  // Authentication Configuration
  readonly VITE_AUTH_STORAGE_KEY: string
  readonly VITE_AUTH_TOKEN_REFRESH_MARGIN: string

  // Environment
  readonly VITE_NODE_ENV: string

  // Application Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string

  // Socket Configuration
  readonly VITE_SOCKET_URL: string

  // Development/Debug
  readonly VITE_DEBUG: string
  readonly VITE_LOG_LEVEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}