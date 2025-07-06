// © 2025 Diego Fernando Mancera Gomez. Todos los derechos reservados.

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Typography,
  styled,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Modal,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDoc, doc, query, where, getDocs, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const StoriesContainer = styled(Box)({
  display: 'flex',
  overflowX: 'auto',
  gap: '20px',
  padding: '20px',
  background: 'rgba(0, 0, 0, 0.7)',
  borderRadius: '15px',
  marginBottom: '20px',
  '&::-webkit-scrollbar': {
    height: '5px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#ce1126',
    borderRadius: '10px',
  },
});

const StoryCircle = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  minWidth: '80px',
});

const StoryAvatar = styled(Avatar)({
  width: '60px',
  height: '60px',
  border: '3px solid #ce1126',
  boxShadow: '0 0 10px rgba(206, 17, 38, 0.5)',
});

const AddStoryButton = styled(IconButton)({
  background: 'rgba(0, 104, 71, 0.3)',
  '&:hover': {
    background: 'rgba(0, 104, 71, 0.5)',
  },
});

const PixelText = styled(Typography)({
  fontFamily: '"Press Start 2P", cursive',
  fontSize: '0.6rem',
  color: '#ffffff',
  marginTop: '5px',
  textAlign: 'center',
});

interface Story {
  id: string;
  userId: string;
  userDisplayName: string;
  userName: string;
  userPhotoURL: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: any;
  expiresAt: any;
  fileName: string;
}

interface UserStories {
  userId: string;
  userPhotoURL: string;
  userName: string;
  stories: Story[];
}

const StoryContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '12px',
  padding: '16px',
  overflowX: 'auto',
  '&::-webkit-scrollbar': {
    display: 'none'
  },
  scrollbarWidth: 'none'
}));

const StoryModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}));

const StoryContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  maxWidth: '100vw',
  maxHeight: '100vh',
  backgroundColor: 'black',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}));

const StoryMedia = styled('div')({
  maxWidth: '100%',
  maxHeight: '100vh',
  '& img, & video': {
    maxWidth: '100%',
    maxHeight: '100vh',
    objectFit: 'contain'
  }
});

const NavigationButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  color: 'white',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.5)'
  }
}));

