import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const donationItems = [
  { label: 'CLABE Bancaria', value: '710969000033375175' },
  { label: 'Wallet Phantom', value: '86nLqwiCL1oRWKnnTpGMLEXjaR6rmXaHD1jiLGDityLp' },
  { label: 'PayPal', value: '@CarinaGomez201' },
];

const DonationPage = () => (
  <Box p={4} style={{ background: 'url(/assets/animated-background.gif) no-repeat center center', backgroundSize: 'cover', minHeight: '100vh' }}>
    <Typography variant="h2" color="inherit" gutterBottom style={{ fontFamily: '"Press Start 2P", cursive', color: '#FFD700', textAlign: 'center', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
      Apoya a Mexora
    </Typography>
    <Typography variant="h5" color="inherit" paragraph style={{ fontFamily: '"Press Start 2P", cursive', color: '#ffffff', textAlign: 'center', marginBottom: '40px' }}>
      Este proyecto innovador busca mejorar la experiencia de los usuarios en el mundo de las criptomonedas. Tu apoyo es fundamental para continuar desarrollando nuevas funcionalidades y mantener el proyecto en marcha.
    </Typography>
    {donationItems.map((item) => (
      <Box key={item.label} display="flex" alignItems="center" justifyContent="space-between" mb={3} p={3} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px' }}>
        <Typography variant="h6" color="inherit" style={{ fontFamily: '"Press Start 2P", cursive', color: '#ffffff' }}>
          <strong>{item.label}:</strong> {item.value}
        </Typography>
        {item.label === 'PayPal' ? (
          <Button variant="contained" color="secondary" href={`https://www.paypal.me/${item.value}`} target="_blank" style={{ fontFamily: '"Press Start 2P", cursive', background: '#FFD700', color: '#000', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
            Donar
          </Button>
        ) : (
          <IconButton onClick={() => navigator.clipboard.writeText(item.value)} style={{ color: '#FFD700' }}>
            <ContentCopyIcon />
          </IconButton>
        )}
      </Box>
    ))}
  </Box>
);

export default DonationPage; 