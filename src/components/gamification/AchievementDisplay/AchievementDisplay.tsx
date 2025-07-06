import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { auth } from '../../../firebase';
import GamificationService from '../../../services/gamificationService';
import { Achievement } from '../../../types/gamification';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  background: 'rgba(18, 18, 18, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
}));

const AchievementDisplay: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    if (!auth.currentUser) return;

    try {
      const gamificationService = GamificationService.getInstance();
      const progress = await gamificationService.getUserProgress(auth.currentUser.uid);
      
      if (!progress) {
        throw new Error('No se encontró el progreso del usuario');
      }

      const allAchievements = await gamificationService.getAchievements();
      const userAchievements = allAchievements.filter(achievement => 
        progress.achievements.includes(achievement.id)
      );
      
      setAchievements(userAchievements);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar logros';
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
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Logros Desbloqueados
      </Typography>
      <Grid container spacing={2}>
        {achievements.map((achievement) => (
          <Grid item xs={12} sm={6} md={4} key={achievement.id}>
            <StyledPaper>
              <Typography variant="subtitle1">
                {achievement.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {achievement.description}
              </Typography>
              <Typography variant="caption" color="primary">
                +{achievement.points} puntos
              </Typography>
            </StyledPaper>
          </Grid>
        ))}
        {achievements.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" align="center">
              Aún no has desbloqueado ningún logro
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AchievementDisplay; 