import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  Divider,
  IconButton,
  TextField,
  Paper,
  InputAdornment,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  CurrencyBitcoin as CurrencyBitcoinIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { collection, query, where, orderBy, onSnapshot, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Chat, User as ChatUser } from '../../types/chat';
import { keyframes } from '@emotion/react';

const ChatListRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.mode === 'dark' ? '#171A21' : '#FFFFFF',
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === 'dark' ? '#21242B' : theme.palette.grey[100],
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    borderRadius: '20px',
    backgroundColor: theme.palette.mode === 'dark' ? '#2A2D31' : theme.palette.grey[200],
    padding: theme.spacing(0.5, 1),
    fontSize: '0.9rem',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
}));

const ChatListContainer = styled(List)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: 0,
});

const StyledListItem = styled(ListItemButton)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  '&.Mui-selected': {
    backgroundColor: theme.palette.mode === 'dark' ? '#2A2D31' : theme.palette.action.selected,
  },
  '&.Mui-selected:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#313439' : theme.palette.action.selected,
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#21242B' : theme.palette.action.hover,
  },
}));

const ShineAnimation = keyframes`
  0% { filter: brightness(1) drop-shadow(0 0 2px #FFD700); }
  50% { filter: brightness(2) drop-shadow(0 0 8px #FFD700); }
  100% { filter: brightness(1) drop-shadow(0 0 2px #FFD700); }
`;

const BitcoinIconAnimated = styled(CurrencyBitcoinIcon)({
  color: '#FFD700',
  fontSize: 28,
  marginLeft: 8,
  animation: `${ShineAnimation} 1.2s infinite`
});

const UnreadBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#d32f2f',
    color: 'white',
    right: -8,
    top: 8,
    fontWeight: 'bold',
    fontSize: '0.75rem',
    boxShadow: '0 0 6px #FFD700',
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 6px',
  },
}));

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat }: ChatListProps) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const theme = useTheme();

  const handleCreateNewChatOrGroup = () => {
    console.log('Crear nuevo chat o grupo');
  };

  useEffect(() => {
    if (!currentUser) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessage.timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatListPromises = snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        let userInfo: Chat['userInfo'] = { id: '', displayName: 'Grupo', photoURL: '' };
        let isGroup = data.isGroup === true;
        let lastMessageContent = data.lastMessage?.text || data.lastMessage?.content || '';

        if (!isGroup) {
          const otherParticipantId = data.participants.find((id: string) => id !== currentUser.uid);
          if (otherParticipantId) {
            try {
              const userDocRef = firestoreDoc(db, 'users', otherParticipantId);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as ChatUser;
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

        return {
          id: chatDoc.id,
          participants: data.participants,
          lastMessage: data.lastMessage ? { 
              content: lastMessageContent,
              timestamp: data.lastMessage.timestamp,
              senderId: data.lastMessage.senderId
          } : undefined,
          unreadCount: data.unreadCount?.[currentUser.uid] || 0,
          isGroup: isGroup,
          groupName: data.groupName,
          groupImage: data.groupImage,
          userInfo,
        } as Chat;
        });
      
      Promise.all(chatListPromises).then(resolvedChatList => {
         setChats(resolvedChatList);
      });

    }, (error) => {
        console.error("Error listening to chat updates:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredChats = chats.filter((chat) =>
    (chat.userInfo?.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (chat: Chat) => {
     setSelectedChatId(chat.id);
     onSelectChat(chat);
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ayer';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <ChatListRoot>
      <SearchContainer>
        <StyledTextField
          fullWidth
          variant="outlined"
          placeholder="Buscar o empezar un chat nuevo"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
               <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
               </InputAdornment>
            ),
          }}
        />
      </SearchContainer>
      <Box sx={{ p: 2, textAlign: 'center', zIndex: 1, position: 'relative' }}>
        <Button variant="contained" onClick={handleCreateNewChatOrGroup} startIcon={<GroupIcon />}>
          Crear Nuevo Chat o Grupo
        </Button>
      </Box>
      <ChatListContainer disablePadding>
        {filteredChats.length > 0 ? filteredChats.map((chat) => (
          <React.Fragment key={chat.id}>
            <StyledListItem
              selected={selectedChatId === chat.id}
              onClick={() => handleSelect(chat)}
            >
              <ListItemAvatar>
                <Avatar src={chat.userInfo?.photoURL || ''} alt={chat.userInfo?.displayName || 'C'} />
              </ListItemAvatar>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                {chat.unreadCount && chat.unreadCount > 0 && (
                  <>
                    <BitcoinIconAnimated />
                    <UnreadBadge badgeContent={chat.unreadCount} color="error" />
                  </>
                )}
              </Box>
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" noWrap sx={{ fontWeight: chat.unreadCount && chat.unreadCount > 0 ? 'bold' : 'normal'}}>
                      {chat.userInfo?.displayName || 'Chat'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(chat.lastMessage?.timestamp)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color={(chat.unreadCount && chat.unreadCount > 0) ? theme.palette.primary.main : 'text.secondary'}
                    noWrap
                    sx={{ fontWeight: (chat.unreadCount && chat.unreadCount > 0) ? 'bold' : 'normal'}}
                  >
                    {chat.lastMessage?.content || (chat.isGroup ? 'Grupo creado' : 'Chat iniciado')}
                  </Typography>
                }
              />
            </StyledListItem>
            <Divider component="li" variant="inset" sx={{ ml: '72px' }} />
          </React.Fragment>
        )) : (
            <Typography sx={{p: 3, textAlign: 'center', color: 'text.secondary'}}>
                No se encontraron chats.
            </Typography>
        )}
      </ChatListContainer>
    </ChatListRoot>
  );
};

export default ChatList; 