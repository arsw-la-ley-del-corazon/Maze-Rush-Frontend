import { APP_CONFIG } from '../common/globas';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLogLevel = APP_CONFIG.LOG_LEVEL as LogLevel;
const currentLogLevelNumber = LOG_LEVELS[currentLogLevel] || LOG_LEVELS.info;

function shouldLog(level: LogLevel): boolean {
  return APP_CONFIG.DEBUG && LOG_LEVELS[level] <= currentLogLevelNumber;
}

export const logger = {
  error: (message: string, ...args: unknown[]): void => {
    if (shouldLog('error')) {
      console.error(`[${APP_CONFIG.NAME}] ERROR:`, message, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn(`[${APP_CONFIG.NAME}] WARN:`, message, ...args);
    }
  },

  info: (message: string, ...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.info(`[${APP_CONFIG.NAME}] INFO:`, message, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.debug(`[${APP_CONFIG.NAME}] DEBUG:`, message, ...args);
    }
  },

  authError: (message: string, error?: unknown): void => {
    logger.error(`Auth Error: ${message}`, error);
  },

  authInfo: (message: string, ...args: unknown[]): void => {
    logger.info(`Auth: ${message}`, ...args);
  },

  apiError: (message: string, error?: unknown): void => {
    logger.error(`API Error: ${message}`, error);
  },

  apiInfo: (message: string, ...args: unknown[]): void => {
    logger.info(`API: ${message}`, ...args);
  },
};

export default logger;