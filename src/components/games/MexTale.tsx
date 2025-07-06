import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface GameState {
  isPlaying: boolean;
  isMenu: boolean;
  currentRoom: string;
  playerX: number;
  playerY: number;
  facing: 'up' | 'down' | 'left' | 'right';
  inDialog: boolean;
  currentDialog: string[];
  dialogIndex: number;
  route: 'neutral' | 'pacifist' | 'genocide';
  day: number;
  reputation: number;
  grades: { [subject: string]: number };
  homework: { [subject: string]: boolean };
  bulliedStudents: number;
  inBattle: boolean;
  currentEnemy?: NPC;
  battleOptions: string[];
  selectedOption: number;
  battleText: string[];
}

interface Sprite {
  x: number;
  y: number;
  width: number;
  height: number;
  frameX: number;
  frameY: number;
  maxFrames: number;
  animationSpeed: number;
  animationCounter: number;
}

interface NPC {
  x: number;
  y: number;
  type: 'student' | 'teacher';
  name: string;
  dialog: {
    neutral: string[];
    pacifist: string[];
    genocide: string[];
  };
  defeated?: boolean;
}

const TILE_SIZE = 32;
const PLAYER_SPEED = 4;

const INITIAL_STATE: GameState = {
  isPlaying: false,
  isMenu: true,
  currentRoom: 'classroom',
  playerX: 400,
  playerY: 300,
  facing: 'down',
  inDialog: false,
  currentDialog: [],
  dialogIndex: 0,
  route: 'neutral',
  day: 1,
  reputation: 0,
  grades: {
    math: 0,
    spanish: 0,
    science: 0,
    history: 0
  },
  homework: {
    math: false,
    spanish: false,
    science: false,
    history: false
  },
  bulliedStudents: 0,
  inBattle: false,
  currentEnemy: undefined,
  battleOptions: ['ESTUDIAR', 'HABLAR', 'MOLESTAR', 'HUIR'],
  selectedOption: 0,
  battleText: []
};

