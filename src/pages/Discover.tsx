import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Avatar,
  CircularProgress,
  TextField,
  InputAdornment,
  styled,
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as FollowIcon,
  PersonAddDisabled as UnfollowIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(18, 18, 18, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  level: number;
  points: number;
  followers: string[];
  following: string[];
}

const Discover = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!currentUser) return;

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '!=', currentUser.uid));
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id,
        })) as User[];
        
        setUsers(usersData);
        
        // Cargar usuarios que sigue
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const currentUserDoc = await getDoc(currentUserRef);
        if (currentUserDoc.exists()) {
          setFollowing(currentUserDoc.data().following || []);
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentUser]);

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const targetUserRef = doc(db, 'users', targetUserId);
      
      if (following.includes(targetUserId)) {
        await updateDoc(userRef, {
          following: arrayRemove(targetUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUser.uid)
        });
        setFollowing(prev => prev.filter(id => id !== targetUserId));
      } else {
        await updateDoc(userRef, {
          following: arrayUnion(targetUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUser.uid)
        });
        setFollowing(prev => [...prev, targetUserId]);
      }
    } catch (error) {
      console.error('Error al actualizar seguimiento:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Descubre Personas
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar usuarios..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={3}>
        {filteredUsers.map((discoveredUser) => (
          <Grid item xs={12} sm={6} md={4} key={discoveredUser.uid}>
            <StyledCard>
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  bgcolor: 'primary.dark',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Avatar
                  src={discoveredUser.photoURL}
                  sx={{ width: 80, height: 80, border: '3px solid #fff' }}
                />
              </CardMedia>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {discoveredUser.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Nivel {discoveredUser.level} • {discoveredUser.points} puntos
                </Typography>
                <Button
                  variant="contained"
                  startIcon={following.includes(discoveredUser.uid) ? <UnfollowIcon /> : <FollowIcon />}
                  onClick={() => handleFollow(discoveredUser.uid)}
                  fullWidth
                >
                  {following.includes(discoveredUser.uid) ? 'Dejar de seguir' : 'Seguir'}
                </Button>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Discover; 