const Stories = () => {
  const [user] = useAuthState(auth);
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [viewingStory, setViewingStory] = useState(false);
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const loadStories = async () => {
    try {
      setLoadingStories(true);
      const now = new Date();
      const storiesRef = collection(db, 'stories');
      const q = query(
        storiesRef,
        where('expiresAt', '>', now),
        orderBy('expiresAt'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const storiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];

      // Agrupar historias por usuario
      const groupedStories = storiesData.reduce((acc, story) => {
        const existingUser = acc.find(u => u.userId === story.userId);
        if (existingUser) {
          existingUser.stories.push(story);
        } else {
          acc.push({
            userId: story.userId,
            userPhotoURL: story.userPhotoURL,
            userName: story.userName,
            stories: [story]
          });
        }
        return acc;
      }, [] as UserStories[]);

      setUserStories(groupedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
      setError('Error al cargar las historias');
    } finally {
      setLoadingStories(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleAddStory = () => {
    if (!user) {
      setError('Debes iniciar sesión para publicar una historia');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        if (file.size > 100 * 1024 * 1024) {
          setError('El archivo es demasiado grande. El tamaño máximo es 100MB.');
          return;
        }
        setSelectedFile(file);
        setOpen(true);
        setError(null);
    } else {
        setError('Solo se permiten archivos de imagen o video');
      }
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Obtener o crear el documento del usuario
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

      // Crear nombre único para el archivo
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const fileType = selectedFile.type.startsWith('image/') ? 'images' : 'videos';
      
      // Usar la nueva estructura de ruta para stories
      const storageRef = ref(storage, `stories/${user.uid}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading story:', error);
          setError('Error al subir la historia');
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            // Crear el documento de la historia
            await addDoc(collection(db, 'stories'), {
              userId: user.uid,
              userPhotoURL: userData?.photoURL || user.photoURL || '',
              userDisplayName: userData?.displayName || user.displayName || 'Usuario',
              userName: userData?.displayName || user.displayName || 'Usuario',
              mediaUrl: downloadURL,
              mediaType: fileType === 'images' ? 'image' : 'video',
              createdAt: serverTimestamp(),
              expiresAt,
              fileName: fileName // Guardar el nombre del archivo para referencia
            });

            setOpen(false);
            setSelectedFile(null);
            setUploadProgress(0);
            setUploading(false);
            
            // Recargar las historias
            loadStories();
          } catch (error) {
            console.error('Error saving story:', error);
            setError('Error al guardar la historia');
            setUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error in story upload:', error);
      setError('Error al procesar la historia');
      setUploading(false);
    }
  };

  const handleStoryClick = (userId: string) => {
    const userStory = userStories.find(u => u.userId === userId);
    if (userStory) {
      setSelectedUser(userId);
      setCurrentStoryIndex(0);
      setModalOpen(true);
    }
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
    setViewingStory(false);
  };

  const handleStoryClickModal = (userId: string) => {
    setSelectedUser(userId);
    setCurrentStoryIndex(0);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setCurrentStoryIndex(0);
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleNextStory = () => {
    const userStory = userStories.find(u => u.userId === selectedUser);
    if (userStory && currentStoryIndex < userStory.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      setModalOpen(false);
    }
  };

  const getCurrentStory = () => {
    const userStory = userStories.find(u => u.userId === selectedUser);
    return userStory ? userStory.stories[currentStoryIndex] : null;
  };

  return (
    <>
      <StoriesContainer>
              <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
                accept="image/*,video/*"
          onChange={handleFileChange}
        />
        
        <StoryCircle onClick={handleAddStory}>
          <AddStoryButton>
            <AddIcon sx={{ color: '#ffffff' }} />
          </AddStoryButton>
          <PixelText>NUEVA HISTORIA</PixelText>
        </StoryCircle>

        {userStories.map((userStory) => (
          <StoryCircle key={userStory.userId} onClick={() => handleStoryClickModal(userStory.userId)}>
                  <Avatar
              src={userStory.userPhotoURL}
              alt={userStory.userName}
                    sx={{
                width: 60,
                height: 60,
                border: '3px solid #ce1126',
                boxShadow: '0 0 10px rgba(206,17,38,0.5)',
              }}
            />
            <PixelText>
              {userStory.userName}
            </PixelText>
          </StoryCircle>
        ))}
      </StoriesContainer>

      {/* Diálogo para subir historia */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          {selectedFile && (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              {selectedFile.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: '500px' }} 
                    />
                  ) : (
                <video 
                  src={URL.createObjectURL(selectedFile)} 
                  controls 
                  style={{ maxWidth: '100%', maxHeight: '500px' }} 
                    />
                  )}
                </Box>
          )}
          {uploading && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <CircularProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Subiendo... {Math.round(uploadProgress)}%
              </Typography>
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleUpload} 
            disabled={uploading || !selectedFile}
            variant="contained"
          >
            Publicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para ver historia */}
      <Dialog
        open={viewingStory}
        onClose={handleCloseStory}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'black',
            color: 'white',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', height: '80vh' }}>
            <IconButton
            onClick={handleCloseStory}
              sx={{
                position: 'absolute',
              right: 8,
              top: 8,
                color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
                zIndex: 1,
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.7)',
              }
              }}
            >
              <CloseIcon />
            </IconButton>
          {selectedStory && (
            <Box sx={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex',
              justifyContent: 'center', 
              alignItems: 'center',
              overflow: 'hidden'
            }}>
              {selectedStory.mediaType === 'image' ? (
                <img
                  src={selectedStory.mediaUrl}
                  alt="Story"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <video
                  src={selectedStory.mediaUrl}
                  controls
                  autoPlay
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <StoryModal
        open={modalOpen}
        onClose={handleCloseModal}
      >
        <StoryContent>
          <IconButton
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white'
            }}
            onClick={handleCloseModal}
          >
            <CloseIcon />
          </IconButton>

          <NavigationButton
            sx={{ left: 16 }}
            onClick={handlePrevStory}
          >
            <ChevronLeft />
          </NavigationButton>

          <StoryMedia>
            {getCurrentStory()?.mediaType === 'video' ? (
              <video
                src={getCurrentStory()?.mediaUrl}
                autoPlay
                controls
                onEnded={handleNextStory}
              />
            ) : (
              <img src={getCurrentStory()?.mediaUrl} alt="Story" />
            )}
          </StoryMedia>

          <NavigationButton
            sx={{ right: 16 }}
            onClick={handleNextStory}
          >
            <ChevronRight />
          </NavigationButton>
        </StoryContent>
      </StoryModal>
    </>
  );
};

export default Stories; 