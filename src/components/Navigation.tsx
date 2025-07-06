import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton,
  Typography, 
  useTheme,
  useMediaQuery,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  styled,
  keyframes,
  Dialog,
  DialogContent,
  Button,
  Avatar,
  Badge,
  Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Chat as ChatIcon,
  Explore as ExploreIcon,
  SportsEsports as GamingIcon,
  Storefront as StorefrontIcon,
  Favorite as FavoriteIcon,
  Person as PersonIcon,
  ChevronLeft as ChevronLeftIcon,
  ShowChart as ShowChartIcon,
  CurrencyBitcoin as CurrencyBitcoinIcon,
  Logout as LogoutIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ContentCopy as ContentCopyIcon,
  Newspaper as NewspaperIcon,
  Groups as GroupsIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import ForoNews from './ForoNews';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const StyledAppBar = styled(AppBar)({
  background: 'linear-gradient(90deg, rgba(0,104,71,0.95) 0%, rgba(206,17,38,0.95) 100%)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
});

const StyledDrawer = styled(Drawer)({
  '& .MuiDrawer-paper': {
    background: 'linear-gradient(135deg, #006847 0%, #ce1126 50%, #000000 100%)',
    color: '#ffffff',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    width: 280,
    zIndex: 1200,
  },
});

const MenuItem = styled(ListItemButton)({
  margin: '8px 16px',
  borderRadius: '10px',
  '&:hover': {
    background: 'rgba(255,255,255,0.1)',
  },
  '&.Mui-selected': {
    background: 'rgba(255,255,255,0.05)',
    borderLeft: '4px solid #FFD700',
    '&:hover': {
      background: 'rgba(255,255,255,0.1)',
    },
  },
});

const MenuItemIcon = styled(ListItemIcon)({
  color: '#ffffff',
  minWidth: '40px',
});

const MenuItemText = styled(ListItemText)({
  '& .MuiListItemText-primary': {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '0.8rem',
    color: '#ffffff',
  },
});

const rainbowAnimation = keyframes`
  0% { color: #ff0000; }
  16.666% { color: #ff00ff; }
  33.333% { color: #0000ff; }
  50% { color: #00ffff; }
  66.666% { color: #00ff00; }
  83.333% { color: #ffff00; }
  100% { color: #ff0000; }
`;

const DonationsText = styled(Typography)({
  fontFamily: '"Press Start 2P", cursive',
  fontSize: '0.8rem',
  animation: `${rainbowAnimation} 3s linear infinite`,
  textShadow: '0 0 5px currentColor',
});

const shineAnimation = keyframes`
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const MexoraLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40">
    <defs>
      <linearGradient id="mexicanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#006847' }} />
        <stop offset="50%" style={{ stopColor: '#FFD700' }} />
        <stop offset="100%" style={{ stopColor: '#ce1126' }} />
      </linearGradient>
      <filter id="neon">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        <feColorMatrix
          type="matrix"
          values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 15 -7"
        />
      </filter>
    </defs>
    {/* Fondo hexagonal */}
    <path
      d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z"
      fill="none"
      stroke="url(#mexicanGradient)"
      strokeWidth="2"
      filter="url(#neon)"
    />
    {/* M estilizada */}
    <path
      d="M12 14 L16 28 L20 14 L24 28 L28 14"
      stroke="#ffffff"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#neon)"
    />
    {/* Detalles aztecas */}
    <path
      d="M20 8 L22 10 L20 12 L18 10 Z"
      fill="#FFD700"
      filter="url(#neon)"
    />
    <path
      d="M20 28 L22 30 L20 32 L18 30 Z"
      fill="#FFD700"
      filter="url(#neon)"
    />
  </svg>
);

const LogoText = styled(Typography)({
  fontFamily: '"Press Start 2P", cursive',
  background: 'linear-gradient(90deg, #FFD700 0%, #FFF8DC 25%, #FFD700 50%, #FFF8DC 75%, #FFD700 100%)',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  letterSpacing: '2px',
  marginLeft: '8px',
  animation: `${shineAnimation} 3s linear infinite`,
});

const donationItems = [
  { label: 'CLABE Bancaria', value: '710969000033375175' },
  { label: 'Wallet Phantom', value: '86nLqwiCL1oRWKnnTpGMLEXjaR6rmXaHD1jiLGDityLp' },
  { label: 'PayPal', value: '@CarinaGomez201' },
];

const DonationSection = () => (
  <Box p={2} style={{ background: 'url(/assets/animated-background.gif) no-repeat center center', backgroundSize: 'cover', borderRadius: '10px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>
    <Typography variant="h4" color="inherit" gutterBottom style={{ fontFamily: '"Press Start 2P", cursive', color: '#FFD700', textAlign: 'center', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
      Apoya a Mexora
    </Typography>
    <Typography variant="body1" color="inherit" paragraph style={{ fontFamily: '"Press Start 2P", cursive', color: '#ffffff', textAlign: 'center', marginBottom: '20px' }}>
      Este proyecto innovador busca mejorar la experiencia de los usuarios en el mundo de las criptomonedas. Tu apoyo es fundamental para continuar desarrollando nuevas funcionalidades y mantener el proyecto en marcha.
    </Typography>
    {donationItems.map((item) => (
      <Box key={item.label} display="flex" alignItems="center" justifyContent="space-between" mb={2} p={2} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px' }}>
        <Typography variant="body1" color="inherit" style={{ fontFamily: '"Press Start 2P", cursive', color: '#ffffff' }}>
          <strong>{item.label}:</strong> {item.value}
        </Typography>
        {item.label === 'PayPal' ? (
          <Button variant="contained" color="secondary" href={`https://www.paypal.me/${item.value}`} target="_blank" style={{ fontFamily: '"Press Start 2P", cursive', background: '#FFD700', color: '#000', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
            Donar
          </Button>
        ) : (
          <IconButton onClick={() => navigator.clipboard.writeText(item.value)} style={{ color: '#FFD700' }}>
            <ContentCopyIcon />
          </IconButton>
        )}
      </Box>
    ))}
  </Box>
);

const DonationDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogContent style={{ background: 'url(/assets/crypto-symbols.svg) no-repeat center center', backgroundSize: 'cover' }}>
      <DonationSection />
    </DialogContent>
  </Dialog>
);

const Navigation = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      let totalUnread = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const unreadCount = data.unreadCount?.[currentUser.uid] || 0;
        totalUnread += unreadCount;
      });
      setUnreadMessages(totalUnread);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setDrawerOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleDonationClick = () => {
    setDonationDialogOpen(true);
    setDrawerOpen(false);
  };

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/' },
    { 
      text: 'Chat', 
      icon: (
        <Badge badgeContent={unreadMessages} color="error">
          <ChatIcon />
        </Badge>
      ), 
      path: '/chat' 
    },
    { text: 'Perfil', icon: <PersonIcon />, path: '/profile' },
    { text: 'Descubrir', icon: <ExploreIcon />, path: '/discover' },
    { text: 'Gaming', icon: <GamingIcon />, path: '/gaming' },
    { text: 'IA Scalping', icon: <ShowChartIcon />, path: '/ia-scalping' },
    { text: 'Crypto', icon: <CurrencyBitcoinIcon />, path: '/crypto' },
    { text: 'Foro News', icon: <NewspaperIcon />, path: '/foronews' },
    { text: 'Salas', icon: <GroupsIcon />, path: '/rooms' },
  ];

  return (
    <>
      <StyledAppBar position="fixed" sx={{ zIndex: 1300 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img src="/logoD.png" alt="Mexora Logo" style={{ height: 40, width: 40 }} />
            {!isMobile && <LogoText variant="h6">Mexora</LogoText>}
          </Box>
          {currentUser && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                color="inherit"
                onClick={() => handleNavigation('/profile')}
              >
                <Badge color="error">
                  <Avatar
                    alt={currentUser.displayName || ''}
                    src={currentUser.photoURL || ''}
                    sx={{ width: 32, height: 32 }}
                  />
                </Badge>
              </IconButton>
            </Box>
          )}
        </Toolbar>
        {/* Menú horizontal solo en escritorio */}
        {!isMobile && (
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              bgcolor: 'rgba(0,0,0,0.2)',
              px: 2,
              py: 1,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {menuItems.map((item) => (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  color: '#fff',
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '0.7rem',
                  mx: 1,
                  whiteSpace: 'nowrap',
                  borderRadius: '10px',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                {item.text}
              </Button>
            ))}
            <Button
              onClick={handleDonationClick}
              startIcon={<FavoriteIcon />}
              sx={{
                color: '#FFD700',
                fontFamily: '"Press Start 2P", cursive',
                fontSize: '0.7rem',
                mx: 1,
                whiteSpace: 'nowrap',
                borderRadius: '10px',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Donaciones
            </Button>
            {currentUser && (
              <Button
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{
                  color: '#ce1126',
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '0.7rem',
                  mx: 1,
                  whiteSpace: 'nowrap',
                  borderRadius: '10px',
                  '&:hover': {
                    background: 'rgba(255,0,0,0.1)',
                  },
                }}
              >
                Cerrar Sesión
              </Button>
            )}
          </Box>
        )}
      </StyledAppBar>
      {/* Drawer solo en móviles */}
      {isMobile && (
        <StyledDrawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
            },
          }}
        >
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img src="/logoD.png" alt="Mexora Logo" style={{ height: 40, width: 40 }} />
                <LogoText variant="h6">Mexora</LogoText>
              </Box>
              <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}>
                <ChevronLeftIcon />
              </IconButton>
            </Box>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            <List>
              {menuItems.map((item) => (
                <MenuItem
                  key={item.text}
                  onClick={() => handleNavigation(item.path)}
                  selected={location.pathname === item.path}
                >
                  <MenuItemIcon>{item.icon}</MenuItemIcon>
                  <MenuItemText primary={item.text} />
                </MenuItem>
              ))}
              <MenuItem onClick={handleDonationClick}>
                <MenuItemIcon>
                  <FavoriteIcon />
                </MenuItemIcon>
                <MenuItemText>
                  <DonationsText>Donaciones</DonationsText>
                </MenuItemText>
              </MenuItem>
              {currentUser && (
                <MenuItem onClick={handleLogout}>
                  <MenuItemIcon>
                    <LogoutIcon />
                  </MenuItemIcon>
                  <MenuItemText primary="Cerrar Sesión" />
                </MenuItem>
              )}
            </List>
          </Box>
        </StyledDrawer>
      )}
      <DonationDialog
        open={donationDialogOpen}
        onClose={() => setDonationDialogOpen(false)}
      />
    </>
  );
};

export default Navigation; 