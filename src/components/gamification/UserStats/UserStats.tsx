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
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import StatsService from '../../../services/statsService';
import { auth } from '../../../firebase';
import { UserStats as UserStatsType } from '../../../types/gamification';

const StatCard = styled(Card)(({ theme }) => ({
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

const UserStats: React.FC = () => {
  const [stats, setStats] = useState<UserStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('Usuario no autenticado');
      setShowError(true);
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        setLoading(true);
        const statsService = StatsService.getInstance();
        const userStats = await statsService.getUserStats(currentUser.uid);
        if (userStats) {
          setStats({
            ...userStats,
            isPublic: true // Por defecto, las estadísticas son públicas
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
        setError(errorMessage);
        setShowError(true);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" component="h2" gutterBottom color="primary">
        Mis Estadísticas
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Puntuación Social
                </Typography>
                <Typography variant="h3" color="primary">
                  {stats.socialScore}
                </Typography>
                <Box mt={2}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.socialScore / 1000) * 100} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </StatCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conexiones
                </Typography>
                <Typography variant="h3" color="primary">
                  {stats.totalConnections}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de conexiones establecidas
                </Typography>
              </CardContent>
            </StatCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Colaboraciones
                </Typography>
                <Typography variant="h3" color="primary">
                  {stats.totalCollaborations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Proyectos colaborativos completados
                </Typography>
              </CardContent>
            </StatCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Logros
                </Typography>
                <Typography variant="h3" color="primary">
                  {stats.achievementsUnlocked}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Logros desbloqueados
                </Typography>
              </CardContent>
            </StatCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <StatCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Insignias
                </Typography>
                <Typography variant="h3" color="primary">
                  {stats.badgesEarned}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Insignias ganadas
                </Typography>
              </CardContent>
            </StatCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <StatCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Puntos Totales
                </Typography>
                <Typography variant="h3" color="primary">
                  {stats.totalPoints}
                </Typography>
                <Box mt={2}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.totalPoints / 10000) * 100} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </StatCard>
          </motion.div>
        </Grid>
      </Grid>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserStats; 