import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ThanosCaptcha } from '../components/ThanosCaptcha';

const Login: React.FC = () => {
  const { signInWithGoogle, currentUser, loading, error } = useAuth();
  const navigate = useNavigate();
  const [showCaptcha, setShowCaptcha] = useState(true);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);

  useEffect(() => {
    if (currentUser && !loading) {
      navigate('/', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  const handleCaptchaVerify = (success: boolean) => {
    setCaptchaVerified(success);
    if (success) {
      setShowCaptcha(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!captchaVerified) {
      setShowCaptcha(true);
      return;
    }
    setLoginAttempted(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      setShowCaptcha(true);
      setCaptchaVerified(false);
      setLoginAttempted(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (loginAttempted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Iniciando sesión...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            width: '100%',
            maxWidth: 400,
          }}
        >
          {showCaptcha ? (
            <ThanosCaptcha onVerify={handleCaptchaVerify} />
          ) : (
            <>
          <Typography variant="h4" component="h1" gutterBottom>
            Bienvenido a Mexora
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Inicia sesión para acceder a todas las funcionalidades de la plataforma
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                disabled={loading || !captchaVerified}
            sx={{
              width: '100%',
              py: 1.5,
              backgroundColor: '#4285F4',
              '&:hover': {
                backgroundColor: '#357ABD',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Iniciar sesión con Google'
            )}
          </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 