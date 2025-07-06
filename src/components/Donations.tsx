import React from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: theme.spacing(2),
}));

const Donations = () => {
  return (
    <StyledContainer>
      <Typography variant="h4" gutterBottom>
        Donaciones
        </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Apoya nuestro proyecto
              </Typography>
              <Typography paragraph>
                Tu apoyo nos ayuda a mantener y mejorar la plataforma.
                  </Typography>
              <Box mt={2}>
                <Button variant="contained" color="primary">
                  Donar con PayPal
                    </Button>
                  </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Donaciones en Crypto
              </Typography>
              <Typography paragraph>
                También aceptamos donaciones en criptomonedas.
              </Typography>
              <Box mt={2}>
                <Button variant="contained" color="secondary">
                  Donar con Crypto
              </Button>
            </Box>
          </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </StyledContainer>
  );
};

export default Donations; 