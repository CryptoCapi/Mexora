import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
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

const ForoNews: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <StyledPaper>
          <Typography variant="h4" component="h1" gutterBottom>
            Foro de Noticias
          </Typography>
          <Typography variant="body1">
            Próximamente: Espacio para discutir las últimas noticias y tendencias del mercado.
          </Typography>
        </StyledPaper>
      </Box>
    </Container>
  );
};

export default ForoNews; 