import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { auth } from '../../firebase';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'achievement' | 'level' | 'skill' | 'other';
  read: boolean;
  userId: string;
  createdAt: Date;
}

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
  },
}));

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const firestore = getFirestore();
    const notificationsRef = collection(firestore, 'notifications');
    const userNotificationsQuery = query(
      notificationsRef,
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(userNotificationsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'achievement':
        return <TrophyIcon color="primary" />;
      case 'level':
        return <StarIcon color="secondary" />;
      case 'skill':
        return <SchoolIcon color="action" />;
      default:
        return <NotificationsIcon />;
    }
  };

  return (
    <Box>
      <IconButton onClick={handleClick}>
        <StyledBadge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </StyledBadge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '30ch',
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography>No hay notificaciones</Typography>
          </MenuItem>
        ) : (
          <List>
            {notifications.map((notification) => (
              <ListItem key={notification.id}>
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={notification.message}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Menu>
    </Box>
  );
};

export default NotificationCenter; 