import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  styled,
  keyframes,
  Menu,
  MenuItem,
  Divider,
  ListItemButton,
  Container,
  Avatar,
  Tooltip,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  SportsEsports as GamingIcon,
  Favorite as DonationsIcon,
  Explore as DiscoverIcon,
  CurrencyBitcoin as CryptoIcon,
  Logout as LogoutIcon,
  Person as ProfileIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const StyledAppBar = styled(AppBar)({
  background: 'linear-gradient(90deg, rgba(0,104,71,0.95) 0%, rgba(206,17,38,0.95) 100%)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
});

const LogoText = styled(Typography)({
  fontFamily: '"Press Start 2P", cursive',
  background: 'linear-gradient(45deg, #FFD700, #ffffff)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  letterSpacing: '2px',
});

const StyledMenuButton = styled(IconButton)({
  color: '#ffffff',
  '&:hover': {
    background: 'rgba(255,255,255,0.1)',
  },
});

const StyledDrawer = styled(Drawer)({
  '& .MuiDrawer-paper': {
    background: 'linear-gradient(135deg, #006847 0%, #ce1126 50%, #000000 100%)',
    color: '#ffffff',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    width: 250,
  },
});

const MenuItemText = styled(ListItemText)({
  '& .MuiListItemText-primary': {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '0.8rem',
    color: '#ffffff',
  },
});

const rgbAnimation = keyframes`
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
  animation: `${rgbAnimation} 3s linear infinite`,
  textShadow: '0 0 5px currentColor',
});

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const pages = [
    { text: 'INICIO', path: '/', icon: <HomeIcon /> },
    { text: 'DESCUBRIR', path: '/discover', icon: <DiscoverIcon /> },
    { text: 'GAMING', path: '/gaming', icon: <GamingIcon /> },
    { text: 'CRYPTO', path: '/crypto', icon: <CryptoIcon /> },
    { text: 'DONACIONES', path: '/donations', icon: <DonationsIcon /> },
    { text: 'PERFIL', path: '/profile', icon: <ProfileIcon /> },
    { text: 'IA Scalping', path: '/ia-scalping', icon: <ShowChartIcon /> },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <>
      <StyledAppBar position="fixed">
        <Toolbar>
          {isMobile && (
          <StyledMenuButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </StyledMenuButton>
          )}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <LogoText variant="h6">
              MEXORA
            </LogoText>
          </Box>
        </Toolbar>
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
            {pages.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
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
              CERRAR SESIÓN
            </Button>
          </Box>
        )}
      </StyledAppBar>
      {isMobile && (
      <StyledDrawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
          variant="temporary"
      >
        <Box sx={{ width: 250, bgcolor: 'black', height: '100%', color: 'white' }}>
          <List>
            {pages.map((item) => (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                sx={{
                  margin: '8px 16px',
                  borderRadius: '10px',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white' }}>
                  {item.icon}
                </ListItemIcon>
                <MenuItemText primary={item.text} />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
            <ListItemButton
              onClick={handleLogout}
              sx={{
                margin: '8px 16px',
                borderRadius: '10px',
                color: '#ce1126',
                '&:hover': {
                  background: 'rgba(255,0,0,0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: '#ce1126' }}>
                <LogoutIcon />
              </ListItemIcon>
              <MenuItemText primary="CERRAR SESIÓN" />
            </ListItemButton>
          </List>
        </Box>
      </StyledDrawer>
      )}
    </>
  );
};

export default Navbar; 