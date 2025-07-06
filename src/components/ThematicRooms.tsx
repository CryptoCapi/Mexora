import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  IconButton,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  Popper,
  ClickAwayListener,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  InsertChart as ChartIcon,
  Speed as SignalIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import InviteDialog from './InviteDialog';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string;
  timestamp: any;
  imageUrl?: string;
  chartUrl?: string;
  signal?: string;
  mentions?: string[];
}

interface Room {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface User {
  id: string;
  displayName: string;
  photoURL: string;
  email: string;
}

const rooms: Room[] = [
  {
    id: 'trading',
    name: 'Sala de Trading',
    description: 'Discute estrategias, análisis y señales de trading',
    icon: '📈'
  },
  {
    id: 'gaming',
    name: 'Sala de Gaming',
    description: 'Comparte experiencias y organiza sesiones de juego',
    icon: '🎮'
  },
  {
    id: 'tech',
    name: 'Sala de Tech',
    description: 'Explora las últimas novedades en tecnología',
    icon: '💻'
  }
];

const ThematicRooms = () => {
  const [selectedRoom, setSelectedRoom] = useState<Room>(rooms[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionAnchorEl, setMentionAnchorEl] = useState<null | HTMLElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersData);
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      const q = query(
        collection(db, `rooms/${selectedRoom.id}/messages`),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        setMessages(newMessages);
      });

      return () => unsubscribe();
    }
  }, [selectedRoom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Detectar menciones
    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);
    
    const lastAtSymbol = value.lastIndexOf('@', cursorPos);
    if (lastAtSymbol !== -1) {
      const searchText = value.slice(lastAtSymbol + 1, cursorPos).toLowerCase();
      setMentionSearch(searchText);
      setShowMentions(true);
      setMentionAnchorEl(e.target);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionClick = (user: User) => {
    const beforeMention = newMessage.slice(0, newMessage.lastIndexOf('@'));
    const afterMention = newMessage.slice(cursorPosition);
    setNewMessage(`${beforeMention}@${user.displayName} ${afterMention}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !auth.currentUser) return;

    // Extraer menciones del mensaje
    const mentionRegex = /@(\w+)/g;
    const mentions = newMessage.match(mentionRegex)?.map(mention => mention.slice(1)) || [];

    const messageData = {
      text: newMessage,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Usuario Anónimo',
      userPhoto: auth.currentUser.photoURL || '/default-avatar.png',
      timestamp: serverTimestamp(),
      mentions
    };

    try {
      await addDoc(collection(db, `rooms/${selectedRoom.id}/messages`), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const handleQuickSignal = async (signal: string) => {
    if (!auth.currentUser) return;

    const messageData = {
      text: `🚨 SEÑAL: ${signal}`,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Usuario Anónimo',
      userPhoto: auth.currentUser.photoURL || '/default-avatar.png',
      timestamp: serverTimestamp(),
      signal: signal
    };

    try {
      await addDoc(collection(db, `rooms/${selectedRoom.id}/messages`), messageData);
    } catch (error) {
      console.error('Error al enviar señal:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
      {/* Lista de Salas */}
      <Paper sx={{ 
        width: 240, 
        overflow: 'auto', 
        borderRight: 1, 
        borderColor: 'divider',
        bgcolor: 'rgba(0, 0, 0, 0.8)', // Fondo oscuro para el panel de salas
      }}>
        <List>
          {rooms.map((room) => (
            <ListItem
              button
              key={room.id}
              selected={selectedRoom.id === room.id}
              onClick={() => setSelectedRoom(room)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(0, 104, 71, 0.6)', // Color verde de Mexora cuando está seleccionado
                  '&:hover': {
                    bgcolor: 'rgba(0, 104, 71, 0.7)',
                  },
                },
                mb: 1,
                borderRadius: 1,
              }}
            >
              <ListItemAvatar>
                <Avatar>{room.icon}</Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary={<Typography sx={{ color: '#fff' }}>{room.name}</Typography>}
                secondary={<Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{room.description}</Typography>}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Área de Chat */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#121212' }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.8)',
        }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>
            {selectedRoom.icon} {selectedRoom.name}
          </Typography>
          <IconButton onClick={() => setInviteDialogOpen(true)} sx={{ color: '#fff' }} title="Invitar usuarios">
            <PersonAddIcon />
          </IconButton>
        </Box>

        {/* Mensajes */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.map((message) => (
            <Box key={message.id} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                <Avatar src={message.userPhoto} />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                    {message.userName}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 1, color: 'rgba(255, 255, 255, 0.6)' }}
                    >
                      {message.timestamp?.toDate().toLocaleString()}
                    </Typography>
                  </Typography>
                  <Paper
                    sx={{
                      p: 1,
                      bgcolor: message.signal ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      maxWidth: '600px',
                      color: '#fff',
                      borderRadius: 2,
                    }}
                  >
                    <Typography sx={{ color: '#fff' }}>
                      {message.text.split(' ').map((word, index) => (
                        word.startsWith('@') ? (
                          <span key={index} style={{ color: '#1976d2', fontWeight: 'bold' }}>
                            {word}{' '}
                          </span>
                        ) : (
                          word + ' '
                        )
                      ))}
                    </Typography>
                    {message.chartUrl && (
                      <Box component="img" src={message.chartUrl} sx={{ maxWidth: '100%', mt: 1 }} />
                    )}
                  </Paper>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Área de Input */}
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'rgba(0, 0, 0, 0.8)',
        }}>
          {selectedRoom.id === 'trading' && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleQuickSignal('COMPRA')}
                sx={{ 
                  mr: 1,
                  bgcolor: 'success.main',
                  '&:hover': {
                    bgcolor: 'success.dark',
                  }
                }}
              >
                Señal de Compra
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleQuickSignal('VENTA')}
                sx={{ 
                  mr: 1,
                  bgcolor: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.dark',
                  }
                }}
              >
                Señal de Venta
              </Button>
              <IconButton sx={{ color: '#fff' }}>
                <ChartIcon />
              </IconButton>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1, position: 'relative' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Escribe un mensaje... (@usuario para mencionar)"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              inputRef={inputRef}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                  },
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                },
              }}
            />
            <IconButton sx={{ color: '#fff' }}>
              <AttachFileIcon />
            </IconButton>
            <IconButton color="primary" onClick={handleSendMessage}>
              <SendIcon />
            </IconButton>

            {/* Menú de menciones */}
            <Popper
              open={showMentions && filteredUsers.length > 0}
              anchorEl={mentionAnchorEl}
              placement="top-start"
            >
              <ClickAwayListener onClickAway={() => setShowMentions(false)}>
                <Paper sx={{ p: 1, maxHeight: 200, overflow: 'auto' }}>
                  <List dense>
                    {filteredUsers.map((user) => (
                      <ListItem
                        button
                        key={user.id}
                        onClick={() => handleMentionClick(user)}
                      >
                        <ListItemAvatar>
                          <Avatar src={user.photoURL} alt={user.displayName} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.displayName}
                          secondary={user.email}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </ClickAwayListener>
            </Popper>
          </Box>
        </Box>
      </Box>

      {/* Diálogo de invitaciones */}
      <InviteDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        type="room"
        roomId={selectedRoom.id}
        roomName={selectedRoom.name}
      />
    </Box>
  );
};

export default ThematicRooms; 