import React from 'react';

interface MexoraLogoProps {
  width?: number;
  height?: number;
}

const MexoraLogo: React.FC<MexoraLogoProps> = ({ width = 40, height = 40 }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fondo circular con degradado */}
      <circle cx="50" cy="50" r="48" fill="url(#mexicanGradient)" />
      
      {/* Borde con efecto futurista */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        stroke="url(#neonBorder)" 
        strokeWidth="2"
        strokeDasharray="4 2"
      />

      {/* Letra M estilizada */}
      <path
        d="M30 70V30L50 50L70 30V70"
        stroke="#FFD700"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Detalles decorativos mexicanos */}
      <path
        d="M25 25L35 35M65 35L75 25M25 75L35 65M65 65L75 75"
        stroke="#FFD700"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Definición de gradientes */}
      <defs>
        <linearGradient
          id="mexicanGradient"
          x1="0"
          y1="0"
          x2="100"
          y2="100"
        >
          <stop offset="0%" stopColor="#006847" />
          <stop offset="50%" stopColor="#000000" />
          <stop offset="100%" stopColor="#ce1126" />
        </linearGradient>
        
        <linearGradient
          id="neonBorder"
          x1="0"
          y1="0"
          x2="100"
          y2="100"
        >
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default MexoraLogo; 