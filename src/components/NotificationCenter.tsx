import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  styled
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Notification } from '../types/gamification';

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: theme.spacing(2),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const NotificationCenter: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} minutos`;
    if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)} horas`;
    return `Hace ${Math.floor(minutes / 1440)} días`;
  };

  return (
    <Box>
      <IconButton 
        color="inherit" 
        onClick={handleClick}
        aria-label="notificaciones"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
          }
        }}
      >
        <Box p={2}>
          <Typography variant="h6">Notificaciones</Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <StyledMenuItem>
            <Typography variant="body2" color="text.secondary">
              No hay notificaciones
            </Typography>
          </StyledMenuItem>
        ) : (
          notifications.map(notification => (
            <StyledMenuItem 
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              sx={{ 
                backgroundColor: notification.read ? 'transparent' : 'action.hover'
              }}
            >
              <Box>
                <Typography variant="subtitle2">
                  {notification.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTimestamp(notification.timestamp)}
                </Typography>
              </Box>
            </StyledMenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
};

export default NotificationCenter; 