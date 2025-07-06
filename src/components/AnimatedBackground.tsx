import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  type: 'gaming' | 'discover' | 'donations' | 'stories' | 'home' | 'chat' | 'rooms';
}

const DISCOVERY_SYMBOLS = ['🔍', '👥', '🌟', '💫', '🎯', '🔮', '✨', '🎪'];

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{
      x: number;
      y: number;
      speed: number;
      symbol: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = () => {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.2 + Math.random() * 0.3,
        symbol: DISCOVERY_SYMBOLS[Math.floor(Math.random() * DISCOVERY_SYMBOLS.length)],
        size: 20 + Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        opacity: 0.1 + Math.random() * 0.2,
      };
    };

    const initParticles = () => {
      const particleCount = Math.min(20, Math.floor((canvas.width * canvas.height) / 50000));
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Crear gradiente de fondo
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 104, 71, 0.1)');
      gradient.addColorStop(1, 'rgba(206, 17, 38, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.opacity;
        ctx.font = `${particle.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.symbol, 0, 0);
        ctx.restore();

        // Actualizar posición y rotación
        particle.y += particle.speed;
        particle.rotation += particle.rotationSpeed;

        // Reiniciar partícula cuando sale de la pantalla
        if (particle.y > canvas.height) {
          particle.y = -50;
          particle.x = Math.random() * canvas.width;
        }
      });

      requestAnimationFrame(animate);
    };

    resizeCanvas();
    initParticles();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default AnimatedBackground; 