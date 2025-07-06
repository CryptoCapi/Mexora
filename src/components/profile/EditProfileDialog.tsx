import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
} from '@mui/material';
import { User } from '../../types/user';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  userData: User;
  onSave: (updatedData: User) => void;
}

const storage = getStorage();

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onClose,
  userData,
  onSave,
}) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState(userData.displayName);
  const [bio, setBio] = useState(userData.bio);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        let photoURL = userData.photoURL;
        if (photo) {
          const storageRef = ref(storage, `profile/${user.uid}/${photo.name}`);
          await uploadBytes(storageRef, photo);
          photoURL = await getDownloadURL(storageRef);
          await updateProfile(user, { photoURL });
        }

        const updatedData = {
          ...userData,
        displayName,
        bio,
        photoURL,
        };

        await updateDoc(doc(db, 'users', user.uid), updatedData);

        // Sincronizar el apodo, foto y bio en todas las publicaciones del usuario
        const postsQuery = query(collection(db, 'posts'), where('email', '==', updatedData.email));
        const postsSnapshot = await getDocs(postsQuery);
        const batch = writeBatch(db);
        postsSnapshot.forEach((postDoc) => {
          batch.update(postDoc.ref, {
            userDisplayName: displayName,
            userPhotoURL: photoURL,
          });
        });
        await batch.commit();

        onSave(updatedData);
      onClose();
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Perfil</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={2}>
          <Box position="relative" display="flex" justifyContent="center">
            <img
              src={photo ? URL.createObjectURL(photo) : userData.photoURL || ''}
              alt="Preview"
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            <IconButton
              sx={{
                position: 'absolute',
                bottom: -10,
                right: 'calc(50% - 50px)',
                backgroundColor: '#FFD700',
                '&:hover': { backgroundColor: '#FFC300' },
              }}
              component="label"
            >
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handlePhotoChange}
              />
              <PhotoCamera sx={{ color: 'black' }} />
            </IconButton>
          </Box>
          <TextField
            label="Nombre de usuario"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Biografía"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            multiline
            rows={4}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: '#FFD700',
            color: '#000',
            '&:hover': { bgcolor: '#FFC300' },
          }}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 