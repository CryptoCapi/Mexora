import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Popover,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  PhotoCamera as PhotoCameraIcon,
  Videocam as VideocamIcon,
  Add as AddIcon,
  EmojiEmotions as EmojiIcon,
  ThumbUp as LikeIcon,
  Favorite as LoveIcon,
  SentimentSatisfied as HappyIcon,
  SentimentVerySatisfied as LaughIcon,
  SentimentDissatisfied as SadIcon,
  SentimentVeryDissatisfied as AngryIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  Fullscreen as FullscreenIcon,
  FavoriteBorder,
  ChatBubbleOutline,
  Send,
  ContentCopy as ContentCopyIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { auth } from '../firebase';
import { getFirestore, collection, query, orderBy, getDocs, addDoc, Timestamp, doc, getDoc, updateDoc, startAfter, limit, arrayUnion, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import GamificationService from '../services/gamificationService';
import Stories from '../components/Stories';
import bitcoinLogo from '../assets/bitcoin-logo.png';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import { Comment } from '../types';
import { useNavigate } from 'react-router-dom';

const firestore = getFirestore();
const storage = getStorage();

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(30, 30, 30, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3)
}));

const StyledInput = styled('input')({
  display: 'none',
});

const REACTION_EMOJIS = [
  { type: 'love', label: 'Me encanta', icon: <span style={{fontSize: 22}}>❤️</span> },
  { type: 'like', label: 'Like', icon: <span style={{fontSize: 22}}>👍</span> },
  { type: 'haha', label: 'Me divierte', icon: <span style={{fontSize: 22}}>😂</span> },
  { type: 'wow', label: 'Me asombra', icon: <span style={{fontSize: 22}}>😮</span> },
  { type: 'sad', label: 'Me entristece', icon: <span style={{fontSize: 22}}>😢</span> },
  { type: 'angry', label: 'Me enoja', icon: <span style={{fontSize: 22}}>😠</span> },
];

interface Reaction {
  userId: string;
  type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: number;
  comments: Comment[];
  reactions: Reaction[];
  createdAt: Timestamp;
}

interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  createdAt: Timestamp;
}

const StoryContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  overflowX: 'auto',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  '&::-webkit-scrollbar': {
    display: 'none',
  },
}));

const StoryItem = styled(Paper)(({ theme }) => ({
  position: 'relative',
  minWidth: 100,
  height: 150,
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  cursor: 'pointer',
  background: 'rgba(30, 30, 30, 0.95)',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const StoryAvatar = styled(Avatar)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  left: theme.spacing(1),
  border: '3px solid #FFD700',
}));

const AddStoryButton = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 100,
  height: 150,
  borderRadius: theme.spacing(2),
  background: 'rgba(30, 30, 30, 0.95)',
  cursor: 'pointer',
  '&:hover': {
    background: 'rgba(40, 40, 40, 0.95)',
  },
}));

const ReactionButton = styled(IconButton)(({ theme }) => ({
  position: 'relative',
  '&:hover .reaction-options': {
    display: 'flex',
  },
}));

const ReactionOptions = styled(Box)(({ theme }) => ({
  display: 'none',
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(30, 30, 30, 0.95)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1),
  gap: theme.spacing(1),
  '&:hover': {
    display: 'flex',
  },
}));

const ReactionIcon = styled(IconButton)(({ theme }) => ({
  '&:hover': {
    transform: 'scale(1.2)',
  },
}));

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxHeight: 400,
  overflow: 'hidden',
  borderRadius: theme.spacing(1),
  '&:hover .video-controls': {
    opacity: 1,
  },
}));

const VideoControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  padding: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  opacity: 0,
  transition: 'opacity 0.3s',
}));

const VideoProgress = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '100%',
  left: 0,
  right: 0,
  height: 4,
  background: 'rgba(255,255,255,0.3)',
}));

const VideoProgressBar = styled(Box)(({ theme }) => ({
  height: '100%',
  background: theme.palette.primary.main,
}));

const PostCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
}));

const PostHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
});

const PostContent = styled(Box)({
  padding: '0 16px 16px',
});

const PostActions = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 16px',
  borderTop: '1px solid #eee',
});

const ActionButton = styled(Button)({
  textTransform: 'none',
  color: '#666',
  '&:hover': {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});

const LikeCount = styled(Typography)({
  fontSize: '0.875rem',
  color: '#666',
  marginLeft: '4px',
});

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | null>(null);
  const [showComments, setShowComments] = useState<{[key: string]: boolean}>({});
  const [newComments, setNewComments] = useState<{[key: string]: string}>({});
  const [stories, setStories] = useState<Story[]>([]);
  const [showStoryDialog, setShowStoryDialog] = useState(false);
  const [selectedStoryFile, setSelectedStoryFile] = useState<File | null>(null);
  const [lastPost, setLastPost] = useState<Timestamp | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [videoStates, setVideoStates] = useState<{
    [key: string]: {
      playing: boolean;
      muted: boolean;
      currentTime: number;
      duration: number;
    };
  }>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [reactionMenuPostId, setReactionMenuPostId] = useState<string | null>(null);
  const [reactionAnchorEl, setReactionAnchorEl] = useState<null | HTMLElement>(null);
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const postsQuery = query(
          collection(firestore, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
          const updatedPosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];
          setPosts(updatedPosts);
          setLoading(false);
        }, (error) => {
          console.error('Error en el listener de posts:', error);
          setLoading(false);
        });

        await loadStories();

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const loadStories = async () => {
    try {
      const storiesQuery = query(
        collection(firestore, 'stories'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(storiesQuery);
      const loadedStories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];
      setStories(loadedStories);
    } catch (error) {
      console.error('Error al cargar historias:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadType(type);
    }
  };

  const reloadPosts = async () => {
    try {
      const postsQuery = query(
        collection(firestore, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(postsQuery);
      const loadedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(loadedPosts);
    } catch (error) {
      console.error('Error al recargar posts:', error);
    }
  };

  const handlePost = async () => {
    if (!auth.currentUser) return;
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
            await addDoc(collection(firestore, 'posts'), {
              userId: auth.currentUser!.uid,
              userName: auth.currentUser!.displayName || 'Usuario Anónimo',
              userAvatar: auth.currentUser!.photoURL || '',
              content: newPost,
              mediaUrl,
              mediaType: uploadType,
              likes: 0,
              comments: [],
              reactions: [],
              createdAt: Timestamp.now()
            });
            await GamificationService.getInstance().awardSocialPoints(auth.currentUser!.uid, 'post');
            setNewPost('');
            setSelectedFile(null);
            setUploadType(null);
            setUploading(false);
            setUploadProgress(0);
            await reloadPosts();
          }
        );
        return;
      }
      // Si no hay archivo, solo texto
      await addDoc(collection(firestore, 'posts'), {
        userId: auth.currentUser!.uid,
        userName: auth.currentUser!.displayName || 'Usuario Anónimo',
        userAvatar: auth.currentUser!.photoURL || '',
        content: newPost,
        mediaUrl: '',
        mediaType: null,
        likes: 0,
        comments: [],
        reactions: [],
        createdAt: Timestamp.now()
      });
      await GamificationService.getInstance().awardSocialPoints(auth.currentUser!.uid, 'post');
      setNewPost('');
      setSelectedFile(null);
      setUploadType(null);
      setUploading(false);
      setUploadProgress(0);
      await reloadPosts();
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      console.error('Error creating post:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!auth.currentUser) return;

    try {
      const postRef = doc(firestore, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const post = postSnap.data();
        const likes = post.likes || 0;
        
        await updateDoc(postRef, {
          likes: likes + 1
        });

        // Otorgar puntos por dar like
        await GamificationService.getInstance().awardSocialPoints(auth.currentUser.uid, 'like');
      }
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  const handleCommentSubmit = async (postId: string, commentContent: string) => {
    if (!auth.currentUser || !commentContent.trim()) return;

    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Usuario',
        userAvatar: auth.currentUser.photoURL || '',
        content: commentContent.trim(),
        createdAt: Timestamp.now()
      };

      // Limpiar el campo de comentario inmediatamente
      setNewComments(prev => ({
        ...prev,
        [postId]: ''
      }));

      // Actualizar en Firestore
      const postRef = doc(firestore, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      // Otorgar puntos por comentar
      await GamificationService.getInstance().awardSocialPoints(auth.currentUser.uid, 'comment');
    } catch (error) {
      console.error('Error al comentar:', error);
    }
  };

  const handleStoryUpload = async () => {
    if (!auth.currentUser || !selectedStoryFile) return;

    try {
      const storageRef = ref(storage, `stories/${selectedStoryFile.name}`);
      await uploadBytes(storageRef, selectedStoryFile);
      const mediaUrl = await getDownloadURL(storageRef);

      await addDoc(collection(firestore, 'stories'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Usuario Anónimo',
        userAvatar: auth.currentUser.photoURL || '',
        mediaUrl,
        createdAt: Timestamp.now()
      });

      setSelectedStoryFile(null);
      setShowStoryDialog(false);
      loadStories();
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  const handleReaction = async (postId: string, type: Reaction['type']) => {
    if (!auth.currentUser) return;

    try {
      const postRef = doc(firestore, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) return;

      const currentReactions = postDoc.data().reactions || [];
      const userReactionIndex = currentReactions.findIndex((r: Reaction) => r.userId === auth.currentUser?.uid);
      const newReactions = [...currentReactions];

      if (userReactionIndex >= 0) {
        if (newReactions[userReactionIndex].type === type) {
          newReactions.splice(userReactionIndex, 1);
        } else {
          newReactions[userReactionIndex] = { userId: auth.currentUser.uid, type };
        }
      } else {
        newReactions.push({ userId: auth.currentUser.uid, type });
      }

      await updateDoc(postRef, { reactions: newReactions });
    } catch (error) {
      console.error('Error al reaccionar:', error);
    }
  };

  const getReactionCount = (post: Post, type: Reaction['type']) => {
    return post.reactions?.filter(r => r.type === type).length || 0;
  };

  const getUserReaction = (post: Post) => {
    return post.reactions?.find(r => r.userId === auth.currentUser?.uid)?.type;
  };

  const handleVideoPlay = (postId: string, video: HTMLVideoElement) => {
    if (video.paused) {
      video.play();
      setVideoStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], playing: true }
      }));
    } else {
      video.pause();
      setVideoStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], playing: false }
      }));
    }
  };

  const handleVideoMute = (postId: string, video: HTMLVideoElement) => {
    video.muted = !video.muted;
    setVideoStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], muted: video.muted }
    }));
  };

  const handleVideoTimeUpdate = (postId: string, video: HTMLVideoElement) => {
    setVideoStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        currentTime: video.currentTime,
        duration: video.duration
      }
    }));
  };

  const handleVideoProgressClick = (postId: string, video: HTMLVideoElement, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    video.currentTime = percentage * video.duration;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const loadMorePosts = async () => {
    if (!hasMorePosts || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const postsQuery = query(
        collection(firestore, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastPost),
        limit(10)
      );
      const snapshot = await getDocs(postsQuery);
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      if (newPosts.length > 0) {
        setLastPost(newPosts[newPosts.length - 1].createdAt);
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100
    ) {
      loadMorePosts();
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastPost, hasMorePosts, isLoadingMore]);

  const handleOpenReactions = (event: React.MouseEvent<HTMLElement>, postId: string) => {
    setReactionMenuPostId(postId);
    setReactionAnchorEl(event.currentTarget);
  };

  const handleCloseReactions = () => {
    setReactionMenuPostId(null);
    setReactionAnchorEl(null);
  };

  const handleShare = (event: React.MouseEvent<HTMLElement>, postId: string) => {
    setShareAnchorEl(event.currentTarget);
    setSharePostId(postId);
  };

  const handleCloseShare = () => {
    setShareAnchorEl(null);
    setSharePostId(null);
  };

  const getPostUrl = (postId: string) => {
    return `${window.location.origin}/post/${postId}`;
  };

  const copyToClipboard = async (postId: string) => {
    try {
      const url = getPostUrl(postId);
      await navigator.clipboard.writeText(url);
      setSnackbarMessage('¡Enlace copiado al portapapeles!');
      setSnackbarOpen(true);
      handleCloseShare();
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      setSnackbarMessage('Error al copiar el enlace');
      setSnackbarOpen(true);
    }
  };

  const shareOnMobile = async (postId: string) => {
    const url = getPostUrl(postId);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Compartir publicación de Mexora',
          text: '¡Mira esta publicación en Mexora!',
          url: url
        });
        handleCloseShare();
      } catch (error) {
        console.error('Error al compartir:', error);
      }
    }
  };

  const shareOnSocialMedia = (platform: string, postId: string) => {
    const url = getPostUrl(postId);
    const text = encodeURIComponent('¡Mira esta publicación en Mexora!');
    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
        break;
    }

    window.open(shareUrl, '_blank');
    handleCloseShare();
  };

  const renderPost = (post: Post) => {
    const userReaction = getUserReaction(post);
    const showReactions = reactionMenuPostId === post.id;

    return (
      <PostCard key={post.id}>
        <PostHeader>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={() => navigate(`/profile/${post.userId}`)}
          >
            <Avatar src={post.userAvatar} />
            <Box ml={2}>
              <Typography variant="subtitle2" fontWeight="bold">
                {post.userName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {post.createdAt?.toDate().toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </PostHeader>
        <PostContent>
          <Typography variant="body1" paragraph>
            {post.content}
          </Typography>
          {post.mediaUrl && (
            post.mediaType === 'video' ? (
              <Box position="relative" width="100%" height="400px">
                <video
                  src={post.mediaUrl}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ) : (
              <img
                src={post.mediaUrl}
                alt="Post media"
                style={{ width: '100%', borderRadius: '8px' }}
              />
            )
          )}
        </PostContent>
        <PostActions>
          <Box display="flex" alignItems="center" position="relative">
            <ReactionButton
              onClick={(e) => handleOpenReactions(e, post.id)}
              color={userReaction ? 'primary' : 'default'}
            >
              {userReaction
                ? REACTION_EMOJIS.find(e => e.type === userReaction)?.icon
                : <EmojiIcon />}
              <Typography variant="body2" sx={{ ml: 1 }}>
                Reaccionar
              </Typography>
            </ReactionButton>
            <Popover
              open={showReactions}
              anchorEl={reactionAnchorEl}
              onClose={handleCloseReactions}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              disableRestoreFocus
            >
              <Box display="flex" p={1} gap={1}>
                {REACTION_EMOJIS.map((emoji) => (
                  <ReactionIcon
                    key={emoji.type}
                    onClick={() => {
                      handleReaction(post.id, emoji.type as Reaction['type']);
                      handleCloseReactions();
                    }}
                    title={emoji.label}
                    sx={{
                      background: userReaction === emoji.type ? '#f7931a' : 'transparent',
                      color: userReaction === emoji.type ? '#fff' : 'inherit',
                    }}
                  >
                    {emoji.icon}
                  </ReactionIcon>
                ))}
              </Box>
            </Popover>
            <Box display="flex" alignItems="center" ml={2}>
              {REACTION_EMOJIS.map((emoji) => {
                const count = getReactionCount(post, emoji.type as Reaction['type']);
                return count > 0 ? (
                  <Box key={emoji.type} display="flex" alignItems="center" mr={1}>
                    {emoji.icon}
                    <Typography variant="body2" sx={{ ml: 0.5 }}>{count}</Typography>
                  </Box>
                ) : null;
              })}
            </Box>
          </Box>
          <Box display="flex" alignItems="center">
            <ActionButton 
              startIcon={<CommentIcon />}
              onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
            >
              Comentar
            </ActionButton>
          </Box>
          <ActionButton 
            startIcon={<ShareIcon />}
            onClick={(e) => handleShare(e, post.id)}
          >
            Compartir
          </ActionButton>
        </PostActions>

        {/* Sección de comentarios */}
        {showComments[post.id] && (
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Box sx={{ mb: 2 }}>
              {post.comments?.map((comment, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                    onClick={() => navigate(`/profile/${comment.userId}`)}
                  >
                    <Avatar 
                      src={comment.userAvatar} 
                      alt={comment.userName}
                      sx={{ 
                        width: 32, 
                        height: 32,
                        border: '1px solid',
                        borderImage: 'linear-gradient(45deg, #006847, #ce1126) 1',
                      }}
                    >
                      {comment.userName[0]}
                    </Avatar>
                    <Box ml={1}>
                      <Typography 
                        variant="subtitle2" 
                        component="span" 
                        sx={{ fontWeight: 'bold', color: '#FFD700' }}
                      >
                        {comment.userName}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 0.5,
                          color: 'rgba(255,255,255,0.9)',
                        }}
                      >
                        {comment.content}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Escribe un comentario..."
                value={newComments[post.id] || ''}
                onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
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
                }}
              />
              <Button
                variant="contained"
                onClick={() => handleCommentSubmit(post.id, newComments[post.id] || '')}
                disabled={!newComments[post.id]?.trim()}
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
                <Send />
              </Button>
            </Box>
          </Box>
        )}
      </PostCard>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 10 }}>
      <Stories />
      <Box py={4}>
        <StyledCard>
          <CardContent>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
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
                <Box sx={{
                  width: 64,
                  height: 64,
                  mb: 1,
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}>
                  <img src={bitcoinLogo} alt="Bitcoin" style={{ width: '100%', height: '100%' }} />
                </Box>
                <Box sx={{ width: '100%', maxWidth: 300 }}>
                  <Box sx={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden', mb: 1 }}>
                    <Box sx={{ width: `${uploadProgress}%`, height: '100%', background: '#f7931a', transition: 'width 0.2s' }} />
                  </Box>
                  <Typography variant="body2" align="center" color="textSecondary">
                    {Math.round(uploadProgress)}%
                  </Typography>
                </Box>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <label htmlFor="image-upload">
                  <StyledInput
                    accept="image/*"
                    id="image-upload"
                    type="file"
                    onChange={(e) => handleFileSelect(e, 'image')}
                  />
                  <IconButton color="primary" component="span">
                    <PhotoCameraIcon />
                  </IconButton>
                </label>
                <label htmlFor="video-upload">
                  <StyledInput
                    accept="video/*"
                    id="video-upload"
                    type="file"
                    onChange={(e) => handleFileSelect(e, 'video')}
                  />
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
          </CardContent>
        </StyledCard>
        {posts.map((post) => renderPost(post))}
      </Box>

      {/* Menú de compartir */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={handleCloseShare}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {typeof navigator.share === 'function' && (
          <MenuItem onClick={() => sharePostId && shareOnMobile(sharePostId)}>
            <ShareIcon sx={{ mr: 1 }} /> Compartir
          </MenuItem>
        )}
        <MenuItem onClick={() => sharePostId && copyToClipboard(sharePostId)}>
          <ContentCopyIcon sx={{ mr: 1 }} /> Copiar enlace
        </MenuItem>
        <MenuItem onClick={() => sharePostId && shareOnSocialMedia('whatsapp', sharePostId)}>
          <WhatsAppIcon sx={{ mr: 1 }} /> WhatsApp
        </MenuItem>
        <MenuItem onClick={() => sharePostId && shareOnSocialMedia('facebook', sharePostId)}>
          <FacebookIcon sx={{ mr: 1 }} /> Facebook
        </MenuItem>
        <MenuItem onClick={() => sharePostId && shareOnSocialMedia('twitter', sharePostId)}>
          <TwitterIcon sx={{ mr: 1 }} /> Twitter
        </MenuItem>
      </Menu>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Home; 