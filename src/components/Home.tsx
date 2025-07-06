import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Snackbar
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  PhotoCamera,
  VideoCall as VideoCallIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  auth,
  db,
  storage,
} from '../firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  DocumentReference,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Stories from './Stories';
import Videocam from '@mui/icons-material/Videocam';
import AnimatedBackground from './AnimatedBackground';
import { styled } from '@mui/material/styles';
import { uploadFile } from '../services/uploadService';

interface Comment {
  userId: string;
  text: string;
  createdAt: any;
  userPhotoURL?: string;
  userDisplayName?: string;
}

interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: string[];
  comments: Comment[];
  createdAt: any;
  userPhotoURL?: string;
  userDisplayName?: string;
  email: string;
}

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
}

const Input = styled('input')({
  display: 'none',
});

const PostContainer = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(10px)',
  borderRadius: '15px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  color: '#ffffff',
}));

const ImagePreview = styled(Box)({
  position: 'relative',
  marginTop: 2,
  '& img': {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '8px',
  },
});

const HomeContainer = styled(Box)({
  position: 'relative',
  minHeight: '100vh',
});

// Utilidad para cachear apodos
const apodoCache: Record<string, string> = {};

async function getUserDisplayName(uid: string): Promise<string> {
  if (apodoCache[uid]) return apodoCache[uid];
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      apodoCache[uid] = data.displayName || 'Usuario';
      return apodoCache[uid];
    } else {
      // Si no existe, crear el documento con el displayName actual
      await setDoc(doc(db, 'users', uid), { displayName: 'Usuario' });
      apodoCache[uid] = 'Usuario';
      return 'Usuario';
    }
  } catch {
    return 'Usuario';
  }
}

