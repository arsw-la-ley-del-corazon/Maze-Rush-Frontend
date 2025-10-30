import { useCallback } from 'react';
import { API_CONFIG } from '@common/globas';
import { OAUTH2_CONFIG } from '../constants';

interface UseGoogleLoginResult {
  handleGoogleLogin: () => void;
}

export function useGoogleLogin(): UseGoogleLoginResult {
  const handleGoogleLogin = useCallback(() => {
    const backendUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
    const authUrl = `${backendUrl}${OAUTH2_CONFIG.GOOGLE.AUTHORIZATION_PATH}`;
    window.location.href = authUrl;
  }, []);

  return { handleGoogleLogin };
}
