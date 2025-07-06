import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Box,
  Alert,
} from '@mui/material';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'chat' | 'room';
  roomId?: string;
  roomName?: string;
}

interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
}

const InviteDialog: React.FC<InviteDialogProps> = ({
  open,
  onClose,
  type,
  roomId,
  roomName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 3) return;

      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff')
      );

      try {
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as User))
          .filter(user => user.id !== auth.currentUser?.uid);
        setUsers(usersData);
      } catch (error) {
        console.error('Error buscando usuarios:', error);
      }
    };

    searchUsers();
  }, [searchTerm]);

  const handleUserSelect = (user: User) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSendInvites = async () => {
    if (!auth.currentUser) return;

    try {
      const invitesRef = collection(db, 'invitations');
      const invitePromises = selectedUsers.map(user => {
        const inviteData = {
          type,
          fromUserId: auth.currentUser?.uid,
          fromUserName: auth.currentUser?.displayName,
          toUserId: user.id,
          message,
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        // Solo agregar roomId y roomName si es una invitación a una sala
        if (type === 'room' && roomId && roomName) {
          Object.assign(inviteData, { roomId, roomName });
        }

        return addDoc(invitesRef, inviteData);
      });

      await Promise.all(invitePromises);
      setStatus({ type: 'success', text: 'Invitaciones enviadas correctamente' });
      
      // Limpiar el formulario
      setSelectedUsers([]);
      setMessage('');
      
      // Cerrar el diálogo después de un breve momento
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error al enviar invitaciones:', error);
      setStatus({ type: 'error', text: 'Error al enviar las invitaciones' });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(18, 18, 18, 0.95)',
          color: '#fff',
        }
      }}
    >
      <DialogTitle sx={{ color: '#fff' }}>
        Invitar a {type === 'chat' ? 'chat privado' : roomName}
      </DialogTitle>
      <DialogContent>
        {status && (
          <Alert severity={status.type} sx={{ mb: 2 }}>
            {status.text}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Buscar usuarios"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)'
              },
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#fff'
            }
          }}
        />
        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff' }} gutterBottom>
              Usuarios seleccionados:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedUsers.map((user) => (
                <Chip
                  key={user.id}
                  avatar={<Avatar src={user.photoURL} />}
                  label={user.displayName}
                  onDelete={() => handleUserSelect(user)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: '#fff'
                      }
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        <TextField
          fullWidth
          label="Mensaje personalizado (opcional)"
          variant="outlined"
          multiline
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)'
              },
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#fff'
            }
          }}
        />
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {users.map((user) => (
            <ListItem
              button
              key={user.id}
              onClick={() => handleUserSelect(user)}
              selected={selectedUsers.some(u => u.id === user.id)}
              sx={{
                borderRadius: 1,
                mb: 1,
                bgcolor: selectedUsers.some(u => u.id === user.id) 
                  ? 'rgba(0, 104, 71, 0.6)'
                  : 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: selectedUsers.some(u => u.id === user.id)
                    ? 'rgba(0, 104, 71, 0.7)'
                    : 'rgba(255, 255, 255, 0.2)'
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(0, 104, 71, 0.6)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 104, 71, 0.7)'
                  }
                }
              }}
            >
              <ListItemAvatar>
                <Avatar src={user.photoURL} />
              </ListItemAvatar>
              <ListItemText
                primary={<Typography sx={{ color: '#fff' }}>{user.displayName}</Typography>}
                secondary={<Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{user.email}</Typography>}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ bgcolor: 'rgba(0, 0, 0, 0.3)', p: 2 }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#fff',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSendInvites}
          variant="contained"
          disabled={selectedUsers.length === 0}
          sx={{
            bgcolor: '#006847',
            color: '#fff',
            '&:hover': {
              bgcolor: '#005438'
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(0, 104, 71, 0.3)',
              color: 'rgba(255, 255, 255, 0.3)'
            }
          }}
        >
          Enviar invitaciones
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteDialog; 