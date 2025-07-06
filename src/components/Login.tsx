import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Paper,
  styled,
  Alert,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Google,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { ThanosCaptcha } from './ThanosCaptcha';
import { useAuth } from '../contexts/AuthContext';

const LoginContainer = styled(Box)({
  minHeight: '100vh',
  background: `
    linear-gradient(135deg, rgba(0,104,71,0.9) 0%, rgba(206,17,38,0.9) 50%, rgba(0,0,0,0.9) 100%),
    url('/assets/mexican-pattern.png')
  `,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
});

const LoginCard = styled(Paper)({
  padding: '2rem',
  borderRadius: '20px',
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  width: '100%',
  maxWidth: '400px',
});

const StyledTextField = styled(TextField)({
  '& .MuiInputBase-root': {
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

const Login = () => {
  const { signInWithGoogle, error: authError, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(true);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Solo mostrar el captcha si no está verificado
    if (!captchaVerified) {
      setShowCaptcha(true);
    }
  }, [captchaVerified]);

  useEffect(() => {
    // Actualizar el error local cuando cambia el error de autenticación
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleGoogleLogin = async () => {
    if (!captchaVerified) {
      setError('Por favor, completa el captcha de Thanos primero');
      setShowCaptcha(true);
      return;
    }

    try {
      await signInWithGoogle();
      // La redirección la maneja el AuthContext
    } catch (error: any) {
      console.error('Error en el inicio de sesión con Google:', error);
      setError(error.message || 'Error al iniciar sesión con Google');
    }
  };

  const handleCaptchaVerify = (success: boolean) => {
    setCaptchaVerified(success);
    if (success) {
      setShowCaptcha(false);
      setError('');
      // Iniciar automáticamente el proceso de login con Google
      handleGoogleLogin();
    }
  };

  return (
    <LoginContainer>
      <Container maxWidth="sm">
        <LoginCard elevation={24}>
          {showCaptcha ? (
            <ThanosCaptcha onVerify={handleCaptchaVerify} />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  Bienvenido a Mexora
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  La plataforma social crypto con espíritu mexicano
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ width: '100%' }}>
                  {error}
                </Alert>
              )}

              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                startIcon={<Google />}
                disabled={authLoading || loading || !captchaVerified}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                  padding: '12px',
                }}
              >
                Continuar con Google
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" style={{ color: '#ce1126' }}>
                    Regístrate
                  </Link>
                </Typography>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} /> 
              </Box>
            </Box>
          )}
        </LoginCard>
      </Container>
    </LoginContainer>
  );
};

export default Login; 