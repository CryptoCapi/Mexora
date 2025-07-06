import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExtendedUser } from '../types/auth';

interface AuthContextType {
  currentUser: ExtendedUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const createOrUpdateUserData = async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          bio: '',
          level: 1,
          points: 0,
          badges: [],
          achievements: [],
          socialStats: {
            posts: 0,
            followers: 0,
            following: 0,
          },
          createdAt: new Date(),
        });
      }

      const userData = userSnap.exists() ? userSnap.data() : {};
      return {
        ...user,
        bio: userData?.bio || '',
        level: userData?.level || 1,
        points: userData?.points || 0,
        badges: userData?.badges || [],
        achievements: userData?.achievements || [],
        socialStats: userData?.socialStats || {
          posts: 0,
          followers: 0,
          following: 0,
        },
      } as ExtendedUser;
    } catch (error) {
      console.error('Error al crear/actualizar datos del usuario:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Intentar primero con popup
      try {
        const result = await signInWithPopup(auth, provider);
        const extendedUser = await createOrUpdateUserData(result.user);
        setCurrentUser(extendedUser);
        navigate('/', { replace: true });
      } catch (popupError) {
        // Si falla el popup, intentar con redirect
        console.log('Fallback a redirect por error en popup:', popupError);
        await signInWithRedirect(auth, provider);
      }
    } catch (error: any) {
      console.error('Error en signInWithGoogle:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleRedirectResult = async () => {
    try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const extendedUser = await createOrUpdateUserData(result.user);
          setCurrentUser(extendedUser);
          if (location.pathname === '/login') {
            navigate('/', { replace: true });
          }
        }
      } catch (error: any) {
        console.error('Error en el manejo del resultado de redirección:', error);
        setError(error.message);
    } finally {
      setLoading(false);
      }
    };

    handleRedirectResult();
  }, [navigate, location]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const extendedUser = await createOrUpdateUserData(user);
          setCurrentUser(extendedUser);
          if (location.pathname === '/login') {
            navigate('/', { replace: true });
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error al manejar cambio de estado de autenticación:', error);
        setError('Error al cargar los datos del usuario');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, location]);

  const signOut = async () => {
    setError(null);
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      setError(error.message);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 