import React from 'react';
import { Box, keyframes } from '@mui/material';
import { CurrencyBitcoin as BitcoinIcon } from '@mui/icons-material';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

interface BitcoinSpinnerProps {
  size?: number;
  color?: string;
}

const BitcoinSpinner: React.FC<BitcoinSpinnerProps> = ({ 
  size = 40, 
  color = '#F7931A' // Color naranja de Bitcoin
}) => {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        animation: `${spin} 2s linear infinite`,
        '& .MuiSvgIcon-root': {
          fontSize: size,
          color: color,
          animation: `${pulse} 1.5s ease-in-out infinite`,
        }
      }}
    >
      <BitcoinIcon />
    </Box>
  );
};

export default BitcoinSpinner; 