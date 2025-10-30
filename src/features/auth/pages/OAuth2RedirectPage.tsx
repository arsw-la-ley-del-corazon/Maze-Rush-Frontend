import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useOAuth2Redirect } from '../hooks';

export default function OAuth2RedirectPage() {
  const { isLoading, errorMessage } = useOAuth2Redirect();

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
      {isLoading && (
        <>
          <CircularProgress size={60} sx={{ color: '#A46AFF' }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Completando autenticación con Google...
          </Typography>
        </>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 400 }}>
          {errorMessage}
        </Alert>
      )}
    </Box>
  );
}
