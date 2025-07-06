import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ProfileCard from './ProfileCard';
import { UserProfile } from '../../../types/social';
import SocialService from '../../../services/socialService';
import MatchingService from '../../../services/matchingService';
import { auth } from '../../../firebase';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'rgba(18, 18, 18, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3)
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`connection-tabpanel-${index}`}
      aria-labelledby={`connection-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ConnectionSystem: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [recommendations, setRecommendations] = useState<UserProfile[]>([]);
  const [similarProfiles, setSimilarProfiles] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<UserProfile[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('Usuario no autenticado');
      setShowError(true);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const socialService = SocialService.getInstance();
        const matchingService = MatchingService.getInstance();

        // Cargar recomendaciones
        const recs = await matchingService.getProfileRecommendations(currentUser.uid);
        setRecommendations(recs);

        // Cargar perfiles similares
        const similar = await matchingService.getSimilarProfiles(currentUser.uid);
        setSimilarProfiles(similar);

        // Cargar conexiones
        const userConnections = await socialService.getConnections(currentUser.uid);
        const connectionProfiles = await Promise.all(
          userConnections.map(conn => 
            socialService.getUserProfile(conn.connectedUserId)
          )
        );
        setConnections(connectionProfiles.filter(Boolean) as UserProfile[]);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos';
        setError(errorMessage);
        setShowError(true);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Sistema de Conexiones
        </Typography>

        <StyledPaper>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="connection tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Recomendaciones" />
            <Tab label="Perfiles Similares" />
            <Tab label="Mis Conexiones" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {recommendations.map(profile => (
                <Grid item xs={12} sm={6} md={4} key={profile.id}>
                  <ProfileCard profile={profile} />
                </Grid>
              ))}
              {recommendations.length === 0 && (
                <Grid item xs={12}>
                  <Typography align="center" color="text.secondary">
                    No hay recomendaciones disponibles en este momento
                  </Typography>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {similarProfiles.map(profile => (
                <Grid item xs={12} sm={6} md={4} key={profile.id}>
                  <ProfileCard profile={profile} />
                </Grid>
              ))}
              {similarProfiles.length === 0 && (
                <Grid item xs={12}>
                  <Typography align="center" color="text.secondary">
                    No se encontraron perfiles similares
                  </Typography>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {connections.map(profile => (
                <Grid item xs={12} sm={6} md={4} key={profile.id}>
                  <ProfileCard profile={profile} isConnection />
                </Grid>
              ))}
              {connections.length === 0 && (
                <Grid item xs={12}>
                  <Typography align="center" color="text.secondary">
                    Aún no tienes conexiones
                  </Typography>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </StyledPaper>
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

export default ConnectionSystem; 