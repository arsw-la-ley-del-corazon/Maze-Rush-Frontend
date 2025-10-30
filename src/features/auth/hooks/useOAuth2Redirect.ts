import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { OAuth2RedirectParams } from '../types';
import { AUTH_ROUTES, AUTH_TIMING, AUTH_ERROR_MESSAGES } from '../constants';
import { fetchCurrentUser } from '../services';

interface UseOAuth2RedirectResult {
  isLoading: boolean;
  errorMessage: string;
}

export function useOAuth2Redirect(): UseOAuth2RedirectResult {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuthError = useCallback(
    (message: string) => {
      setErrorMessage(message);
      setIsLoading(false);
      setTimeout(() => {
        navigate(`${AUTH_ROUTES.LOGIN}?error=oauth_failed`);
      }, AUTH_TIMING.ERROR_REDIRECT_DELAY);
    },
    [navigate]
  );

  const handleAuthSuccess = useCallback(async () => {
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, AUTH_TIMING.COOKIE_SETUP_DELAY)
      );

      const result = await fetchCurrentUser();

      if (result.ok && result.data) {
        console.log('Usuario autenticado exitosamente:', result.data);
        window.location.href = AUTH_ROUTES.DASHBOARD;
      } else {
        console.error('No se pudo obtener el usuario:', result);
        handleAuthError('No se pudo completar la autenticación.');
      }
    } catch (error) {
      console.error('Error getting user after OAuth2:', error);
      handleAuthError('Error al verificar la autenticación.');
    }
  }, [handleAuthError]);

  useEffect(() => {
    const handleOAuth2Redirect = async () => {
      const params: OAuth2RedirectParams = {
        error: searchParams.get('error') ?? undefined,
        success: searchParams.get('success') ?? undefined,
      };

      if (params.error) {
        console.error('OAuth2 authentication error:', params.error);
        handleAuthError(AUTH_ERROR_MESSAGES.OAUTH_ERROR);
        return;
      }

      if (params.success === 'true') {
        await handleAuthSuccess();
      } else {
        navigate(AUTH_ROUTES.LOGIN);
      }
    };

    handleOAuth2Redirect();
  }, [searchParams, navigate, handleAuthError, handleAuthSuccess]);

  return { isLoading, errorMessage };
}
