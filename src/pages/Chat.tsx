import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BitcoinSpinner from '../components/common/BitcoinSpinner';

const ChatPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <BitcoinSpinner size={50} color="#FFD700" />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando chat...
        </Typography>
      </Box>
    );
  }

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="error">Componente de chat principal eliminado. Usa el nuevo chat desde el menú.</Typography>
      </Box>
    </Container>
  );
};

export default ChatPage; 