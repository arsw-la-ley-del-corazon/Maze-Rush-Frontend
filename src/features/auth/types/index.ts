import type { UserInfo, AuthResponse as BaseAuthResponse } from '../../../types/api';

export type { UserInfo };

export type AuthResponse = BaseAuthResponse;

export const AuthStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
} as const;

export type AuthStatusType = typeof AuthStatus[keyof typeof AuthStatus];

export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  OAUTH_ERROR: 'OAUTH_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type AuthErrorCodeType = typeof AuthErrorCode[keyof typeof AuthErrorCode];

export interface OAuth2RedirectParams {
  success?: string;
  error?: string;
}
