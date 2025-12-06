import { APP_CONFIG } from "../common/globas"

// Niveles de logging
type LogLevel = "error" | "warn" | "info" | "debug"

// Mapeo de niveles a números para comparación
const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

// Obtener el nivel actual de logging de la configuración
const currentLogLevel = APP_CONFIG.LOG_LEVEL as LogLevel
const currentLogLevelNumber = LOG_LEVELS[currentLogLevel] || LOG_LEVELS.info

// Función helper para determinar si se debe loggear
function shouldLog(level: LogLevel): boolean {
  return APP_CONFIG.DEBUG && LOG_LEVELS[level] <= currentLogLevelNumber
}

// Funciones de logging
export const logger = {
  error: (message: string, ...args: any[]) => {
    if (shouldLog("error")) {
      console.error(`[${APP_CONFIG.NAME}] ERROR:`, message, ...args)
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (shouldLog("warn")) {
      console.warn(`[${APP_CONFIG.NAME}] WARN:`, message, ...args)
    }
  },

  info: (message: string, ...args: any[]) => {
    if (shouldLog("info")) {
      console.info(`[${APP_CONFIG.NAME}] INFO:`, message, ...args)
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (shouldLog("debug")) {
      console.debug(`[${APP_CONFIG.NAME}] DEBUG:`, message, ...args)
    }
  },

  // Función específica para errores de autenticación
  authError: (message: string, error?: any) => {
    logger.error(`Auth Error: ${message}`, error)
  },

  // Función específica para información de autenticación
  authInfo: (message: string, ...args: any[]) => {
    logger.info(`Auth: ${message}`, ...args)
  },

  // Función específica para APIs
  apiError: (message: string, error?: any) => {
    logger.error(`API Error: ${message}`, error)
  },

  apiInfo: (message: string, ...args: any[]) => {
    logger.info(`API: ${message}`, ...args)
  },
}

// Export para compatibilidad
export default logger
