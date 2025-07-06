import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import GamificationService from '../../services/gamificationService';
import { auth } from '../../firebase';
import { UserProgress as UserProgressType, Badge, Achievement } from '../../types/gamification';

const ProgressCard = styled(Card)(({ theme }) => ({
  background: 'rgba(30, 30, 30, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8]
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  background: 'rgba(18, 18, 18, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
}));

const UserProgress: React.FC = () => {
  const [progress, setProgress] = useState<UserProgressType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    if (!auth.currentUser) return;

    try {
      const gamificationService = GamificationService.getInstance();
      const userProgress = await gamificationService.getUserProgress(auth.currentUser.uid);
      
      if (!userProgress) {
        throw new Error('No se encontró el progreso del usuario');
      }

      setProgress(userProgress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar progreso';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    if (error === 'No se encontró el progreso del usuario') {
      return null;
    }
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!progress) {
    return null;
  }

  // Calcular los puntos necesarios para el siguiente nivel
  const nextLevelPoints = Math.floor(100 * Math.pow(1.5, progress.level - 1));
  const progressPercentage = (progress.points / nextLevelPoints) * 100;

  return (
    <StyledPaper>
      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          Nivel {progress.level}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {progress.points} / {nextLevelPoints} puntos
        </Typography>
        <LinearProgress
          variant="determinate"
          value={Math.min(progressPercentage, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
            }
          }}
        />
      </Box>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Estadísticas Sociales
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Posts: {progress.socialStats?.posts || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Likes: {progress.socialStats?.likes || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comentarios: {progress.socialStats?.comments || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Compartidos: {progress.socialStats?.shares || 0}
        </Typography>
      </Box>
    </StyledPaper>
  );
};

export default UserProgress; 