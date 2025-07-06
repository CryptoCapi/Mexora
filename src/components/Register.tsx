import React, { useState } from 'react';
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
  Avatar,
  Alert,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  PhotoCamera,
  Google,
} from '@mui/icons-material';
import { auth, storage, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { ThanosCaptcha } from './ThanosCaptcha';
import { useAuth } from '../contexts/AuthContext';

const RegisterContainer = styled(Box)({
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
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '200%',
    height: '200%',
    background: 'url(/assets/crypto-symbols.svg)',
    opacity: 0.1,
    animation: 'float 40s linear infinite',
  },
  '@keyframes float': {
    '0%': {
      transform: 'translateY(0) translateX(0) rotate(0deg)',
    },
    '100%': {
      transform: 'translateY(-50%) translateX(-50%) rotate(360deg)',
    },
  },
});

const RegisterCard = styled(Paper)({
  padding: '2rem',
  borderRadius: '20px',
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  width: '100%',
  maxWidth: '400px',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #006847, #ce1126, #006847)',
  },
});

const PhotoUpload = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1rem',
});

const Register: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(true);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const navigate = useNavigate();

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPhotoFile(event.target.files[0]);
      setPhotoURL(URL.createObjectURL(event.target.files[0]));
    }
  };

  const handleGoogleRegister = async () => {
    if (!captchaVerified) {
      setError('Por favor, completa el captcha de Thanos primero');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error: any) {
      console.error('Error en el registro con Google:', error);
      setError(
        error.code === 'auth/network-request-failed'
          ? 'Error de conexión. Por favor, verifica tu conexión a internet.'
          : 'Error al registrarse con Google. Por favor, intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) {
      setError('Por favor, completa el captcha de Thanos primero');
      return;
    }
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      if (!email || !password || !displayName) {
        throw new Error('Por favor, completa todos los campos obligatorios');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let photoURLToSave = '';
      if (photoFile) {
        const photoRef = ref(storage, `users/${user.uid}/profile.jpg`);
        await uploadBytes(photoRef, photoFile);
        photoURLToSave = await getDownloadURL(photoRef);
      }

      await updateProfile(user, {
        displayName,
        photoURL: photoURLToSave,
      });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        displayName,
        photoURL: photoURLToSave,
        createdAt: serverTimestamp(),
        online: true,
        lastSeen: serverTimestamp(),
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error en el registro:', error);
      setError(
        error.code === 'auth/email-already-in-use'
          ? 'Este correo electrónico ya está registrado'
          : error.code === 'auth/weak-password'
          ? 'La contraseña debe tener al menos 6 caracteres'
          : error.code === 'auth/invalid-email'
          ? 'Correo electrónico inválido'
          : error.message || 'Error al registrar usuario'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaVerify = (success: boolean) => {
    setCaptchaVerified(success);
    if (!success) {
      setError('Debes complacer a Thanos para continuar');
    } else {
      setError('');
    }
  };

  return (
    <RegisterContainer>
      <Container maxWidth="sm">
        <RegisterCard elevation={24}>
          {showCaptcha && !captchaVerified ? (
            <ThanosCaptcha onVerify={handleCaptchaVerify} />
          ) : (
            <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  Únete a Mexora
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Crea tu cuenta en la comunidad crypto mexicana
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleRegister}
                  startIcon={<Google />}
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
                  Registrarse con Google
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                  <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    O regístrate con tu correo
                  </Typography>
                  <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                </Box>
              </Box>

              <PhotoUpload>
                <Avatar
                  src={photoURL}
                  sx={{
                    width: 100,
                    height: 100,
                    border: '2px solid rgba(255,255,255,0.1)',
                  }}
                />
                <input
                  accept="image/*"
                  type="file"
                  id="photo-upload"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
                <label htmlFor="photo-upload">
                  <Button
                    component="span"
                    startIcon={<PhotoCamera />}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      '&:hover': { borderColor: 'white' },
                    }}
                    variant="outlined"
                  >
                    Subir foto
                  </Button>
                </label>
              </PhotoUpload>

              <TextField
                fullWidth
                label="Nombre de usuario"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover fieldset': { borderColor: 'white' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                }}
              />

              <TextField
                fullWidth
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover fieldset': { borderColor: 'white' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                }}
              />

              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover fieldset': { borderColor: 'white' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                }}
              />

              <TextField
                fullWidth
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover fieldset': { borderColor: 'white' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                }}
              />

              {error && (
                <Alert severity="error" sx={{ bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#ff1744' }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(90deg, #006847, #ce1126)',
                  color: 'white',
                  padding: '12px',
                  fontSize: '1.1rem',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #005538, #b30f21)',
                  },
                }}
              >
                {loading ? 'Registrando...' : 'Registrarse'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" style={{ color: '#4CAF50', textDecoration: 'none' }}>
                    Inicia sesión aquí
                  </Link>
                </Typography>
              </Box>
            </Box>
          )}
        </RegisterCard>
      </Container>
    </RegisterContainer>
  );
};

export default Register; 