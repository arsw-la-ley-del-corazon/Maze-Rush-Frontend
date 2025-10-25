import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { getCurrentUser } from '../../login/services/realAuthService';

export default function OAuth2RedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleOAuth2Redirect = async () => {
      const error = searchParams.get('error');
      const success = searchParams.get('success');

      if (error) {
        console.error('OAuth2 authentication error:', error);
        setErrorMessage('Error en la autenticación con Google. Intenta nuevamente.');
        setTimeout(() => navigate('/login?error=oauth_failed'), 2000);
        return;
      }

      if (success === 'true') {
        try {
          // Esperar un momento para asegurar que las cookies se establecieron
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Las cookies ya están establecidas por el backend
          // Verificar que el usuario esté autenticado correctamente
          const result = await getCurrentUser();
          
          if (result.ok && result.data) {
            console.log('Usuario autenticado exitosamente:', result.data);
            // Forzar recarga del contexto de autenticación
            window.location.href = '/app';
          } else {
            console.error('No se pudo obtener el usuario:', result);
            setErrorMessage('No se pudo completar la autenticación.');
            setTimeout(() => navigate('/login?error=oauth_failed'), 2000);
          }
        } catch (err) {
          console.error('Error getting user after OAuth2:', err);
          setErrorMessage('Error al verificar la autenticación.');
          setTimeout(() => navigate('/login?error=oauth_failed'), 2000);
        }
      } else {
        navigate('/login');
      }
    };

    handleOAuth2Redirect();
  }, [searchParams, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        background: 'linear-gradient(135deg, #140B1F 0%, #26173E 100%)',
      }}
    >
      <CircularProgress size={60} sx={{ color: '#A46AFF' }} />
      <Typography variant="h6" sx={{ color: '#fff' }}>
        Completando autenticación con Google...
      </Typography>
      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 400 }}>
          {errorMessage}
        </Alert>
      )}
    </Box>
  );
}
