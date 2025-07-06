import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { auth } from '../firebase';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firestore = getFirestore();
const storage = getStorage();

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'rgba(18, 18, 18, 0.95)',
  color: '#fff',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  height: 'calc(100vh - 200px)',
  display: 'flex',
  flexDirection: 'column',
}));

const MessageList = styled(Box)({
  flexGrow: 1,
  overflow: 'auto',
  padding: '16px',
});

const MessageInput = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}));

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: any;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
}

interface Room {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdBy: string;
  createdAt: any;
  lastMessage?: {
    text: string;
    timestamp: any;
  };
}

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', image: null as File | null });
  const [attachment, setAttachment] = useState<File | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      const unsubscribe = subscribeToMessages();
      return () => unsubscribe();
    }
  }, [selectedRoom]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const loadRooms = async () => {
    try {
      const roomsQuery = query(collection(firestore, 'rooms'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(roomsQuery);
      const loadedRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
      setRooms(loadedRooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedRoom) return () => {};

    const messagesQuery = query(
      collection(firestore, 'rooms', selectedRoom.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(newMessages);
    });
  };

  const handleCreateRoom = async () => {
    if (!auth.currentUser || !newRoom.name.trim()) return;

    try {
      let imageUrl = '';
      if (newRoom.image) {
        const storageRef = ref(storage, `rooms/${Date.now()}_${newRoom.image.name}`);
        await uploadBytes(storageRef, newRoom.image);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(firestore, 'rooms'), {
        name: newRoom.name.trim(),
        description: newRoom.description.trim(),
        imageUrl,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setNewRoom({ name: '', description: '', image: null });
      setCreateDialogOpen(false);
      loadRooms();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!auth.currentUser || !selectedRoom || (!newMessage.trim() && !attachment)) return;

    try {
      const messageData: any = {
        text: newMessage.trim(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Usuario Anónimo',
        userAvatar: auth.currentUser.photoURL || '',
        timestamp: serverTimestamp(),
      };

      if (attachment) {
        const storageRef = ref(storage, `rooms/${selectedRoom.id}/files/${Date.now()}_${attachment.name}`);
        await uploadBytes(storageRef, attachment);
        const attachmentUrl = await getDownloadURL(storageRef);
        messageData.attachmentUrl = attachmentUrl;
        messageData.attachmentType = attachment.type.startsWith('image/') ? 'image' : 'file';
      }

      await addDoc(collection(firestore, 'rooms', selectedRoom.id, 'messages'), messageData);

      setNewMessage('');
      setAttachment(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachment(event.target.files[0]);
    }
  };

  const handleRoomImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setNewRoom({ ...newRoom, image: event.target.files[0] });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StyledPaper>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Salas Temáticas
                </Typography>
                <Fab
                  color="primary"
                  size="small"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <AddIcon />
                </Fab>
              </Box>
              <List>
                {rooms.map((room) => (
                  <React.Fragment key={room.id}>
                    <ListItem
                      button
                      selected={selectedRoom?.id === room.id}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <ListItemAvatar>
                        <Avatar src={room.imageUrl} alt={room.name}>
                          {room.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={room.name}
                        secondary={room.description}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </StyledPaper>
          </Grid>
          <Grid item xs={12} md={8}>
            <StyledPaper>
              {selectedRoom ? (
                <>
                  <Box p={2} borderBottom="1px solid rgba(255, 255, 255, 0.1)">
                    <Typography variant="h6">
                      {selectedRoom.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedRoom.description}
                    </Typography>
                  </Box>
                  <MessageList ref={messageListRef}>
                    {messages.map((message) => (
                      <Box
                        key={message.id}
                        display="flex"
                        flexDirection="column"
                        alignItems={message.userId === auth.currentUser?.uid ? 'flex-end' : 'flex-start'}
                        mb={2}
                      >
                        <Box display="flex" alignItems="center" mb={1}>
                          <Avatar
                            src={message.userAvatar}
                            alt={message.userName}
                            sx={{ width: 24, height: 24, mr: 1 }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {message.userName}
                          </Typography>
                        </Box>
                        {message.attachmentUrl && message.attachmentType === 'image' && (
                          <Box
                            component="img"
                            src={message.attachmentUrl}
                            alt="Attachment"
                            sx={{
                              maxWidth: '300px',
                              borderRadius: 1,
                              mb: 1,
                            }}
                          />
                        )}
                        {message.text && (
                          <Paper
                            sx={{
                              p: 1,
                              backgroundColor: message.userId === auth.currentUser?.uid
                                ? 'primary.main'
                                : 'background.paper',
                              maxWidth: '70%',
                            }}
                          >
                            <Typography variant="body1">
                              {message.text}
                            </Typography>
                          </Paper>
                        )}
                        {message.attachmentUrl && message.attachmentType === 'file' && (
                          <Button
                            href={message.attachmentUrl}
                            target="_blank"
                            startIcon={<AttachFileIcon />}
                            sx={{ mt: 1 }}
                          >
                            Descargar archivo
                          </Button>
                        )}
                      </Box>
                    ))}
                  </MessageList>
                  <MessageInput>
                    <Box display="flex" alignItems="center">
                      <label htmlFor="attachment-input">
                        <input
                          accept="image/*,application/*"
                          id="attachment-input"
                          type="file"
                          style={{ display: 'none' }}
                          onChange={handleAttachment}
                        />
                        <IconButton color="primary" component="span">
                          <AttachFileIcon />
                        </IconButton>
                      </label>
                      <TextField
                        fullWidth
                        placeholder="Escribe un mensaje..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        sx={{ mx: 2 }}
                      />
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() && !attachment}
                      >
                        <SendIcon />
                      </IconButton>
                    </Box>
                    {attachment && (
                      <Box mt={1} display="flex" alignItems="center">
                        <ImageIcon sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {attachment.name}
                        </Typography>
                      </Box>
                    )}
                  </MessageInput>
                </>
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="100%"
                >
                  <Typography variant="h6" color="textSecondary">
                    Selecciona una sala para comenzar a chatear
                  </Typography>
                </Box>
              )}
            </StyledPaper>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Crear Nueva Sala</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre de la sala"
            value={newRoom.name}
            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Descripción"
            value={newRoom.description}
            onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
            multiline
            rows={3}
            margin="normal"
          />
          <Box mt={2}>
            <input
              accept="image/*"
              id="room-image"
              type="file"
              style={{ display: 'none' }}
              onChange={handleRoomImage}
            />
            <label htmlFor="room-image">
              <Button
                variant="outlined"
                component="span"
                startIcon={<ImageIcon />}
              >
                Subir imagen de la sala
              </Button>
            </label>
            {newRoom.image && (
              <Typography variant="body2" mt={1}>
                Imagen seleccionada: {newRoom.image.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateRoom}
            color="primary"
            disabled={!newRoom.name.trim()}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Rooms; 