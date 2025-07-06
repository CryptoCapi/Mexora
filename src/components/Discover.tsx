import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Container,
  styled
} from '@mui/material';
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import AnimatedBackground from './AnimatedBackground';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bio: string;
  email?: string;
  followers: string[];
  following: string[];
  createdAt: Date;
}

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  },
}));

const Discover = () => {
  const [user] = useAuthState(auth);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  const loadUsers = async () => {
    if (!user) {
      console.log('No hay usuario autenticado');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Intentando cargar el perfil del usuario actual:', user.uid);
      
      // Cargar el perfil del usuario actual
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (currentUserDoc.exists()) {
        const currentUserData = currentUserDoc.data();
        console.log('Datos del usuario actual:', currentUserData);
        
        setCurrentUserProfile({
          uid: user.uid,
          displayName: currentUserData.displayName || user.displayName || 'Usuario',
          photoURL: currentUserData.photoURL || user.photoURL || '',
          bio: currentUserData.bio || '',
          email: currentUserData.email || user.email || '',
          followers: currentUserData.followers || [],
          following: currentUserData.following || [],
          createdAt: currentUserData.createdAt instanceof Date ? currentUserData.createdAt : currentUserData.createdAt?.toDate() || new Date()
        });
      } else {
        console.log('El documento del usuario actual no existe, creándolo...');
        const userProfile = {
          displayName: user.displayName || 'Usuario',
          photoURL: user.photoURL || '',
          bio: '',
          email: user.email || '',
          followers: [],
          following: [],
          createdAt: new Date()
        };
        await setDoc(doc(db, 'users', user.uid), userProfile);
        console.log('Perfil de usuario creado:', userProfile);
        setCurrentUserProfile({
          uid: user.uid,
          ...userProfile
        });
      }

      // Cargar todos los usuarios de Auth y asegurarse de que tengan perfiles
      console.log('Cargando y verificando todos los usuarios...');
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      // Crear un mapa de usuarios existentes
      const existingUsers = new Map();
      querySnapshot.docs.forEach(doc => {
        existingUsers.set(doc.id, doc.data());
      });

      // Obtener todos los usuarios de Auth
      const authUsers = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      let needsBatch = false;

      authUsers.docs.forEach(authDoc => {
        if (!existingUsers.has(authDoc.id)) {
          needsBatch = true;
          const userData = authDoc.data();
          const userRef = doc(db, 'users', authDoc.id);
          batch.set(userRef, {
            displayName: userData.displayName || 'Usuario',
            photoURL: userData.photoURL || '',
            bio: '',
            email: userData.email || '',
            followers: [],
            following: [],
            createdAt: new Date()
          });
        }
      });

      if (needsBatch) {
        await batch.commit();
        console.log('Usuarios faltantes creados en Firestore');
      }

      // Cargar la lista actualizada de usuarios
      const finalQuerySnapshot = await getDocs(usersRef);
      const usersData = finalQuerySnapshot.docs
        .map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt instanceof Date ? data.createdAt : data.createdAt?.toDate() || new Date();
          return {
            uid: doc.id,
            displayName: data.displayName || 'Usuario',
            photoURL: data.photoURL || '',
            bio: data.bio || '',
            email: data.email || '',
            followers: data.followers || [],
            following: data.following || [],
            createdAt
          };
        })
        .filter(u => u.uid !== user.uid);

      console.log('Usuarios procesados:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error detallado al cargar usuarios:', error);
      setError('Error al cargar usuarios. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user]);

  const handleFollow = async (userToFollow: UserProfile) => {
    if (!user || !currentUserProfile) return;

    try {
      setLoading(true);
      const currentUserRef = doc(db, 'users', user.uid);
      const userToFollowRef = doc(db, 'users', userToFollow.uid);

      const isFollowing = currentUserProfile.following?.includes(userToFollow.uid);

      if (isFollowing) {
        await updateDoc(currentUserRef, {
          following: arrayRemove(userToFollow.uid)
        });
        await updateDoc(userToFollowRef, {
          followers: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(currentUserRef, {
          following: arrayUnion(userToFollow.uid)
        });
        await updateDoc(userToFollowRef, {
          followers: arrayUnion(user.uid)
        });
      }

      await loadUsers();
    } catch (error) {
      console.error('Error updating follow status:', error);
      setError('Error al actualizar el estado de seguimiento. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!user) {
    return (
      <Container>
        <Box textAlign="center" mt={4}>
          <Typography variant="h6">
            Por favor, inicia sesión para descubrir usuarios
          </Typography>
        </Box>
      </Container>
    );
  }

  const newUsers = users.filter(u => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return u.createdAt >= oneWeekAgo;
  });

  const suggestedUsers = users.filter(u => {
    return !newUsers.some(newUser => newUser.uid === u.uid);
  });

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <AnimatedBackground type="discover" />
      <Box sx={{ position: 'relative', zIndex: 1, p: 2 }}>
        <StyledCard sx={{ mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            centered 
            sx={{ 
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: '#FFD700',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#FFD700',
              },
            }}
          >
            <Tab label="Nuevos Usuarios" />
            <Tab label="Sugerencias" />
          </Tabs>
        </StyledCard>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress sx={{ color: '#FFD700' }} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {users.map((user) => (
              <Grid item xs={12} sm={6} md={4} key={user.uid}>
                <StyledCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar 
                        src={user.photoURL || undefined}
                        sx={{ 
                          width: 60,
                          height: 60,
                          border: '2px solid #FFD700',
                          boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
                        }}
                      />
                      <Box ml={2}>
                        <Typography variant="h6" color="white">
                          {user.displayName}
                      </Typography>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          {user.email}
                      </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleFollow(user)}
                      sx={{
                        backgroundColor: currentUserProfile?.following?.includes(user.uid) ? 'rgba(255, 255, 255, 0.1)' : '#FFD700',
                        color: currentUserProfile?.following?.includes(user.uid) ? '#FFD700' : 'black',
                        '&:hover': {
                          backgroundColor: currentUserProfile?.following?.includes(user.uid) ? 'rgba(255, 255, 255, 0.2)' : '#FFB700',
                        },
                      }}
                    >
                      {currentUserProfile?.following?.includes(user.uid) ? 'Dejar de Seguir' : 'Seguir'}
                    </Button>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && users.length === 0 && (
          <StyledCard sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="white">
              {tabValue === 0
                ? 'No hay nuevos usuarios por el momento'
                : 'No hay sugerencias disponibles'}
            </Typography>
          </StyledCard>
        )}
      </Box>
    </Box>
  );
};

export default Discover; 