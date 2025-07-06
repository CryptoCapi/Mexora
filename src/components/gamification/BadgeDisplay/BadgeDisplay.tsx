import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { auth } from '../../../firebase';
import GamificationService from '../../../services/gamificationService';
import { Badge } from '../../../types/gamification';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  background: 'rgba(18, 18, 18, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
}));

const BadgeDisplay: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    if (!auth.currentUser) return;

    try {
      const gamificationService = GamificationService.getInstance();
      const userProgress = await gamificationService.getUserProgress(auth.currentUser.uid);
      
      if (!userProgress) {
        throw new Error('No se encontró el progreso del usuario');
      }

      // Aquí necesitamos cargar los detalles completos de las insignias
      const badgesRef = collection(db, 'badges');
      const badgesSnap = await getDocs(badgesRef);
      const allBadges = badgesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Badge[];

      const userBadges = allBadges.filter(badge => 
        userProgress.badges.includes(badge.id)
      );
      
      setBadges(userBadges);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar insignias';
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Mis Insignias
      </Typography>
      <Grid container spacing={2}>
        {badges.map((badge) => (
          <Grid item xs={12} sm={6} md={4} key={badge.id}>
            <StyledPaper>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  {badge.name}
                </Typography>
                <Chip
                  label={badge.category}
                  color="primary"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {badge.description}
              </Typography>
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">
                  Obtenida el {badge.earnedAt.toDate().toLocaleDateString()}
                </Typography>
              </Box>
            </StyledPaper>
          </Grid>
        ))}
        {badges.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" align="center">
              Aún no has obtenido ninguna insignia
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default BadgeDisplay; 