const Home = () => {
  const [user] = useAuthState(auth);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postContent, setPostContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    // Convertir timestamp de Firestore a Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchPosts = () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      
      return onSnapshot(q, async (snapshot) => {
        const postsData: Post[] = [];
        
        for (const docSnap of snapshot.docs) {
          const postData = docSnap.data();
          let userData = null;
          let displayName = postData.userDisplayName || 'Usuario';
          try {
            displayName = await getUserDisplayName(postData.userId);
          } catch {}
          
          try {
            const userDocRef = doc(db, 'users', postData.userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              userData = userDoc.data();
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }

          postsData.push({
            id: docSnap.id,
            userId: postData.userId,
            content: postData.content,
            mediaUrl: postData.mediaUrl || '',
            mediaType: postData.mediaType || null,
            likes: postData.likes || [],
            comments: postData.comments || [],
            createdAt: postData.createdAt,
            userDisplayName: displayName,
            userPhotoURL: userData?.photoURL || postData.userPhotoURL || '',
            email: postData.email || '',
          });
        }

      setPosts(postsData);
        setLoading(false);
      }, (error) => {
        console.error('Error en la suscripción:', error);
        setError('Error al cargar las publicaciones');
        setLoading(false);
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
      return () => {};
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (user) {
      unsubscribe = fetchPosts();
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      setError('Debes iniciar sesión para subir archivos');
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño máximo (100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('El archivo no puede ser mayor a 100MB');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Crear una referencia única para el archivo
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `uploads/${user.uid}/${fileName}`);

      // Subir el archivo
      const uploadTask = uploadBytes(storageRef, file);
      await uploadTask;

      // Obtener la URL de descarga
      const downloadURL = await getDownloadURL(storageRef);

      // Crear el post
      const postData = {
        userId: user.uid,
        userDisplayName: user.displayName || 'Usuario',
        userPhotoURL: user.photoURL || '',
        email: user.email || '',
        content: postContent || '',
        mediaUrl: downloadURL,
        mediaType: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      // Actualizar el estado local
      setPosts(prevPosts => [{
        id: docRef.id,
        ...postData,
        createdAt: new Date()
      }, ...prevPosts]);

      // Limpiar el formulario
      setPostContent('');
      setSelectedFile(null);
      setMediaPreview(null);
      setMediaType(null);
      
      // Mostrar mensaje de éxito
      setError('Archivo subido correctamente');
      setTimeout(() => setError(null), 3000);

    } catch (error: any) {
      console.error('Error al subir el archivo:', error);
      setError('Error al subir el archivo: ' + (error.message || 'Intenta de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      let mediaUrl = '';
      let mediaType = '';

      // Si hay un archivo seleccionado, súbelo primero
      if (selectedFile) {
        const fileName = `${Date.now()}_${selectedFile.name}`;
        const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
        const storageRef = ref(storage, `uploads/${user.uid}/${fileType}/${fileName}`);
        
        await uploadBytes(storageRef, selectedFile);
        mediaUrl = await getDownloadURL(storageRef);
        mediaType = fileType;
      }

      // Crear la publicación
      const postData = {
        userId: user.uid,
        userDisplayName: user.displayName || 'Usuario',
        userPhotoURL: user.photoURL || '',
        email: user.email || '',
        content: postContent,
        mediaUrl,
        mediaType,
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      };

      await addDoc(collection(db, 'posts'), postData);

      // Limpiar el formulario
      setPostContent('');
      setSelectedFile(null);
      setMediaPreview('');
      setIsSubmitting(false);

    } catch (error) {
      console.error('Error al crear la publicación:', error);
      setError('Error al crear la publicación');
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      setError('Debes iniciar sesión para dar like');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        setError('La publicación no existe');
        return;
      }

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const isLiked = post.likes.includes(user.uid);
      
      // Actualizar estado local inmediatamente
      const updatedPosts = posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked 
              ? p.likes.filter(id => id !== user.uid)
              : [...p.likes, user.uid]
          };
        }
        return p;
      });
      setPosts(updatedPosts);

      // Actualizar en Firestore
        await updateDoc(postRef, {
        likes: isLiked 
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });
    } catch (error: any) {
      console.error('Error al actualizar like:', error);
      setError('Error al actualizar el like. Por favor, intenta de nuevo.');
      
      // Revertir cambios locales en caso de error
      const revertedPosts = posts.map(p => {
        if (p.id === postId) {
          const post = posts.find(originalPost => originalPost.id === postId);
          return post || p;
        }
        return p;
      });
      setPosts(revertedPosts);
    }
  };

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop
      === document.documentElement.offsetHeight
    ) {
      if (!loading && posts.length > 0) {
        handleLoadMore();
      }
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, posts.length]);

  const handleComment = async () => {
    if (!user || !selectedPost || !commentText.trim()) return;

    try {
      const postRef = doc(db, 'posts', selectedPost.id);
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      let userData = userDoc.data();

      if (!userData) {
        userData = {
          displayName: user.displayName || 'Usuario',
          photoURL: user.photoURL || '',
          email: user.email,
          createdAt: serverTimestamp()
        };
        await setDoc(userRef, userData);
      }

      const now = new Date();
      const newComment = {
        userId: user.uid,
        text: commentText.trim(),
        userDisplayName: userData.displayName || user.displayName || 'Usuario',
        userPhotoURL: userData.photoURL || user.photoURL || '',
        createdAt: now
      };

      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      // Actualizar el estado local
      const updatedPost = {
        ...selectedPost,
        comments: [...(selectedPost.comments || []), { ...newComment, createdAt: { toDate: () => now } }]
      };
      setPosts(posts.map(p => p.id === selectedPost.id ? updatedPost : p));
      setSelectedPost(updatedPost);

      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Error al agregar el comentario');
    }
  };

  const handleLoadMore = async () => {
    if (lastVisible) {
      await fetchPosts();
    }
  };

  interface ImageWithLazyLoadingProps {
    src: string;
    alt: string;
  }

  const ImageWithLazyLoading: React.FC<ImageWithLazyLoadingProps> = ({ src, alt }) => {
    const [isVisible, setIsVisible] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => {
        if (imgRef.current) {
          observer.unobserve(imgRef.current);
        }
      };
    }, []);

    return isVisible ? (
      <img 
        src={src} 
        alt={alt} 
        loading="lazy"
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          borderRadius: '8px'
        }} 
      />
    ) : (
      <div 
        ref={imgRef} 
        style={{ 
          height: '300px', 
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }} 
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <AnimatedBackground type="home" />
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <AnimatedBackground type="home" />
      <Container>
        <Typography color="error">{error}</Typography>
          <Button onClick={() => handleLoadMore()} sx={{ mt: 2 }}>
          Intentar de nuevo
        </Button>
      </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <AnimatedBackground type="home" />
      <HomeContainer>
        <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
      <Stories />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 4 }}>
                <Card sx={{ 
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white',
                }}>
        <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={user?.photoURL || ''} />
            <TextField
              fullWidth
              multiline
                        placeholder="¿Qué hay de nuevo?"
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        variant="standard"
              sx={{
                          '& .MuiInput-root': {
                  color: 'white',
                            '&:before': { borderColor: 'rgba(255,255,255,0.1)' },
                            '&:hover:not(.Mui-disabled):before': { borderColor: 'rgba(255,255,255,0.2)' }
                          }
              }}
            />
          </Box>
                    {mediaPreview && (
                      <Box sx={{ position: 'relative', mb: 2 }}>
                        {mediaType === 'image' ? (
                          <img
                            src={mediaPreview}
                            alt="Preview"
                            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                          />
                        ) : (
                          <video
                            src={mediaPreview}
                            controls
                            style={{ maxWidth: '100%', maxHeight: '300px' }}
                          />
                        )}
                <IconButton 
                          onClick={handleRemoveImage}
                  sx={{ 
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
                          }}
                        >
                          <CloseIcon sx={{ color: 'white' }} />
                </IconButton>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
              <input
                          accept="image/*,video/*"
                          id="media-upload"
                type="file"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="media-upload">
                          <IconButton component="span" sx={{ color: 'white' }}>
                            <PhotoCamera />
                </IconButton>
              </label>
                        <IconButton sx={{ color: 'white' }}>
                  <VideoCallIcon />
                </IconButton>
            </Box>
            <Button 
              variant="contained" 
                        onClick={handleSubmit}
                        disabled={!postContent && !mediaPreview}
              sx={{
                          background: 'linear-gradient(45deg, #006847 30%, #ce1126 90%)',
                color: 'white',
                '&:hover': {
                            background: 'linear-gradient(45deg, #005838 30%, #b50f21 90%)',
                }
              }}
            >
              Publicar
            </Button>
          </Box>
        </CardContent>
      </Card>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box>
      {loading && posts.length === 0 ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No hay publicaciones aún. ¡Sé el primero en publicar!
          </Typography>
        </Card>
      ) : (
        posts.map((post) => (
          <Card 
            key={post.id} 
            sx={{ 
              mb: 3,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              '& .MuiCardContent-root': {
                color: 'white'
              },
              '& .MuiTextField-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  }
                }
              }
            }}
            className="card-hover"
          >
            <CardHeader
              avatar={
                <Avatar 
                  src={post.userPhotoURL || ''} 
                  alt={post.userDisplayName || 'Usuario'}
                  sx={{ 
                    width: 48, 
                    height: 48,
                    border: '2px solid',
                    borderImage: 'linear-gradient(45deg, #006847, #ce1126) 1',
                  }}
                >
                  {(post.userDisplayName || 'U')[0]}
                </Avatar>
              }
              title={
                <Typography 
                  variant="subtitle1" 
                  className="user-text"
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                  }}
                >
                  {post.userDisplayName || 'Usuario'}
                </Typography>
              }
              subheader={
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#FFD700',
                    opacity: 0.8,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                            {formatDate(post.createdAt)}
                </Typography>
              }
            />
            <CardContent>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: post.mediaUrl ? 2 : 0 }}>
                {post.content}
              </Typography>
              {post.mediaUrl && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  position: 'relative',
                }}>
                  {post.mediaType === 'video' ? (
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                    <video
                      controls
                      style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                        width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      >
                        <source src={post.mediaUrl} type="video/mp4" />
                        Tu navegador no soporta el elemento de video.
                      </video>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'
                      }} />
                    </div>
                  ) : (
                    <ImageWithLazyLoading src={post.mediaUrl} alt="Post media" />
                  )}
                </Box>
              )}
            </CardContent>
            <CardActions sx={{ px: 2, py: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <IconButton 
                onClick={() => handleLike(post.id)}
                disabled={loading}
                sx={{ 
                  color: post.likes?.includes(user?.uid || '') ? '#ce1126' : 'inherit',
                }}
              >
                <FavoriteIcon />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {post.likes?.length || 0}
                </Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  setSelectedPost(post);
                  setCommentDialogOpen(true);
                }}
                sx={{ ml: 1 }}
              >
                <CommentIcon />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {post.comments?.length || 0}
                </Typography>
              </IconButton>
            </CardActions>
            {post.comments && post.comments.length > 0 && (
              <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="subtitle2" className="user-text" gutterBottom>
                  Comentarios recientes:
                </Typography>
                {post.comments.slice(0, 3).map((comment, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                    <Avatar 
                      src={comment.userPhotoURL || ''} 
                      alt={comment.userDisplayName || 'Usuario'}
                      sx={{ 
                        width: 32, 
                        height: 32,
                        border: '1px solid',
                        borderImage: 'linear-gradient(45deg, #006847, #ce1126) 1',
                      }}
                    >
                      {(comment.userDisplayName || 'U')[0]}
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="subtitle2" 
                        component="span" 
                        className="user-text"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {comment.userDisplayName || 'Usuario'}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 0.5,
                          color: 'rgba(255,255,255,0.9)',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        {comment.text}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        ))
      )}
              </Box>
            </Grid>
          </Grid>
        </Container>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>

      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#1a1a1a',
              color: 'white',
              backgroundImage: 'linear-gradient(rgba(0, 104, 71, 0.1), rgba(206, 17, 38, 0.1))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#FFD700',
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '1rem'
          }}>
          Comentarios
        </DialogTitle>
          <DialogContent dividers sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#ce1126',
              borderRadius: '4px',
            },
          }}>
          {selectedPost?.comments && selectedPost.comments.length > 0 ? (
            <Box sx={{ mb: 2 }}>
              {selectedPost.comments.map((comment: Comment, index: number) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: 1,
                      mb: 2,
                      p: 1,
                      borderRadius: '8px',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                      }
                    }}
                  >
                  <Avatar 
                    src={comment.userPhotoURL || ''} 
                    alt={comment.userDisplayName || 'Usuario'}
                    sx={{ 
                      width: 32, 
                      height: 32,
                        border: '2px solid',
                        borderImage: 'linear-gradient(45deg, #006847, #ce1126) 1',
                    }}
                  >
                    {(comment.userDisplayName || 'U')[0]}
                  </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 'bold',
                        color: '#FFD700',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      }}>
                      {comment.userDisplayName || 'Usuario'}
                    </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'white',
                        mt: 0.5 
                      }}>
                      {comment.text}
                    </Typography>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.6)',
                        display: 'block',
                        mt: 0.5
                      }}>
                        {comment.createdAt?.toDate ? 
                          comment.createdAt.toDate().toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                          }) : 'Hace un momento'
                        }
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
              <Typography variant="body2" sx={{ 
                py: 2, 
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                fontStyle: 'italic'
              }}>
              No hay comentarios aún. ¡Sé el primero en comentar!
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Escribe un comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#006847',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      opacity: 1,
                    },
                  },
                }}
            />
          </Box>
        </DialogContent>
          <DialogActions sx={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            px: 3,
            py: 2,
          }}>
            <Button 
              onClick={() => setCommentDialogOpen(false)}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'white',
                }
              }}
            >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleComment}
              disabled={!commentText.trim()}
            sx={{
                background: 'linear-gradient(45deg, #006847, #ce1126)',
                color: 'white',
              '&:hover': {
                  background: 'linear-gradient(45deg, #005538, #b30f21)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            Comentar
          </Button>
        </DialogActions>
      </Dialog>
      </HomeContainer>
    </Box>
  );
};

export default Home; 