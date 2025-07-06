import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { styled } from '@mui/system';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  List,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Divider,
  InputAdornment,
  Tooltip,
  CircularProgress,
  ListItem,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Popover,
  Alert,
  Switch,
  DialogContentText,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Close as CloseIcon,
  Mic as MicIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Report as ReportIcon,
  Timer as TimerIcon,
  Lock as LockIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  CurrencyBitcoin as CurrencyBitcoinIcon,
} from '@mui/icons-material';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  writeBatch,
  increment,
  arrayUnion,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, storage } from '../firebase';
import { getStorage, ref as storageRef, uploadBytesResumable as uploadBytesResumableRef, getDownloadURL as getDownloadURLRef } from "firebase/storage";
import EncryptionService from '../services/encryptionService';
import { Message, Chat, MessageFilter, ChatUserInfo } from '../types/chat';
import { User as FirebaseUser } from 'firebase/auth';
import { User as ChatUser } from '../types/chat';
import CreateChatDialog from './CreateChatDialog';

// Styled components
const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isMe',
})<{ isMe: boolean }>(({ theme, isMe }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(1),
  alignSelf: isMe ? 'flex-end' : 'flex-start',
  backgroundColor: isMe ? theme.palette.primary.main : theme.palette.background.paper,
  color: isMe ? theme.palette.primary.contrastText : theme.palette.text.primary,
  minHeight: '20px',
  cursor: 'pointer',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  whiteSpace: 'pre-wrap',
  '&:hover': {
    backgroundColor: isMe ? theme.palette.primary.dark : theme.palette.action.hover,
  },
}));

const DateDivider = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: theme.spacing(2, 0),
}));

const DateText = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.8rem',
  color: theme.palette.text.secondary,
}));

const ReplyContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
}));

const ReplyContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: 'calc(100vh - 64px)',
  marginTop: '64px',
  backgroundColor: theme.palette.background.default,
  position: 'relative',
  overflow: 'hidden',
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  wordBreak: 'break-word',
}));

const ReplyPreview = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  cursor: 'pointer',
}));

const mapFirebaseUserToChatUser = (firebaseUser: FirebaseUser): ChatUser => ({
  uid: firebaseUser.uid,
  displayName: firebaseUser.displayName || 'Usuario',
  photoURL: firebaseUser.photoURL || '',
  email: firebaseUser.email || '',
});

