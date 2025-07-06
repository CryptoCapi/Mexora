import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createUserProfile = async (userId: string, userDisplayName: string) => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      displayName: userDisplayName,
      photoURL: '',
      bio: '',
      followers: [],
      following: [],
      createdAt: new Date(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Iniciar sesión
        await signInWithEmailAndPassword(auth, email, password);
        setError('¡Inicio de sesión exitoso!');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        // Registro
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        if (!displayName) {
          throw new Error('Por favor ingresa un nombre de usuario');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Actualizar el perfil del usuario
        await updateProfile(userCredential.user, {
          displayName: displayName
        });

        // Crear el perfil en Firestore
        await createUserProfile(userCredential.user.uid, displayName);

        setError('¡Registro exitoso!');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error: any) {
      let errorMessage = 'Ocurrió un error';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está registrado';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </Typography>

          {error && (
            <Alert severity={error.includes('¡') ? 'success' : 'error'} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <TextField
                fullWidth
                label="Nombre de usuario"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />
            )}
            <TextField
              fullWidth
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Registrarse'
              )}
            </Button>
          </form>

          <Button
            fullWidth
            color="secondary"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setDisplayName('');
            }}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Auth; 