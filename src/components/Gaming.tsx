import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Rating,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  styled,
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  GamepadOutlined as GamepadIcon,
} from '@mui/icons-material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  where,
  deleteDoc,
} from 'firebase/firestore';
import SnakeGame from './games/SnakeGame';
import MathDoom from './games/MathDoom';
import MexTale from './games/MexTale';
import AnimatedBackground from './AnimatedBackground';

interface Game {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  genre: string[];
  rating: number;
  developer: string;
  releaseDate: string;
  price: number;
  isFavorite?: boolean;
}

const GamingContainer = styled(Box)({
  background: 'linear-gradient(135deg, #006847 0%, #ce1126 50%, #000000 100%)',
  minHeight: '100vh',
  paddingTop: '80px',
  paddingBottom: '20px',
});

const Gaming = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [games, setGames] = useState<Game[]>([]);
  const genres = ['Acción', 'Aventura', 'RPG', 'Estrategia', 'Deportes'];
  const [user] = useAuthState(auth);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const gamesRef = collection(db, 'games');
      const querySnapshot = await getDocs(gamesRef);
      const gamesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Game[];
      setGames(gamesData);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleFavorite = async (gameId: string) => {
    if (!user) return;

    try {
      const gameRef = doc(db, 'games', gameId);
      const userRef = doc(db, 'users', user.uid);
      const game = games.find(g => g.id === gameId);

      if (game) {
        await updateDoc(gameRef, {
          isFavorite: !game.isFavorite
        });
        await loadGames();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || game.genre.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <AnimatedBackground type="gaming" />
      <GamingContainer>
        <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 6, color: '#FFD700' }}>
            Zona Gaming
          </Typography>

          <Paper
            sx={{
              p: 2,
              backgroundColor: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                mb: 3,
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-selected': {
                    color: '#FFD700',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#FFD700',
                },
              }}
            >
              <Tab label="Snake Game" />
              <Tab label="Math Doom" />
              <Tab label="MexTale" />
              <Tab label="Próximamente" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {tabValue === 0 && <SnakeGame />}
              {tabValue === 1 && <MathDoom />}
              {tabValue === 2 && <MexTale />}
              {tabValue === 3 && (
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', py: 4 }}>
                  ¡Más juegos emocionantes vienen en camino!
                </Typography>
              )}
            </Box>
          </Paper>
        </Container>
      </GamingContainer>
    </Box>
  );
};

export default Gaming; 