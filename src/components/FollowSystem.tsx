import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Button,
  CircularProgress,
  Box,
  Alert,
} from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  auth,
  db,
} from '../firebase';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from 'firebase/firestore';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bio: string;
  followers: string[];
  following: string[];
}

const FollowSystem = () => {
  const [user] = useAuthState(auth);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setCurrentUserProfile({
          uid: doc.id,
          ...doc.data() as Omit<UserProfile, 'uid'>
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersQuery = query(collection(db, 'users'));
        const snapshot = await getDocs(usersQuery);
        const usersList = snapshot.docs
          .map(doc => ({
            uid: doc.id,
            ...doc.data() as Omit<UserProfile, 'uid'>
          }))
          .filter(u => u.uid !== user.uid); // Excluir al usuario actual

        setUsers(usersList);
      } catch (error) {
        console.error('Error loading users:', error);
        setError('Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [user]);

  const handleFollow = async (targetUserId: string) => {
    if (!user || !currentUserProfile) return;

    try {
      const currentUserRef = doc(db, 'users', user.uid);
      const targetUserRef = doc(db, 'users', targetUserId);
      const isFollowing = currentUserProfile.following.includes(targetUserId);

      if (isFollowing) {
        // Dejar de seguir
        await updateDoc(currentUserRef, {
          following: arrayRemove(targetUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(user.uid)
        });
      } else {
        // Seguir
        await updateDoc(currentUserRef, {
          following: arrayUnion(targetUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      setError('Error al actualizar estado de seguimiento');
    }
  };

  if (!user) {
    return (
      <Container>
        <Typography>Por favor inicia sesión para descubrir usuarios.</Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom sx={{ my: 4 }}>
        Descubrir Usuarios
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {users.map((profile) => (
          <Grid item xs={12} sm={6} md={4} key={profile.uid}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={profile.photoURL}
                    alt={profile.displayName}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  >
                    {profile.displayName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{profile.displayName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.followers.length} seguidores · {profile.following.length} siguiendo
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2">
                  {profile.bio || 'Sin biografía'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant={currentUserProfile?.following.includes(profile.uid) ? "outlined" : "contained"}
                  onClick={() => handleFollow(profile.uid)}
                >
                  {currentUserProfile?.following.includes(profile.uid) ? 'Dejar de seguir' : 'Seguir'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {users.length === 0 && !loading && (
        <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
          No hay usuarios disponibles para seguir.
        </Typography>
      )}
    </Container>
  );
};

export default FollowSystem; 