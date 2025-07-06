import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Box,
  IconButton,
  Grid,
  Divider,
  Dialog,
  DialogContent,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, PhotoCamera as PhotoCameraIcon, Videocam as VideocamIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { EditProfileDialog } from '../components/profile/EditProfileDialog';
import UserProgress from '../components/gamification/UserProgress';
import BadgeDisplay from '../components/gamification/BadgeDisplay/BadgeDisplay';
import { doc, getDoc, collection, query, where, onSnapshot, arrayUnion, arrayRemove, addDoc, Timestamp, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db } from '../firebase';
import { User } from '../types/user';
import { useParams } from 'react-router-dom';
import GamificationService from '../services/gamificationService';

// Extensión local de la interfaz User para followers y following
interface UserWithSocial extends User {
  followers?: string[];
  following?: string[];
}

interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: string[];
  comments: any[];
  createdAt: any;
  userDisplayName: string;
  userPhotoURL: string;
}

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userData, setUserData] = useState<UserWithSocial | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);

  const storage = getStorage();
  const targetUserId = userId || currentUser?.uid;

  useEffect(() => {
    if (!targetUserId) return;
    
    const userRef = doc(db, 'users', targetUserId);
    const unsubscribeUser = onSnapshot(userRef, (userSnap) => {
      if (userSnap.exists()) {
        setUserData(userSnap.data() as UserWithSocial);
      }
    });
    return () => unsubscribeUser();
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) return;
    
    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', targetUserId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const userPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(userPosts);
    });
    
    return () => unsubscribe();
  }, [targetUserId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadType(type);
    }
  };

  const handlePost = async () => {
    if (!currentUser) return;
    try {
      let mediaUrl = '';
      setUploading(true);
      setUploadProgress(0);
      
      if (selectedFile && uploadType) {
        const storageRef = ref(storage, `posts/${uploadType}s/${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);
        
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            setUploading(false);
            setUploadProgress(0);
            console.error('Error uploading file:', error);
          },
          async () => {
            mediaUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, 'posts'), {
              userId: currentUser.uid,
              userName: currentUser.displayName || 'Usuario Anónimo',
              userAvatar: currentUser.photoURL || '',
              content: newPost,
              mediaUrl,
              mediaType: uploadType,
              likes: 0,
              comments: [],
              reactions: [],
              createdAt: Timestamp.now()
            });
            
            await GamificationService.getInstance().awardSocialPoints(currentUser.uid, 'post');
            setNewPost('');
            setSelectedFile(null);
            setUploadType(null);
            setUploading(false);
            setUploadProgress(0);
            setShowNewPostDialog(false);
          }
        );
        return;
      }
      
      // Si no hay archivo, solo texto
      await addDoc(collection(db, 'posts'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Usuario Anónimo',
        userAvatar: currentUser.photoURL || '',
        content: newPost,
        mediaUrl: '',
        mediaType: null,
        likes: 0,
        comments: [],
        reactions: [],
        createdAt: Timestamp.now()
      });
      
      await GamificationService.getInstance().awardSocialPoints(currentUser.uid, 'post');
      setNewPost('');
      setSelectedFile(null);
      setUploadType(null);
      setUploading(false);
      setUploadProgress(0);
      setShowNewPostDialog(false);
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      console.error('Error creating post:', error);
    }
  };

  if (!currentUser || !userData) {
    return (
      <Container>
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          Por favor, inicia sesión para ver tu perfil
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 10 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)' }}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Box position="relative">
                <Avatar
                  src={userData.photoURL || ''}
                  alt={userData.displayName}
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
                {!userId && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#FFD700',
                      '&:hover': { backgroundColor: '#FFC300' },
                    }}
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              <Typography variant="h5" gutterBottom>
                {userData.displayName}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {userData.bio || 'Sin biografía'}
              </Typography>
              <Box width="100%">
                <Typography variant="subtitle2" gutterBottom>
                  Estadísticas
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="h6" align="center">
                      {posts.length}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Posts
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6" align="center">
                      {userData.followers ? userData.followers.length : 0}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Seguidores
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6" align="center">
                      {userData.following ? userData.following.length : 0}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Siguiendo
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              {!userId && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShowNewPostDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Nueva Publicación
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Publicaciones</Typography>
              {posts.length === 0 ? (
                <Typography color="text.secondary">Este usuario no ha publicado nada aún.</Typography>
              ) : (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                  gap: 2,
                }}>
                  {posts.map((post) => (
                    <Box
                      key={post.id}
                      sx={{ cursor: 'pointer', borderRadius: 2, overflow: 'hidden', boxShadow: 2, bgcolor: 'rgba(0,0,0,0.7)' }}
                      onClick={() => setSelectedPost(post)}
                    >
                      {post.mediaUrl ? (
                        post.mediaType === 'video' ? (
                          <video src={post.mediaUrl} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <img src={post.mediaUrl} alt={post.content || 'Publicación'} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                        )
                      ) : (
                        <Box sx={{ width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, bgcolor: 'rgba(255,255,255,0.05)' }}>
                          {post.content.slice(0, 40) || 'Sin contenido'}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              <Dialog open={!!selectedPost} onClose={() => setSelectedPost(null)} maxWidth="md" fullWidth>
                <DialogContent sx={{ bgcolor: 'black', p: 3 }}>
                  {selectedPost && (
                    <Box>
                      {selectedPost.mediaUrl && (
                        selectedPost.mediaType === 'video' ? (
                          <video src={selectedPost.mediaUrl} controls style={{ width: '100%', maxHeight: 400, marginBottom: 16 }} />
                        ) : (
                          <img src={selectedPost.mediaUrl} alt="Publicación" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', marginBottom: 16 }} />
                        )
                      )}
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>{selectedPost.content}</Typography>
                      <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>
                        Likes: {selectedPost.likes.length}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {(Array.isArray(selectedPost.likes) ? selectedPost.likes : []).map((uid, idx) => (
                          <Box key={idx} sx={{ color: 'white', fontSize: 12, px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)' }}>{uid}</Box>
                        ))}
                      </Box>
                      <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>
                        Comentarios:
                      </Typography>
                      {selectedPost.comments.length === 0 ? (
                        <Typography sx={{ color: 'white', fontStyle: 'italic' }}>Sin comentarios</Typography>
                      ) : (
                        selectedPost.comments.map((comment, idx) => (
                          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar src={comment.userPhotoURL || ''} sx={{ width: 24, height: 24, mr: 1 }} />
                            <Typography sx={{ color: '#FFD700', fontWeight: 'bold', mr: 1 }}>{comment.userDisplayName || 'Usuario'}:</Typography>
                            <Typography sx={{ color: 'white' }}>{comment.text}</Typography>
                          </Box>
                        ))
                      )}
                    </Box>
                  )}
                </DialogContent>
              </Dialog>
            </Grid>
            <Grid item xs={12}>
              <UserProgress />
            </Grid>
            <Grid item xs={12}>
              <BadgeDisplay />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Diálogo para nueva publicación */}
      <Dialog 
        open={showNewPostDialog} 
        onClose={() => setShowNewPostDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)', color: 'white' }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="¿Qué estás pensando?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {selectedFile && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="preview"
                  style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                />
              ) : (
                <video
                  src={URL.createObjectURL(selectedFile)}
                  controls
                  style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                />
              )}
            </Box>
          )}
          
          {uploading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <CircularProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {Math.round(uploadProgress)}%
              </Typography>
            </Box>
          )}
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={(e) => handleFileSelect(e, 'image')}
              />
              <label htmlFor="image-upload">
                <IconButton color="primary" component="span">
                  <PhotoCameraIcon />
                </IconButton>
              </label>
              
              <input
                accept="video/*"
                style={{ display: 'none' }}
                id="video-upload"
                type="file"
                onChange={(e) => handleFileSelect(e, 'video')}
              />
              <label htmlFor="video-upload">
                <IconButton color="primary" component="span">
                  <VideocamIcon />
                </IconButton>
              </label>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handlePost}
              disabled={uploading || (!newPost && !selectedFile)}
            >
              Publicar
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <EditProfileDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        userData={userData}
        onSave={(updatedData: User) => {
          setUserData(updatedData);
          setEditDialogOpen(false);
        }}
      />
    </Container>
  );
};

export default Profile; 