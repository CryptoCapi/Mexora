import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as LevelUpIcon
} from '@mui/icons-material';
import GamificationService from '../../../services/gamificationService';
import { auth } from '../../../firebase';
import { UserProgress } from '../../../types/gamification';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  background: 'rgba(18, 18, 18, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
}));

const LevelProgress = styled(LinearProgress)(({ theme }) => ({
  height: 20,
  borderRadius: 10,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '& .MuiLinearProgress-bar': {
    borderRadius: 10,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
  }
}));

const LevelSystem: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);

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

      if (previousLevel !== null && userProgress.level > previousLevel) {
        setShowLevelUp(true);
      }
      
      setPreviousLevel(userProgress.level);
      setProgress(userProgress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar progreso';
      setError(errorMessage);
      setShowError(true);
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
    <Grid container spacing={2}>
      <Grid item xs={12}>
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
            <Typography variant="body2" color="text.secondary">
              {nextLevelPoints - progress.points} puntos restantes para el siguiente nivel
            </Typography>
          </Box>
        </StyledPaper>
      </Grid>
      <Grid item xs={12}>
        <StyledPaper>
          <Typography variant="subtitle1" gutterBottom>
            Beneficios del Nivel Actual
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Acceso a salas temáticas especiales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Insignias exclusivas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Mayor visibilidad en la comunidad
          </Typography>
        </StyledPaper>
      </Grid>
    </Grid>
  );
};

export default LevelSystem; 