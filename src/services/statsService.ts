import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

interface UserStats {
  userId: string;
  totalConnections: number;
  totalCollaborations: number;
  totalPoints: number;
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  lastUpdated: Timestamp;
  achievementsUnlocked: number;
  badgesEarned: number;
  socialScore: number;
}

class StatsService {
  private static instance: StatsService;
  private readonly COLLECTION_NAME = 'userStats';

  private constructor() {}

  public static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }

  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const statsRef = doc(db, this.COLLECTION_NAME, userId);
      const statsSnap = await getDoc(statsRef);
      
      if (!statsSnap.exists()) {
        return null;
      }

      return statsSnap.data() as UserStats;
    } catch (error) {
      console.error('Error al obtener estadísticas de usuario:', error);
      throw error;
    }
  }

  async updateSocialScore(userId: string, points: number): Promise<void> {
    try {
      const statsRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(statsRef, {
        socialScore: increment(points),
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error al actualizar puntuación social:', error);
      throw error;
    }
  }

  async updateCollaborationStats(userId: string): Promise<void> {
    try {
      const statsRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(statsRef, {
        totalCollaborations: increment(1),
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error al actualizar estadísticas de colaboración:', error);
      throw error;
    }
  }

  async updateConnectionStats(userId: string): Promise<void> {
    try {
      const statsRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(statsRef, {
        totalConnections: increment(1),
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error al actualizar estadísticas de conexiones:', error);
      throw error;
    }
  }

  async updateAchievementStats(userId: string): Promise<void> {
    try {
      const statsRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(statsRef, {
        achievementsUnlocked: increment(1),
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error al actualizar estadísticas de logros:', error);
      throw error;
    }
  }

  async updateBadgeStats(userId: string): Promise<void> {
    try {
      const statsRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(statsRef, {
        badgesEarned: increment(1),
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error al actualizar estadísticas de insignias:', error);
      throw error;
    }
  }
}

export default StatsService; 