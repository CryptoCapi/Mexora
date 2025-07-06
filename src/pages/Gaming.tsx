import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'rgba(18, 18, 18, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
}));

const Gaming: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <StyledPaper>
          <Typography variant="h4" component="h1" gutterBottom>
            Zona Gaming
          </Typography>
          <Typography variant="body1">
            Próximamente: Juegos exclusivos y torneos para la comunidad.
          </Typography>
        </StyledPaper>
      </Box>
    </Container>
  );
};

export default Gaming; 