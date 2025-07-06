import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, IconButton } from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Pause,
  ExitToApp,
} from '@mui/icons-material';

interface GameState {
  isPlaying: boolean;
  isFullscreen: boolean;
  isMenu: boolean;
  score: number;
  health: number;
  ammo: number;
  level: number;
  lives: number;
  mouseX?: number;
  mouseY?: number;
}

interface Player {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  type: 'algebra' | 'calculus' | 'geometry' | 'trigonometry' | 'statistics';
}

const MathDoom: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isFullscreen: false,
    isMenu: true,
    score: 0,
    health: 100,
    ammo: 30,
    level: 1,
    lives: 5,
  });

  const playerRef = useRef<Player>({
    x: 5,
    y: 5,
    angle: 0,
    speed: 0.1,
  });

  const enemiesRef = useRef<Enemy[]>([
    { x: 8, y: 8, health: 100, type: 'algebra' },
    { x: 12, y: 12, health: 100, type: 'calculus' },
    { x: 15, y: 15, health: 100, type: 'geometry' },
    { x: 18, y: 18, health: 100, type: 'trigonometry' },
    { x: 3, y: 3, health: 100, type: 'statistics' },
  ]);

  // Función para iniciar el juego
  const startGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: true, isMenu: false }));
    // Forzar pantalla completa al iniciar
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen();
      setGameState(prev => ({ ...prev, isFullscreen: true }));
    }
  };

  // Función para pausar el juego
  const pauseGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
  };

  // Función para volver al menú
  const returnToMenu = () => {
    setGameState(prev => ({ ...prev, isPlaying: false, isMenu: true }));
  };

  // Función para alternar pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen();
      setGameState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setGameState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  // Mover enemigos
  const moveEnemies = () => {
    const speed = 0.1 + (gameState.level * 0.02); // Aumentamos la velocidad base
    enemiesRef.current.forEach(enemy => {
      // Movimiento más dinámico
      const angle = Math.random() * Math.PI * 2;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      
      // Movimiento suave con límites
      enemy.x = Math.max(1, Math.min(19, enemy.x + dx));
      enemy.y = Math.max(1, Math.min(19, enemy.y + dy));

      // Verificar colisión con jugador
      const distance = Math.sqrt(
        Math.pow(playerRef.current.x - enemy.x, 2) + 
        Math.pow(playerRef.current.y - enemy.y, 2)
      );
      
      if (distance < 1) {
        setGameState(prev => ({ ...prev, lives: prev.lives - 1 }));
        if (gameState.lives <= 1) {
          setGameState(prev => ({ ...prev, isPlaying: false, isMenu: true }));
        }
      }
    });
  };

  // Manejar movimiento del mouse
  const handleMouseMove = (e: MouseEvent) => {
    if (!gameState.isPlaying) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setGameState(prev => ({
      ...prev,
      mouseX: x,
      mouseY: y
    }));
  };

  // Manejar clic
  const handleClick = () => {
    if (!gameState.isPlaying || gameState.ammo <= 0) return;

    // Reducir munición
    setGameState(prev => ({ ...prev, ammo: prev.ammo - 1 }));

    // Verificar colisión con enemigos usando la posición de la mira
    const mouseX = gameState.mouseX || canvasRef.current!.width / 2;
    const mouseY = gameState.mouseY || canvasRef.current!.height / 2;
    
    let newScore = gameState.score;
    let enemiesEliminated = 0;
    
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      // Convertir posición del enemigo a coordenadas de pantalla
      const screenX = (enemy.x - playerRef.current.x) * 50 + canvasRef.current!.width / 2;
      const screenY = (enemy.y - playerRef.current.y) * 50 + canvasRef.current!.height / 2;
      
      // Verificar si el disparo golpea al enemigo usando la posición de la mira
      const distance = Math.sqrt(
        Math.pow(screenX - mouseX, 2) + 
        Math.pow(screenY - mouseY, 2)
      );
      
      if (distance < 30) { // Reducimos el área de impacto para hacerlo más preciso
        newScore += 100;
        enemiesEliminated++;
        return false;
      }
      return true;
    });

    // Actualizar puntuación
    setGameState(prev => ({ ...prev, score: newScore }));

    // Si se eliminaron todos los enemigos, subir de nivel
    if (enemiesRef.current.length === 0) {
      setGameState(prev => ({
        ...prev,
        level: prev.level + 1,
        ammo: 30,
      }));
      
      // Agregar más enemigos según el nivel
      const newEnemies: Enemy[] = [];
      const enemyCount = 3 + gameState.level;
      for (let i = 0; i < enemyCount; i++) {
        newEnemies.push({
          x: Math.random() * 18 + 1,
          y: Math.random() * 18 + 1,
          health: 100,
          type: ['algebra', 'calculus', 'geometry', 'trigonometry', 'statistics'][Math.floor(Math.random() * 5)] as any,
        });
      }
      enemiesRef.current = newEnemies;
    }
  };

  // Dibujar el juego
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar el canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar el suelo
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    // Dibujar el techo
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    // Dibujar paredes
    const wallWidth = 50;
    const wallHeight = canvas.height;
    ctx.fillStyle = '#006847';
    
    // Paredes laterales
    ctx.fillRect(0, 0, wallWidth, wallHeight);
    ctx.fillRect(canvas.width - wallWidth, 0, wallWidth, wallHeight);

    // Dibujar enemigos
    enemiesRef.current.forEach(enemy => {
      const screenX = (enemy.x - playerRef.current.x) * 50 + canvas.width / 2;
      const screenY = (enemy.y - playerRef.current.y) * 50 + canvas.height / 2;
      
      if (screenX > 0 && screenX < canvas.width) {
        // Dibujar sombra
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(screenX - 25, screenY - 25 + 5, 50, 50);
        
        // Dibujar enemigo
        ctx.fillStyle = '#ce1126';
        ctx.fillRect(screenX - 25, screenY - 25, 50, 50);
        
        // Dibujar tipo de libro
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px VT323';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.type.toUpperCase(), screenX, screenY);
      }
    });

    // Dibujar la mira
    const mouseX = gameState.mouseX || canvas.width / 2;
    const mouseY = gameState.mouseY || canvas.height / 2;
    
    // Dibujar mira estilo Valorant
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    
    // Círculo exterior
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2);
    ctx.stroke();
    
    // Líneas internas
    ctx.beginPath();
    ctx.moveTo(mouseX - 5, mouseY);
    ctx.lineTo(mouseX + 5, mouseY);
    ctx.moveTo(mouseX, mouseY - 5);
    ctx.lineTo(mouseX, mouseY + 5);
    ctx.stroke();

    // Dibujar mano con liga
    const handX = canvas.width - 100;
    const handY = canvas.height - 100;
    
    // Dibujar mano
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(handX, handY, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Dibujar liga
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();

    // Dibujar HUD con nivel más visible
    ctx.fillStyle = '#FFD700';
    ctx.font = '20px VT323';
    ctx.textAlign = 'left';
    ctx.fillText(`Salud: ${gameState.health}`, 20, 30);
    ctx.fillText(`Munición: ${gameState.ammo}`, 20, 60);
    ctx.fillText(`Puntuación: ${gameState.score}`, 20, 90);
    ctx.font = '24px VT323';
    ctx.fillText(`NIVEL ${gameState.level}`, 20, 120);

    // Dibujar barra de vida
    const lifeBarWidth = 200;
    const lifeBarHeight = 20;
    const lifeBarX = 20;
    const lifeBarY = canvas.height - 40;

    // Fondo de la barra
    ctx.fillStyle = '#333';
    ctx.fillRect(lifeBarX, lifeBarY, lifeBarWidth, lifeBarHeight);

    // Barra de vida actual
    const lifeWidth = (lifeBarWidth * gameState.lives) / 5;
    ctx.fillStyle = gameState.lives > 2 ? '#00ff00' : '#ff0000';
    ctx.fillRect(lifeBarX, lifeBarY, lifeWidth, lifeBarHeight);
  };

  // Dibujar el menú
  const drawMenu = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px VT323';
    ctx.textAlign = 'center';
    ctx.fillText('MATH DOOM', canvas.width / 2, canvas.height / 3);

    // Subtítulo
    ctx.font = '24px VT323';
    ctx.fillText('¡Derrota a los libros de matemáticas!', canvas.width / 2, canvas.height / 2);

    // Instrucciones
    ctx.font = '20px VT323';
    ctx.fillText('Usa el mouse para apuntar y clic para disparar', canvas.width / 2, canvas.height * 2/3);
    ctx.fillText('Tecla R para recargar', canvas.width / 2, canvas.height * 2/3 + 30);
    ctx.fillText('5 vidas disponibles', canvas.width / 2, canvas.height * 2/3 + 60);
  };

  // Bucle del juego
  const gameLoop = () => {
    if (!gameState.isPlaying) return;

    if (gameState.isMenu) {
      drawMenu();
    } else {
      moveEnemies();
      drawGame();
    }

    requestAnimationFrame(gameLoop);
  };

  // Inicializar el juego
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar el tamaño del canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // Ocultar el cursor del sistema
    document.body.style.cursor = 'none';

    // Iniciar bucle del juego
    const loop = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      // Restaurar el cursor al salir
      document.body.style.cursor = 'default';
      cancelAnimationFrame(loop);
    };
  }, [gameState.isPlaying, gameState.isMenu]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: 2,
      p: 3
    }}>
      <Typography variant="h4" sx={{ color: '#FFD700', mb: 2 }}>
        Math Doom
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
          width: '100%',
          maxWidth: '800px',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ 
            width: '100%',
            height: '400px',
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#1a1a1a',
          }}
        />

        {gameState.isMenu && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            mt: 2
          }}>
            <Button
              variant="contained"
              onClick={startGame}
              startIcon={<PlayArrow />}
              sx={{
                background: 'linear-gradient(45deg, #006847, #ce1126)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #005538, #b30f21)',
                },
              }}
            >
              Iniciar Juego
            </Button>
            <Button
              variant="contained"
              onClick={toggleFullscreen}
              startIcon={<Fullscreen />}
              sx={{
                background: 'linear-gradient(45deg, #006847, #ce1126)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #005538, #b30f21)',
                },
              }}
            >
              Pantalla Completa
            </Button>
          </Box>
        )}

        {!gameState.isMenu && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 2
          }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography sx={{ color: '#FFD700' }}>
                Salud: {gameState.health}
              </Typography>
              <Typography sx={{ color: '#FFD700' }}>
                Munición: {gameState.ammo}
              </Typography>
              <Typography sx={{ color: '#FFD700' }}>
                Puntuación: {gameState.score}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={returnToMenu}
                startIcon={<ExitToApp />}
                sx={{
                  background: 'linear-gradient(45deg, #006847, #ce1126)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #005538, #b30f21)',
                  },
                }}
              >
                Menú
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 2 }}>
        {!gameState.isMenu && 'Usa WASD para moverte, el mouse para mirar y clic para disparar.'}
      </Typography>
    </Box>
  );
};

export default MathDoom; 