import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Paper, CircularProgress, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import UserProgress from '../components/gamification/UserProgress';
import GamificationService from '../services/gamificationService';
import { UserProgress as IUserProgress } from '../types/gamification';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import BadgeDisplay from '../components/gamification/BadgeDisplay/BadgeDisplay';
import AchievementDisplay from '../components/gamification/AchievementDisplay/AchievementDisplay';
import LevelSystem from '../components/gamification/LevelSystem/LevelSystem';
import UserStats from '../components/gamification/UserStats/UserStats';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'rgba(18, 18, 18, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3)
}));

const GamificationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<IUserProgress | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setShowError(true);
        return;
      }
      loadUserProgress();
    });

    return () => unsubscribeAuth();
  }, []);

  const loadUserProgress = async () => {
    try {
      setLoading(true);
      const gamificationService = GamificationService.getInstance();
      if (!auth.currentUser?.uid) {
        throw new Error('Usuario no autenticado');
      }
      const progress = await gamificationService.getUserProgress(auth.currentUser.uid);
      
      if (!progress) {
        throw new Error('No se pudo cargar el progreso del usuario');
      }
      
      setUserProgress(progress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el progreso del usuario';
      setError(errorMessage);
      setShowError(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!userProgress) {
    return (
      <Container>
        <StyledPaper>
          <Typography color="error">No se encontró información de progreso</Typography>
        </StyledPaper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Tu Progreso
        </Typography>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ flex: '1 1 100%', maxWidth: '100%' }}>
            <UserProgress />
          </div>
        </div>
      </Box>

      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GamificationPage; 