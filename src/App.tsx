import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './components/Login';
import Register from './components/Register';
import Discover from './components/Discover';
import Gaming from './components/Gaming';
import IAScalping from './components/IAScalping';
import CryptoMarket from './components/CryptoMarket';
import DonationPage from './pages/DonationPage';
import ForoNews from './components/ForoNews';
import Rooms from './pages/Rooms';
import Chat from './components/Chat';
import Post from './pages/Post';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Navigation />}
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        position: 'relative',
        ...(isAuthPage ? {
          p: 0,
        } : {
          pt: 8,
          px: 2,
        })
      }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
          <Route path="/gaming" element={<ProtectedRoute><Gaming /></ProtectedRoute>} />
          <Route path="/ia-scalping" element={<ProtectedRoute><IAScalping /></ProtectedRoute>} />
          <Route path="/crypto" element={<ProtectedRoute><CryptoMarket /></ProtectedRoute>} />
          <Route path="/foronews" element={<ProtectedRoute><ForoNews /></ProtectedRoute>} />
          <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
          <Route path="/donation" element={<DonationPage />} />
          <Route path="/post/:postId" element={<Post />} />
        </Routes>
      </Box>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 