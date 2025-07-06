import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { UserProfile } from '../../../types/social';
import SocialService from '../../../services/socialService';
import { auth } from '../../../firebase';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(30, 30, 30, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  }
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#fff',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  }
}));

interface ProfileCardProps {
  profile: UserProfile;
  isConnection?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, isConnection = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>(
    isConnection ? 'connected' : 'none'
  );

  const handleConnect = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const socialService = SocialService.getInstance();
      await socialService.sendConnectionRequest(auth.currentUser.uid, profile.id);
      setConnectionStatus('pending');
    } catch (err) {
      setError('Error al enviar solicitud de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    // TODO: Implementar mensajería
    console.log('Enviar mensaje a:', profile.id);
  };

  return (
    <StyledCard>
      <CardMedia
        sx={{ 
          height: 140,
          background: `linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)`
        }}
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
        >
          <Avatar
            src={profile.photoURL}
            sx={{ 
              width: 80, 
              height: 80,
              border: '4px solid white'
            }}
          >
            <PersonIcon fontSize="large" />
          </Avatar>
        </Box>
      </CardMedia>

      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            {profile.displayName}
          </Typography>
          <Box display="flex" alignItems="center">
            <StarIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="primary" ml={0.5}>
              {profile.socialScore}
            </Typography>
          </Box>
        </Box>

        {profile.location && (
          <Box display="flex" alignItems="center" mb={2}>
            <LocationIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" ml={1}>
              {profile.location}
            </Typography>
          </Box>
        )}

        {profile.bio && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {profile.bio}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Intereses
          </Typography>
          <Box display="flex" flexWrap="wrap">
            {profile.interests.map((interest, index) => (
              <StyledChip
                key={index}
                label={interest}
                size="small"
              />
            ))}
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Habilidades
          </Typography>
          <Box display="flex" flexWrap="wrap">
            {profile.skills.map((skill, index) => (
              <StyledChip
                key={index}
                label={skill}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" mt="auto">
          {!isConnection && (
            <Button
              variant="contained"
              color="primary"
              startIcon={connectionStatus === 'pending' ? <CheckIcon /> : <AddIcon />}
              onClick={handleConnect}
              disabled={loading || connectionStatus !== 'none'}
            >
              {connectionStatus === 'pending' ? 'Solicitud Enviada' : 'Conectar'}
            </Button>
          )}
          
          <Tooltip title="Enviar mensaje">
            <IconButton
              color="primary"
              onClick={handleMessage}
              disabled={!isConnection}
            >
              <MessageIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default ProfileCard; 