const MexTale: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const playerSpriteSheet = useRef<HTMLImageElement | null>(null);
  const npcsRef = useRef<NPC[]>([
    {
      x: 300,
      y: 200,
      type: 'student',
      name: 'Carlos',
      dialog: {
        neutral: ['* ¡Hola! ¿También eres nuevo?', '* Espero que podamos ser amigos.'],
        pacifist: ['* ¡Gracias por ayudarme con la tarea!', '* Eres muy buena onda.'],
        genocide: ['* Por favor, déjame en paz...', '* No quiero problemas.']
      }
    },
    {
      x: 500,
      y: 150,
      type: 'teacher',
      name: 'Maestra Lupita',
      dialog: {
        neutral: ['* Bienvenido a tu primer día.', '* Espero que te guste nuestra escuela.'],
        pacifist: ['* Eres un excelente estudiante.', '* Sigue así, vas muy bien.'],
        genocide: ['* Tu comportamiento es inaceptable.', '* Tendré que llamar a tus padres.']
      }
    }
  ]);

  // Cargar imágenes
  useEffect(() => {
    const loadSprites = async () => {
      // Crear sprite del personaje principal (32x48 pixels, 4 direcciones, 4 frames por dirección)
      const canvas = document.createElement('canvas');
      canvas.width = 128; // 4 frames
      canvas.height = 192; // 4 direcciones
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dibujar frames para cada dirección
      const directions = ['down', 'left', 'right', 'up'];
      directions.forEach((dir, dirIndex) => {
        for (let frame = 0; frame < 4; frame++) {
          // Base del personaje
          ctx.fillStyle = '#4A3421'; // Piel morena
          ctx.fillRect(frame * 32 + 8, dirIndex * 48 + 8, 16, 16); // Cabeza
          ctx.fillRect(frame * 32 + 12, dirIndex * 48 + 24, 8, 16); // Cuello y torso

          // Uniforme escolar
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(frame * 32 + 8, dirIndex * 48 + 24, 16, 16); // Camisa
          ctx.fillStyle = '#1B1464';
          ctx.fillRect(frame * 32 + 8, dirIndex * 48 + 40, 16, 8); // Pantalón

          // Animación de caminata
          const offset = Math.sin(frame * Math.PI / 2) * 2;
          if (frame % 2 === 0) {
            ctx.fillRect(frame * 32 + 8, dirIndex * 48 + 40 + offset, 4, 8); // Pierna izquierda
            ctx.fillRect(frame * 32 + 20, dirIndex * 48 + 40 - offset, 4, 8); // Pierna derecha
          } else {
            ctx.fillRect(frame * 32 + 8, dirIndex * 48 + 40 - offset, 4, 8); // Pierna izquierda
            ctx.fillRect(frame * 32 + 20, dirIndex * 48 + 40 + offset, 4, 8); // Pierna derecha
          }
        }
      });

      // Convertir el canvas a una imagen
      const img = new Image();
      img.src = canvas.toDataURL();
      playerSpriteSheet.current = img;
    };

    loadSprites();
  }, []);

  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    if (!playerSpriteSheet.current) return;

    const directionIndex = ['down', 'left', 'right', 'up'].indexOf(gameState.facing);
    const frameX = Math.floor(Date.now() / 100) % 4;
    
    ctx.drawImage(
      playerSpriteSheet.current,
      frameX * 32, directionIndex * 48, 32, 48,
      gameState.playerX, gameState.playerY, 32, 48
    );
  };

  const drawRoom = (ctx: CanvasRenderingContext2D) => {
    // Dibujar el salón de clases estilo pixel art
    ctx.fillStyle = '#8B4513'; // Color café para el piso de madera
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Dibujar paredes
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(0, 0, ctx.canvas.width, 100);

    // Dibujar pizarrón
    ctx.fillStyle = '#355E3B';
    ctx.fillRect(200, 20, 400, 150);

    // Dibujar bancas (estilo pixel art)
    const drawDesk = (x: number, y: number) => {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x, y, 40, 60);
    };

    // Dibujar cuadrícula de bancas
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        drawDesk(150 + i * 120, 200 + j * 100);
      }
    }
  };

  const drawDialog = (ctx: CanvasRenderingContext2D) => {
    if (!gameState.inDialog) return;

    // Dibujar caja de diálogo estilo Undertale
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(50, ctx.canvas.height - 150, ctx.canvas.width - 100, 130);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, ctx.canvas.height - 150, ctx.canvas.width - 100, 130);

    // Dibujar texto
    ctx.fillStyle = 'white';
    ctx.font = '24px "Press Start 2P"';
    const currentText = gameState.currentDialog[gameState.dialogIndex];
    const words = currentText.split(' ');
    let line = '';
    let y = ctx.canvas.height - 120;
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > ctx.canvas.width - 140) {
        ctx.fillText(line, 70, y);
        line = word + ' ';
        y += 30;
      } else {
        line = testLine;
      }
    });
    ctx.fillText(line, 70, y);
  };

  const drawNPCs = (ctx: CanvasRenderingContext2D) => {
    npcsRef.current.forEach(npc => {
      // Dibujar NPC
      if (npc.type === 'student') {
        // Estudiante
        ctx.fillStyle = '#4A3421';
        ctx.fillRect(npc.x + 8, npc.y + 8, 16, 16); // Cabeza
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(npc.x + 8, npc.y + 24, 16, 16); // Uniforme
        ctx.fillStyle = '#1B1464';
        ctx.fillRect(npc.x + 8, npc.y + 40, 16, 8); // Pantalón
      } else {
        // Maestro/a
        ctx.fillStyle = '#4A3421';
        ctx.fillRect(npc.x + 8, npc.y + 4, 16, 16); // Cabeza
        ctx.fillStyle = '#663399';
        ctx.fillRect(npc.x + 4, npc.y + 20, 24, 28); // Vestido/traje
      }
    });
  };

  const startBattle = (npc: NPC) => {
    setGameState(prev => ({
      ...prev,
      inBattle: true,
      currentEnemy: npc,
      battleText: [`* ${npc.name} te mira fijamente.`]
    }));
  };

  const drawBattle = (ctx: CanvasRenderingContext2D) => {
    if (!gameState.inBattle || !gameState.currentEnemy) return;

    // Fondo negro
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Dibujar enemigo
    const enemy = gameState.currentEnemy;
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 3;

    if (enemy.type === 'student') {
      // Dibujar estudiante más grande
      ctx.fillStyle = '#4A3421';
      ctx.fillRect(centerX - 32, centerY - 32, 64, 64); // Cabeza
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(centerX - 32, centerY + 32, 64, 64); // Uniforme
      ctx.fillStyle = '#1B1464';
      ctx.fillRect(centerX - 32, centerY + 96, 64, 32); // Pantalón
    } else {
      // Dibujar maestro/a más grande
      ctx.fillStyle = '#4A3421';
      ctx.fillRect(centerX - 32, centerY - 48, 64, 64); // Cabeza
      ctx.fillStyle = '#663399';
      ctx.fillRect(centerX - 48, centerY + 16, 96, 112); // Vestido/traje
    }

    // Caja de batalla
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, ctx.canvas.height - 200, ctx.canvas.width - 100, 150);

    // Opciones de batalla
    ctx.font = '24px "Press Start 2P"';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';

    const optionsPerRow = 2;
    const optionWidth = (ctx.canvas.width - 120) / optionsPerRow;
    
    gameState.battleOptions.forEach((option, index) => {
      const x = 70 + (index % optionsPerRow) * optionWidth;
      const y = ctx.canvas.height - 160 + Math.floor(index / optionsPerRow) * 40;
      
      if (index === gameState.selectedOption) {
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('* ' + option, x, y);
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.fillText('  ' + option, x, y);
      }
    });

    // Texto de batalla
    if (gameState.battleText.length > 0) {
      ctx.font = '20px "Press Start 2P"';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(gameState.battleText[gameState.battleText.length - 1], 70, ctx.canvas.height - 50);
    }
  };

  const handleBattleAction = () => {
    if (!gameState.currentEnemy) return;

    const option = gameState.battleOptions[gameState.selectedOption];
    let newText: string[] = [];
    
    switch (option) {
      case 'ESTUDIAR':
        if (gameState.currentEnemy.type === 'teacher') {
          newText = ['* La maestra está orgullosa de tu dedicación.', '* Tu reputación aumenta.'];
          setGameState(prev => ({
            ...prev,
            reputation: prev.reputation + 5,
            route: prev.route === 'genocide' ? 'neutral' : 'pacifist'
          }));
        } else {
          newText = ['* Propones estudiar juntos.', '* ' + gameState.currentEnemy.name + ' acepta con gusto.'];
          setGameState(prev => ({
            ...prev,
            reputation: prev.reputation + 2,
            route: prev.route === 'genocide' ? 'neutral' : 'pacifist'
          }));
        }
        break;

      case 'HABLAR':
        newText = gameState.currentEnemy.dialog[gameState.route];
        break;

      case 'MOLESTAR':
        if (gameState.currentEnemy.type === 'student') {
          newText = ['* Molestas a ' + gameState.currentEnemy.name + '.', '* Te sientes mal persona.'];
          setGameState(prev => ({
            ...prev,
            reputation: prev.reputation - 5,
            bulliedStudents: prev.bulliedStudents + 1,
            route: prev.bulliedStudents >= 3 ? 'genocide' : 'neutral'
          }));
        } else {
          newText = ['* La maestra te manda a la dirección.', '* Tu reputación baja considerablemente.'];
          setGameState(prev => ({
            ...prev,
            reputation: prev.reputation - 10
          }));
        }
        break;

      case 'HUIR':
        setGameState(prev => ({
          ...prev,
          inBattle: false,
          currentEnemy: undefined,
          battleText: []
        }));
        return;
    }

    setGameState(prev => ({
      ...prev,
      battleText: [...prev.battleText, ...newText]
    }));
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState.isMenu) {
      // Menú principal mejorado
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Título con efecto de sombra
      ctx.fillStyle = '#FF0000';
      ctx.font = '52px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('MexTale', canvas.width / 2 + 4, canvas.height / 3 + 4);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '48px "Press Start 2P"';
      ctx.fillText('MexTale', canvas.width / 2, canvas.height / 3);
      
      ctx.font = '24px "Press Start 2P"';
      ctx.fillText('Presiona ENTER para comenzar', canvas.width / 2, canvas.height * 2/3);
      
      // Subtítulo con la ruta actual
      ctx.font = '16px "Press Start 2P"';
      ctx.fillStyle = gameState.route === 'genocide' ? '#FF0000' : '#00FF00';
      ctx.fillText(
        `Día ${gameState.day} - ${gameState.route === 'genocide' ? 'Ruta Genocida' : 'Ruta Pacífica'}`,
        canvas.width / 2,
        canvas.height * 3/4
      );
    } else if (gameState.inBattle) {
      drawBattle(ctx);
    } else {
      drawRoom(ctx);
      drawNPCs(ctx);
      drawPlayer(ctx);
      drawDialog(ctx);
      
      // HUD
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px "Press Start 2P"';
      ctx.textAlign = 'left';
      ctx.fillText(`Día: ${gameState.day}`, 10, 30);
      ctx.fillText(`Reputación: ${gameState.reputation}`, 10, 50);
    }

    requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Configurar tamaño del canvas
    canvas.width = 800;
    canvas.height = 600;

    // Iniciar bucle del juego
    const loop = requestAnimationFrame(gameLoop);

    // Manejar input del teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isMenu && e.key === 'Enter') {
        setGameState(prev => ({ ...prev, isMenu: false, isPlaying: true }));
        return;
      }

      if (gameState.inBattle) {
        switch (e.key.toLowerCase()) {
          case 'arrowleft':
            setGameState(prev => ({
              ...prev,
              selectedOption: (prev.selectedOption + 3) % 4
            }));
            break;
          case 'arrowright':
            setGameState(prev => ({
              ...prev,
              selectedOption: (prev.selectedOption + 1) % 4
            }));
            break;
          case 'arrowup':
            setGameState(prev => ({
              ...prev,
              selectedOption: prev.selectedOption >= 2 ? prev.selectedOption - 2 : prev.selectedOption + 2
            }));
            break;
          case 'arrowdown':
            setGameState(prev => ({
              ...prev,
              selectedOption: prev.selectedOption >= 2 ? prev.selectedOption - 2 : prev.selectedOption + 2
            }));
            break;
          case 'z':
          case 'enter':
            handleBattleAction();
            break;
        }
        return;
      }

      if (gameState.inDialog) {
        if (e.key === 'Enter' || e.key === 'z') {
          if (gameState.dialogIndex < gameState.currentDialog.length - 1) {
            setGameState(prev => ({ ...prev, dialogIndex: prev.dialogIndex + 1 }));
          } else {
            setGameState(prev => ({ ...prev, inDialog: false, dialogIndex: 0 }));
          }
        }
        return;
      }

      // Movimiento del jugador
      const speed = PLAYER_SPEED;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setGameState(prev => ({ ...prev, playerY: prev.playerY - speed, facing: 'up' }));
          break;
        case 's':
        case 'arrowdown':
          setGameState(prev => ({ ...prev, playerY: prev.playerY + speed, facing: 'down' }));
          break;
        case 'a':
        case 'arrowleft':
          setGameState(prev => ({ ...prev, playerX: prev.playerX - speed, facing: 'left' }));
          break;
        case 'd':
        case 'arrowright':
          setGameState(prev => ({ ...prev, playerX: prev.playerX + speed, facing: 'right' }));
          break;
        case 'z':
        case 'enter':
          // Interactuar
          setGameState(prev => ({
            ...prev,
            inDialog: true,
            currentDialog: ['* Bienvenido a la Escuela Primaria Benito Juárez.', '* ¿Estás listo para tu primer día de clases?']
          }));
          break;
      }

      // Verificar colisión con NPCs
      const playerBounds = {
        x: gameState.playerX,
        y: gameState.playerY,
        width: 32,
        height: 48
      };

      npcsRef.current.forEach(npc => {
        const npcBounds = {
          x: npc.x,
          y: npc.y,
          width: 32,
          height: 48
        };

        if (
          playerBounds.x < npcBounds.x + npcBounds.width &&
          playerBounds.x + playerBounds.width > npcBounds.x &&
          playerBounds.y < npcBounds.y + npcBounds.height &&
          playerBounds.y + playerBounds.height > npcBounds.y
        ) {
          startBattle(npc);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(loop);
    };
  }, [gameState]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: 2,
      p: 3,
      bgcolor: '#000'
    }}>
      <canvas
        ref={canvasRef}
        style={{ 
          border: '2px solid #FFF',
          imageRendering: 'pixelated'
        }}
      />
    </Box>
  );
};

export default MexTale; 