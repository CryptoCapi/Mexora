import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  KeyboardArrowUp,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

const SnakeGame: React.FC = () => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Position>({ x: 0, y: 0 });
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const gameLoopRef = useRef<number | null>(null);

  // Generar comida en posición aleatoria
  const generateFood = () => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    setFood(newFood);
  };

  // Inicializar el juego
  const initGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: 0 });
    setScore(0);
    setGameOver(false);
    setSpeed(INITIAL_SPEED);
    generateFood();
  };

  // Dibujar el juego
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar el canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar la serpiente
    ctx.fillStyle = '#006847'; // Verde mexicano
    snake.forEach((segment, index) => {
      if (index === 0) {
        // Cabeza de la serpiente
        ctx.fillStyle = '#ce1126'; // Rojo mexicano
      } else {
        ctx.fillStyle = '#006847'; // Verde mexicano
      }
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    });

    // Dibujar la comida
    ctx.fillStyle = '#FFD700'; // Dorado
    ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
  };

  // Actualizar el estado del juego
  const updateGame = () => {
    if (gameOver) return;

    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    // Mover la cabeza
    head.x += direction.x;
    head.y += direction.y;

    // Verificar colisiones con los bordes
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameOver(true);
      return;
    }

    // Verificar colisiones con la serpiente
    if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
      setGameOver(true);
      return;
    }

    newSnake.unshift(head);

    // Verificar si come la comida
    if (head.x === food.x && head.y === food.y) {
      setScore(prevScore => prevScore + 10);
      generateFood();
      // Aumentar la velocidad cada 50 puntos
      if (score % 50 === 0 && speed > 50) {
        setSpeed(prevSpeed => prevSpeed - 10);
      }
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  // Agregar función para manejar los controles táctiles
  const handleDirectionChange = (newDirection: Position) => {
    if (
      (newDirection.y === -1 && direction.y !== 1) ||
      (newDirection.y === 1 && direction.y !== -1) ||
      (newDirection.x === -1 && direction.x !== 1) ||
      (newDirection.x === 1 && direction.x !== -1)
    ) {
      setDirection(newDirection);
    }
  };

  // Manejar las teclas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  // Bucle principal del juego
  useEffect(() => {
    if (!gameOver) {
      gameLoopRef.current = window.setInterval(() => {
        updateGame();
        draw();
      }, speed);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [snake, food, direction, gameOver, speed]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: 2,
      p: 3
    }}>
      <Typography variant="h4" sx={{ color: '#FFD700', mb: 2 }}>
        Snake Game
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </Paper>

      {/* Controles táctiles */}
      <Box sx={{ 
        display: { xs: 'flex', md: 'none' },
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        mt: 2
      }}>
        <IconButton
          onClick={() => handleDirectionChange({ x: 0, y: -1 })}
          sx={{
            color: '#FFD700',
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            '&:hover': { backgroundColor: 'rgba(26, 26, 26, 0.8)' },
          }}
        >
          <KeyboardArrowUp />
        </IconButton>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <IconButton
            onClick={() => handleDirectionChange({ x: -1, y: 0 })}
            sx={{
              color: '#FFD700',
              backgroundColor: 'rgba(26, 26, 26, 0.95)',
              '&:hover': { backgroundColor: 'rgba(26, 26, 26, 0.8)' },
            }}
          >
            <KeyboardArrowLeft />
          </IconButton>
          <IconButton
            onClick={() => handleDirectionChange({ x: 1, y: 0 })}
            sx={{
              color: '#FFD700',
              backgroundColor: 'rgba(26, 26, 26, 0.95)',
              '&:hover': { backgroundColor: 'rgba(26, 26, 26, 0.8)' },
            }}
          >
            <KeyboardArrowRight />
          </IconButton>
        </Box>
        <IconButton
          onClick={() => handleDirectionChange({ x: 0, y: 1 })}
          sx={{
            color: '#FFD700',
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            '&:hover': { backgroundColor: 'rgba(26, 26, 26, 0.8)' },
          }}
        >
          <KeyboardArrowDown />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: '#FFD700' }}>
          Puntuación: {score}
        </Typography>
        {gameOver && (
          <Button
            variant="contained"
            onClick={initGame}
            sx={{
              background: 'linear-gradient(45deg, #006847, #ce1126)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #005538, #b30f21)',
              },
            }}
          >
            Jugar de nuevo
          </Button>
        )}
      </Box>

      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 2 }}>
        {window.innerWidth <= 960 ? 
          'Usa los botones de dirección para mover la serpiente' :
          'Usa las flechas del teclado para mover la serpiente'
        }
      </Typography>
    </Box>
  );
};

export default SnakeGame; 