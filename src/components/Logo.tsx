import React from 'react';
import { Box, SxProps } from '@mui/material';

const LogoSVG = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    {/* Fondo del logo */}
    <defs>
      <linearGradient id="mexGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#006847' }} />
        <stop offset="50%" style={{ stopColor: '#ffffff' }} />
        <stop offset="100%" style={{ stopColor: '#ce1126' }} />
      </linearGradient>
    </defs>

    {/* M estilizada */}
    <path
      d="M 10 80 
         L 25 20 
         L 40 50 
         L 50 20
         L 60 50
         L 75 20
         L 90 80
         L 80 80
         L 70 40
         L 60 65
         L 50 40
         L 40 65
         L 30 40
         L 20 80
         Z"
      fill="url(#mexGradient)"
      stroke="#FFD700"
      strokeWidth="2"
    />

    {/* Detalles decorativos */}
    <circle cx="25" cy="20" r="3" fill="#FFD700" />
    <circle cx="50" cy="20" r="3" fill="#FFD700" />
    <circle cx="75" cy="20" r="3" fill="#FFD700" />
  </svg>
);

interface LogoProps {
  sx?: SxProps;
}

const Logo: React.FC<LogoProps> = ({ sx }) => {
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
        ...sx,
      }}
    >
      <LogoSVG />
    </Box>
  );
};

export default Logo; 