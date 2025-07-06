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
  Checkbox,
  Avatar,
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types/chat';

interface CreateChatDialogProps {
  open: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void; // Pass the created chat ID
  currentUser: User;
}

const CreateChatDialog: React.FC<CreateChatDialogProps> = ({
  open,
  onClose,
  onChatCreated,
  currentUser,
}) => {
  const [tabValue, setTabValue] = useState(0); // 0 for individual, 1 for group
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Load users when the dialog opens
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    // Only attempt to load users if currentUser and their UID are available
    if (!currentUser || !currentUser.uid) {
      console.log("No se puede cargar usuarios: currentUser o UID no disponible.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Cargando usuarios para nuevo chat/grupo. UID actual:", currentUser.uid);
      const usersRef = collection(db, 'users');
      // Get all users and filter out the current user
      const querySnapshot = await getDocs(usersRef);
      console.log("Número de documentos recibidos en querySnapshot:", querySnapshot.size);
      
      const users = querySnapshot.docs
        .filter(doc => doc.id !== currentUser.uid) // Filter out current user using document ID
        .map(doc => ({
          uid: doc.id, // Use document ID as uid
          displayName: doc.data().displayName || 'Usuario sin nombre',
          photoURL: doc.data().photoURL || '',
          email: doc.data().email || '',
          bio: doc.data().bio || '',
          level: doc.data().level || 1,
          points: doc.data().points || 0,
          createdAt: doc.data().createdAt || new Date(),
          socialStats: doc.data().socialStats || { followers: 0, following: 0, posts: 0 },
          achievements: doc.data().achievements || [],
          badges: doc.data().badges || []
        }));
      console.log("Usuarios cargados para nuevo chat/grupo (lista final):", users); // Log final list
      setUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error al cargar usuarios. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedUsers([]);
    setGroupName('');
    setSearchTerm(''); // Clear search term on tab change
  };

  const handleUserSelect = (userId: string) => {
    if (tabValue === 0) {
      // Individual chat: select only one user
      setSelectedUsers([userId]);
    } else {
      // Group chat: toggle user selection
      setSelectedUsers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  };

  const handleCreateChat = async () => {
    if (loading) return; // Prevent multiple clicks

    try {
      setLoading(true);
      let newChatRef;

      if (tabValue === 0) {
        // Create individual chat
        if (selectedUsers.length !== 1) return; // Ensure one user is selected

        const chatData = {
          participants: [currentUser.uid, selectedUsers[0]],
          isGroup: false,
          createdAt: new Date(),
          createdBy: currentUser.uid,
          lastMessage: null,
          lastMessageTime: new Date(),
          // Initialize unread count for both participants
          unreadCount: { [currentUser.uid]: 0, [selectedUsers[0]]: 0 },
        };

        newChatRef = await addDoc(collection(db, 'chats'), chatData);

      } else {
        // Create group chat
        if (selectedUsers.length < 1 || !groupName) return; // Ensure at least one user and group name

        const chatData = {
          participants: [currentUser.uid, ...selectedUsers],
          isGroup: true,
          groupName,
          createdAt: new Date(),
          createdBy: currentUser.uid,
          lastMessage: null,
          lastMessageTime: new Date(),
          roles: { [currentUser.uid]: 'admin' }, // Creator is admin
          // Initialize unread count for all participants
          unreadCount: { [currentUser.uid]: 0, ...selectedUsers.reduce((acc, userId) => ({ ...acc, [userId]: 0 }), {}) },
        };

        newChatRef = await addDoc(collection(db, 'chats'), chatData);
      }

      // Call onChatCreated with the ID of the newly created chat
      if (newChatRef) {
        console.log("Chat creado exitosamente con ID:", newChatRef.id);
        onChatCreated(newChatRef.id);
        // Reset form state
        setSelectedUsers([]);
        setGroupName('');
        setSearchTerm('');
        setTabValue(0);
      }

      onClose(); // Close dialog on success
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Error al crear el chat. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return user.displayName?.toLowerCase().includes(lowerSearchTerm) ||
           user.email?.toLowerCase().includes(lowerSearchTerm);
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{tabValue === 0 ? 'Nuevo Chat Individual' : 'Nuevo Grupo'}</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Chat Individual" />
          <Tab label="Grupo" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {tabValue === 1 && (
          <TextField
            fullWidth
            label="Nombre del grupo"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
        )}

        <TextField
          fullWidth
          label="Buscar usuarios"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : filteredUsers.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography color="textSecondary">
              {searchTerm ? 'No se encontraron usuarios' : 'Cargando usuarios...'} {/* Improved message */}
            </Typography>
          </Box>
        ) : (
          <List dense>
            {filteredUsers.map((user) => (
              <ListItem
                key={user.uid}
                button
                onClick={() => handleUserSelect(user.uid)}
              >
                <ListItemAvatar>
                  <Avatar src={user.photoURL} />
                </ListItemAvatar>
                <ListItemText
                  primary={user.displayName}
                  secondary={user.email}
                />
                <Checkbox
                  edge="end"
                  checked={selectedUsers.includes(user.uid)}
                  tabIndex={-1}
                  disableRipple
                  sx={{ mr: -1.25 }} // Adjust spacing
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleCreateChat}
          variant="contained"
          disabled={
            loading ||
            (tabValue === 0 && selectedUsers.length !== 1) ||
            (tabValue === 1 && (selectedUsers.length < (groupName ? 1 : 2) || !groupName)) // Require at least 1 selected user for group, 2 if no name yet
          }
        >
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateChatDialog; 