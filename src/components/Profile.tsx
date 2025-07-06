import React, { useState, useEffect } from 'react';
import { Avatar, Button, TextField, Typography, Box, Card, CardContent, CardActions, IconButton } from '@mui/material';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Favorite as FavoriteIcon, FavoriteBorder as FavoriteBorderIcon } from '@mui/icons-material';

const storage = getStorage();

interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: string[];
  comments: any[];
  createdAt: any;
  userPhotoURL?: string;
  userDisplayName?: string;
  email: string;
}

const Profile = () => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user] = useState(auth.currentUser);

  useEffect(() => {
    if (user) {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const postsData: Post[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          postsData.push({
            id: doc.id,
            ...data,
            likes: data.likes || [],
            comments: data.comments || []
          } as Post);
        });
        setPosts(postsData);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        let photoURL = user.photoURL;
        if (photo) {
          const storageRef = ref(storage, `profile/${user.uid}/${photo.name}`);
          await uploadBytes(storageRef, photo);
          photoURL = await getDownloadURL(storageRef);
          await updateProfile(user, { photoURL });
          await updateDoc(doc(db, 'users', user.uid), { photoURL });
        }
        if (nickname) {
          await updateProfile(user, { displayName: nickname });
          await updateDoc(doc(db, 'users', user.uid), { displayName: nickname });
          
          // Actualizar el nombre en todas las publicaciones del usuario
          const postsQuery = query(
            collection(db, 'posts'),
            where('userId', '==', user.uid)
          );
          const postsSnapshot = await getDocs(postsQuery);
          const updatePromises = postsSnapshot.docs.map(doc => 
            updateDoc(doc.ref, { userDisplayName: nickname })
          );
          await Promise.all(updatePromises);
        }
        if (description) {
          await updateDoc(doc(db, 'users', user.uid), { description });
        }
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Perfil</Typography>
      <Avatar src={photo ? URL.createObjectURL(photo) : user?.photoURL || ''} sx={{ width: 100, height: 100 }} />
      <input type="file" accept="image/*" onChange={handlePhotoChange} />
      <TextField
        label="Apodo"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        margin="normal"
        multiline
        rows={4}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSaveChanges}
        disabled={loading}
      >
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </Button>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>Mis Publicaciones</Typography>
        {posts.map((post) => (
          <Card key={post.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="body1">{post.content}</Typography>
              {post.mediaUrl && (
                <Box mt={2}>
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls style={{ maxWidth: '100%' }} />
                  ) : (
                    <img src={post.mediaUrl} alt="Post media" style={{ maxWidth: '100%' }} />
                  )}
                </Box>
              )}
            </CardContent>
            <CardActions>
              <IconButton>
                {post.likes?.includes(user?.uid || '') ? (
                  <FavoriteIcon color="error" />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
              <Typography variant="body2">
                {post.likes?.length || 0} likes
              </Typography>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Profile; 