// Componente principal
const ChatComponent: React.FC = () => {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageFilters, setMessageFilters] = useState<MessageFilter>({});
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupSettings, setGroupSettings] = useState({
    onlyAdminsCanPost: false,
    onlyAdminsCanAddMembers: false,
    allowMemberInvites: true,
    messageRetentionDays: 30,
  });
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!user || !selectedChat || (!messageText && !selectedFile)) return;

    try {
      setLoading(true);
      let imageUrl = '';
      let audioUrl = '';
      const attachments: { type: 'image' | 'file' | 'audio'; url: string; name?: string; size?: number; }[] = [];

      if (selectedFile) {
        const storageReference = storageRef(storage, `chat-files/${Date.now()}-${selectedFile.name}`);
        const uploadTask = uploadBytesResumableRef(storageReference, selectedFile);
        
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              // Progreso de la subida
            },
            (error) => {
              reject(error);
            },
            async () => {
              const url = await getDownloadURLRef(uploadTask.snapshot.ref);
              if (selectedFile.type.startsWith('image/')) {
                imageUrl = url;
                attachments.push({ type: 'image', url, name: selectedFile.name, size: selectedFile.size });
              } else if (selectedFile.type.startsWith('audio/')) {
                audioUrl = url;
                attachments.push({ type: 'audio', url, name: selectedFile.name, size: selectedFile.size });
              } else {
                 attachments.push({ type: 'file', url, name: selectedFile.name, size: selectedFile.size });
              }
              resolve(url);
            }
          );
        });
      }

      const messageData: Message = {
        id: doc(collection(db, 'messages')).id,
        userId: user.uid,
        userName: user.displayName || 'Usuario',
        userAvatar: user.photoURL || "",
        text: messageText,
        attachments: attachments.length > 0 ? attachments : [],
        timestamp: serverTimestamp(),
        status: 'sent',
        readBy: [user.uid],
        edited: false,
        reactions: {},
        chatId: selectedChat,
      };

      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          text: replyingTo.text,
          userId: replyingTo.userId,
          userName: replyingTo.userName,
        };
      }

      await addDoc(collection(db, 'messages'), messageData);
      setMessageText('');
      setSelectedFile(null);
      setReplyingTo(null);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'audio-message.webm', { type: 'audio/webm' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
    markMessagesAsRead(chatId);
  };

  const handleBackToChats = () => {
    setSelectedChat(null);
  };

  const markMessagesAsRead = async (chatId: string) => {
    if (!user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      where('readBy', 'array-contains', user.uid)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        readBy: arrayUnion(user.uid),
      });
    });

    await batch.commit();
  };

  useEffect(() => {
    if (!selectedChat || !user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', selectedChat),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
        } as Message);
      });
      console.log("Mensajes recibidos por snapshot:", newMessages);
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [selectedChat, user]);

  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newChats: Chat[] = [];
      snapshot.forEach(async (chatDoc) => {
        const data = chatDoc.data();
        let userInfo: ChatUserInfo = { id: '', displayName: 'Grupo', photoURL: '' };
        let isGroup = data.isGroup === true;
        let lastMessageContent = data.lastMessage?.text || data.lastMessage?.content || '';

        if (!isGroup) {
          const otherParticipantId = data.participants.find((id: string) => id !== user?.uid);
          if (otherParticipantId) {
            try {
              const userDocRef = doc(db, 'users', otherParticipantId);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as ChatUserInfo;
                userInfo = {
                  id: otherParticipantId,
                  displayName: userData.displayName || 'Usuario',
                  photoURL: userData.photoURL || '',
                };
              } else {
                 userInfo.displayName = "Usuario no encontrado";
              }
            } catch (error) {
              console.error("Error fetching user info for chat:", error);
              userInfo.displayName = "Error al cargar usuario";
            }
          }
        } else {
             userInfo.displayName = data.groupName || "Grupo sin nombre";
             userInfo.photoURL = data.groupImage || '';
        }

        newChats.push({
          id: chatDoc.id,
          participants: data.participants,
          isGroup: isGroup,
          groupName: data.groupName,
          groupImage: data.groupImage,
          groupDescription: data.groupDescription,
          groupSettings: data.groupSettings,
          roles: data.roles,
          lastMessage: data.lastMessage ? { 
              text: lastMessageContent,
              content: lastMessageContent,
              timestamp: data.lastMessage.timestamp,
              senderId: data.lastMessage.senderId
          } : undefined,
          unreadCount: data.unreadCount?.[user?.uid] || 0,
          userInfo: userInfo,
          blockedUsers: data.blockedUsers,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
        } as Chat);
      });
       setChats(newChats);
    }, (error) => {
        console.error("Error listening to chat updates:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const renderMessages = () => {
    console.log("Intentando renderizar mensajes:", messages);
    return messages.map((message, index) => {
      const isMe = message.userId === user?.uid;
      const messageDate = message.timestamp?.toDate ? message.timestamp.toDate() : message.timestamp;
      const prevMessageDate = index > 0 ? (messages[index - 1].timestamp?.toDate ? messages[index - 1].timestamp.toDate() : messages[index - 1].timestamp) : null;
      
      const showDate = index === 0 || 
        (messageDate && prevMessageDate && 
         messageDate.toDateString() !== prevMessageDate.toDateString());

      // Determine message status based on readBy field and chat type
      let isRead = false;
      const currentChat = chats.find(chat => chat.id === selectedChat);
      if (currentChat && !currentChat.isGroup) {
        const otherParticipant = currentChat.participants.find(p => p !== user?.uid);
        if (otherParticipant && typeof otherParticipant === 'string') {
          isRead = message.readBy ? message.readBy.includes(otherParticipant) : false;
        }
      } else if (currentChat && currentChat.isGroup) {
         // Optional: Implement group read status logic here (e.g., seen by at least one, seen by all)
         // For now, we won't show 'seen' status in groups to keep it simple.
         isRead = false; // Default to false for groups
      }
      
      // We don't have a separate 'delivered' status in the current data model,
      // so we'll use read=false for both 'sent' and 'delivered'.

      return (
        <>
          {showDate && (
            <DateDivider key={`date-${message.id}`}>
              <DateText>
                {messageDate?.toLocaleDateString()}
              </DateText>
            </DateDivider>
          )}
          <MessageBubble 
            key={message.id} 
            isMe={isMe}
            onClick={() => setReplyingTo(message)}
          >
            {message.replyTo && (
              <ReplyContainer>
                <ReplyContent>
                  <Typography variant="caption" color="textSecondary">
                    {message.replyTo.userName}
                  </Typography>
                  <Typography variant="body2">{message.replyTo.text}</Typography>
                </ReplyContent>
              </ReplyContainer>
            )}
            {message.attachments && message.attachments.map((attachment, index) => {
              if (attachment.type === 'image') {
                return (
                  <img 
                    key={index}
                    src={attachment.url} 
                    alt="Mensaje" 
                    style={{ maxWidth: '100%', borderRadius: '8px' }} 
                  />
                );
              } else if (attachment.type === 'audio') {
                return (
                  <audio key={index} controls style={{ width: '100%' }}>
                    <source src={attachment.url} type="audio/webm" />
                    Tu navegador no soporta el elemento de audio.
                  </audio>
                );
              }
              return null;
            })}
            <Typography>{message.text}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
              <Typography variant="caption" color="textSecondary">
                {messageDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              {isMe && (
                // Display Bitcoin icon based on read status
                <Tooltip title={isRead ? 'Visto' : 'Enviado'} placement="top">
                  <CurrencyBitcoinIcon
                    sx={{
                      fontSize: '0.9rem',
                      color: isRead ? '#FFD700' : '#9e9e9e', // Gold for read, grey for sent/delivered
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          </MessageBubble>
        </>
      );
    });
  };

  // Función para manejar reacciones a mensajes
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const message = messageDoc.data() as Message;
      const reactions = message.reactions || {};
      const userReactions = reactions[emoji] || [];
      
      if (userReactions.includes(user.uid)) {
        // Remover reacción
        reactions[emoji] = userReactions.filter(id => id !== user.uid);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        // Agregar reacción
        reactions[emoji] = [...userReactions, user.uid];
      }
      
      await updateDoc(messageRef, { reactions });
    }
  };

  // Función para editar mensajes
  const handleEditMessage = async () => {
    if (!user || !selectedMessage) return;
    
    const messageRef = doc(db, 'messages', selectedMessage.id);
    await updateDoc(messageRef, {
      text: editText,
      edited: true,
      editedAt: serverTimestamp(),
    });
    
    setIsEditing(false);
    setEditText('');
    setSelectedMessage(null);
  };

  // Función para eliminar mensajes
  const handleDeleteMessage = async () => {
    if (!user || !selectedMessage) return;
    
    const messageRef = doc(db, 'messages', selectedMessage.id);
    await deleteDoc(messageRef);
    
    setSelectedMessage(null);
  };

  // Función para mensajes temporales
  const handleTemporaryMessage = async (expiresIn: number) => {
    if (!user || !selectedChat || !messageText) return;
    
    const expiresAt = new Date(Date.now() + expiresIn);
    const messageData: Message = {
      id: doc(collection(db, 'messages')).id,
      userId: user.uid,
      userName: user.displayName || 'Usuario',
      userAvatar: user.photoURL || "",
      text: messageText,
      timestamp: serverTimestamp(),
      status: 'sent',
      readBy: [user.uid],
      isTemporary: true,
      expiresAt,
      edited: false,
      reactions: {},
      chatId: selectedChat,
    };
    
    await addDoc(collection(db, 'messages'), messageData);
    setMessageText('');
  };

  // Función para manejar el indicador de escritura
  const handleTyping = () => {
    if (!user || !selectedChat) return;
    
    setIsTyping(true);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
    
    setTypingTimeout(timeout);
    
    const chatRef = doc(db, 'chats', selectedChat);
    updateDoc(chatRef, {
      [`typing.${user.uid}`]: true,
    });
  };

  // Función para bloquear usuarios
  const handleBlockUser = async (userId: string) => {
    if (!user || !selectedChat) return;
    
    const chatRef = doc(db, 'chats', selectedChat);
    await updateDoc(chatRef, {
      blockedUsers: arrayUnion(userId),
    });
  };

  // Función para reportar mensajes
  const handleReportMessage = async () => {
    if (!user || !selectedMessage) return;
    
    const messageRef = doc(db, 'messages', selectedMessage.id);
    await updateDoc(messageRef, {
      reportedBy: arrayUnion(user.uid),
    });
    
    setSelectedMessage(null);
  };

  // Función para actualizar configuración de grupo
  const handleUpdateGroupSettings = async () => {
    if (!user || !selectedChat) return;
    
    const chatRef = doc(db, 'chats', selectedChat);
    await updateDoc(chatRef, {
      groupSettings,
    });
    
    setShowGroupSettings(false);
  };

  // Efecto para limpiar mensajes temporales expirados
  useEffect(() => {
    if (!selectedChat) return;
    
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', selectedChat),
      where('isTemporary', '==', true),
      where('expiresAt', '<', new Date())
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });
    });
    
    return () => unsubscribe();
  }, [selectedChat]);

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;
    
    try {
      // Primero eliminamos todos los mensajes del chat
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('chatId', '==', chatId));
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Luego eliminamos el chat
      const chatRef = doc(db, 'chats', chatId);
      batch.delete(chatRef);
      
      await batch.commit();
      
      // Si el chat eliminado era el seleccionado, deseleccionarlo
      if (selectedChat === chatId) {
        setSelectedChat(null);
      }
      
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    } catch (error) {
      console.error('Error al eliminar el chat:', error);
    }
  };

  const openDeleteDialog = (chatId: string) => {
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  return (
    <ChatContainer>
      {selectedChat ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={handleBackToChats}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" component="span">
                {chats.find(chat => chat.id === selectedChat)?.userInfo?.displayName || 'Chat'}
              </Typography>
            </Box>
            <Box>
              <IconButton onClick={() => setShowGroupSettings(true)}>
                <SettingsIcon />
              </IconButton>
              <IconButton>
                <SearchIcon />
              </IconButton>
            </Box>
          </Box>
          
          <MessagesContainer>
            {renderMessages()}
            {isTyping && (
              <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
                Alguien está escribiendo...
              </Typography>
            )}
            <div ref={messagesEndRef} />
          </MessagesContainer>
          
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            {replyingTo && (
              <ReplyPreview>
                <ReplyContent>
                  <Typography variant="caption" color="textSecondary">
                    Respondiendo a {replyingTo.userName}
                  </Typography>
                  <Typography variant="body2">{replyingTo.text}</Typography>
            </ReplyContent>
            <IconButton size="small" onClick={() => setReplyingTo(null)}>
              <CloseIcon />
            </IconButton>
              </ReplyPreview>
        )}
            
            <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
            placeholder="Escribe un mensaje..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                      <IconButton onClick={() => setShowEmojiPicker(true)}>
                        <SearchIcon />
                      </IconButton>
                      <IconButton onClick={() => fileInputRef.current?.click()}>
                        <AttachFileIcon />
                      </IconButton>
                      <IconButton 
                        onClick={isRecording ? stopRecording : startRecording}
                        color={isRecording ? 'error' : 'default'}
                      >
                        <MicIcon />
                      </IconButton>
                      <IconButton onClick={() => handleTemporaryMessage(60000)}>
                        <TimerIcon />
                      </IconButton>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        accept="image/*,audio/*"
                      />
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton 
                color="primary" 
                onClick={handleSendMessage}
                disabled={loading || (!messageText && !selectedFile)}
              >
                {loading ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
            </Box>
          </Box>
          
          {/* Menú de mensaje */}
          <Menu
            anchorEl={messageMenuAnchor}
            open={Boolean(messageMenuAnchor)}
            onClose={() => setMessageMenuAnchor(null)}
          >
            <MenuItem onClick={() => {
              setIsEditing(true);
              setEditText(selectedMessage?.text || '');
              setMessageMenuAnchor(null);
            }}>
              <EditIcon sx={{ mr: 1 }} /> Editar
            </MenuItem>
            <MenuItem onClick={() => {
              handleDeleteMessage();
              setMessageMenuAnchor(null);
            }}>
              <DeleteIcon sx={{ mr: 1 }} /> Eliminar
            </MenuItem>
            <MenuItem onClick={() => {
              handleBlockUser(selectedMessage?.userId || '');
              setMessageMenuAnchor(null);
            }}>
              <BlockIcon sx={{ mr: 1 }} /> Bloquear usuario
            </MenuItem>
            <MenuItem onClick={() => {
              handleReportMessage();
              setMessageMenuAnchor(null);
            }}>
              <ReportIcon sx={{ mr: 1 }} /> Reportar
            </MenuItem>
          </Menu>
          
          {/* Diálogo de configuración de grupo */}
          <Dialog
            open={showGroupSettings}
            onClose={() => setShowGroupSettings(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Configuración del Grupo</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Permisos</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography>Solo administradores pueden publicar</Typography>
                    <Switch
                      checked={groupSettings.onlyAdminsCanPost}
                      onChange={(e) => setGroupSettings({
                        ...groupSettings,
                        onlyAdminsCanPost: e.target.checked
                      })}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography>Solo administradores pueden agregar miembros</Typography>
                    <Switch
                      checked={groupSettings.onlyAdminsCanAddMembers}
                      onChange={(e) => setGroupSettings({
                        ...groupSettings,
                        onlyAdminsCanAddMembers: e.target.checked
                      })}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography>Permitir invitaciones de miembros</Typography>
                    <Switch
                      checked={groupSettings.allowMemberInvites}
                      onChange={(e) => setGroupSettings({
                        ...groupSettings,
                        allowMemberInvites: e.target.checked
                      })}
                    />
                  </Box>
                </Box>
                
                <Typography variant="subtitle1" sx={{ mt: 3 }}>
                  Retención de mensajes (días)
                </Typography>
                <TextField
                  type="number"
                  value={groupSettings.messageRetentionDays}
                  onChange={(e) => setGroupSettings({
                    ...groupSettings,
                    messageRetentionDays: parseInt(e.target.value)
                  })}
                  fullWidth
                  sx={{ mt: 1 }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowGroupSettings(false)}>Cancelar</Button>
              <Button onClick={handleUpdateGroupSettings} variant="contained">
                Guardar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton 
              color="primary" 
              onClick={() => setShowNewChatDialog(true)}
              sx={{ ml: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Box>
          <List>
            {chats
              .filter(chat => 
                (chat.userInfo?.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((chat) => (
                <React.Fragment key={chat.id}>
                  <StyledListItem
                    selected={selectedChat === chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(chat.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={chat.userInfo?.photoURL || ''} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={chat.userInfo?.displayName || 'Chat'}
                      secondary={chat.lastMessage?.text || chat.lastMessage?.content}
                    />
                    {typeof chat.unreadCount === 'number' && chat.unreadCount > 0 && (
                      <Badge badgeContent={chat.unreadCount} color="primary" />
                    )}
                  </StyledListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
          </List>
        </Box>
      )}
      <CreateChatDialog
        open={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        onChatCreated={(chatId) => {
          setShowNewChatDialog(false);
          handleSelectChat(chatId);
        }}
        currentUser={user ? mapFirebaseUserToChatUser(user) : {
          uid: '',
          displayName: 'Usuario',
          photoURL: '',
          email: '',
        }}
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Eliminar Chat</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar este chat? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={() => chatToDelete && handleDeleteChat(chatToDelete)} 
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </ChatContainer>
  );
};

export default ChatComponent;

