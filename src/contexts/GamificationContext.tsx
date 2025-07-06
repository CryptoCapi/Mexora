import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { UserProgress, Badge, Achievement } from '../types/gamification';

interface GamificationContextType {
  userProgress: UserProgress | null;
  badges: Badge[];
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
}

const GamificationContext = createContext<GamificationContextType>({
  userProgress: null,
  badges: [],
  achievements: [],
  loading: true,
  error: null,
});

export const useGamification = () => useContext(GamificationContext);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setUserProgress(null);
      setBadges([]);
      setAchievements([]);
      setLoading(false);
      return;
    }

    const progressRef = doc(db, 'progress', currentUser.uid);
    const unsubscribeProgress = onSnapshot(progressRef, 
      (doc) => {
        if (doc.exists()) {
          setUserProgress(doc.data() as UserProgress);
        } else {
          setUserProgress(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar progreso:', error);
        setError('Error al cargar el progreso del usuario');
        setLoading(false);
      }
    );

    const badgesRef = doc(db, `users/${currentUser.uid}/badges`, 'earned');
    const unsubscribeBadges = onSnapshot(badgesRef,
      (doc) => {
        if (doc.exists()) {
          setBadges(doc.data().badges || []);
        }
      },
      (error) => {
        console.error('Error al cargar insignias:', error);
      }
    );

    const achievementsRef = doc(db, `users/${currentUser.uid}/achievements`, 'earned');
    const unsubscribeAchievements = onSnapshot(achievementsRef,
      (doc) => {
        if (doc.exists()) {
          setAchievements(doc.data().achievements || []);
        }
      },
      (error) => {
        console.error('Error al cargar logros:', error);
      }
    );

    return () => {
      unsubscribeProgress();
      unsubscribeBadges();
      unsubscribeAchievements();
    };
  }, [currentUser]);

  const value = {
    userProgress,
    badges,
    achievements,
    loading,
    error,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}; 