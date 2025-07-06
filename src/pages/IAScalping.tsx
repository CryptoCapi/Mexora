import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'rgba(18, 18, 18, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3)
}));

const IAScalping: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom color="primary">
        IA Scalping
      </Typography>
      <StyledPaper>
        <Typography variant="body1">
          Herramientas de IA para scalping en construcción...
        </Typography>
      </StyledPaper>
    </Box>
  );
};

export default IAScalping; 