import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  DocumentData,
  setDoc
} from 'firebase/firestore';
import { 
  UserProgress, 
  Badge, 
  Achievement,
  LevelConfig,
  AchievementConfig
} from '../types/gamification';

class GamificationService {
  private static instance: GamificationService;
  private readonly COLLECTION_NAME = 'userProgress';

  private constructor() {}

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return null;
      }

      return userSnap.data() as UserProgress;
    } catch (error) {
      console.error('Error al obtener progreso de usuario:', error);
      throw error;
    }
  }

  async awardPoints(userId: string, points: number, category: string): Promise<void> {
    try {
      const userProgressRef = doc(db, this.COLLECTION_NAME, userId);
      const userProgressDoc = await getDoc(userProgressRef);

      if (!userProgressDoc.exists()) {
        // Si no existe el progreso, lo creamos
        await setDoc(userProgressRef, {
          userId,
          totalPoints: points,
          pointsByCategory: {
            [category]: points
          },
          lastUpdated: Timestamp.now()
        });
      } else {
        const currentData = userProgressDoc.data();
        const currentPoints = currentData.pointsByCategory?.[category] || 0;
        const currentTotal = currentData.totalPoints || 0;

        await updateDoc(userProgressRef, {
          totalPoints: currentTotal + points,
          [`pointsByCategory.${category}`]: currentPoints + points,
          lastUpdated: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error al otorgar puntos:', error);
      throw error;
    }
  }

  async checkLevelUp(userId: string): Promise<boolean> {
    try {
      const userProgress = await this.getUserProgress(userId);
      if (!userProgress) {
        throw new Error('Progreso de usuario no encontrado');
      }

      const nextLevelPoints = this.calculateNextLevelPoints(userProgress.level);
      
      if (userProgress.points >= nextLevelPoints) {
        const updatedProgress: DocumentData = {
          ...userProgress,
          level: userProgress.level + 1,
          nextLevelPoints: this.calculateNextLevelPoints(userProgress.level + 1),
          lastUpdated: Timestamp.now().toMillis()
        };

        const userRef = doc(db, this.COLLECTION_NAME, userId);
        await updateDoc(userRef, updatedProgress);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al verificar subida de nivel:', error);
      throw error;
    }
  }

  private calculateNextLevelPoints(currentLevel: number): number {
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
  }

  async awardSocialPoints(userId: string, action: 'post' | 'like' | 'comment' | 'share'): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const userDoc = await getDoc(userRef);
      
      const points = {
        post: 10,
        like: 2,
        comment: 5,
        share: 8
      };

      if (!userDoc.exists()) {
        // Inicializar el documento con socialStats
        await setDoc(userRef, {
          userId,
          points: points[action],
          level: 1,
          achievements: [],
          badges: [],
          socialStats: {
            posts: action === 'post' ? 1 : 0,
            likes: action === 'like' ? 1 : 0,
            comments: action === 'comment' ? 1 : 0,
            shares: action === 'share' ? 1 : 0
          },
          lastUpdated: Timestamp.now()
        });
      } else {
        const userData = userDoc.data();
        const socialStats = userData.socialStats || {
          posts: 0,
          likes: 0,
          comments: 0,
          shares: 0
        };

        // Actualizar las estadísticas sociales
        socialStats[action] = (socialStats[action] || 0) + 1;

        await updateDoc(userRef, {
          points: (userData.points || 0) + points[action],
          socialStats,
          lastUpdated: Timestamp.now()
        });
      }

      await this.checkAchievements(userId, action);
    } catch (error) {
      console.error('Error al otorgar puntos sociales:', error);
      throw error;
    }
  }

  async checkAchievements(userId: string, action: string): Promise<void> {
    try {
      const userProgress = await this.getUserProgress(userId);
      if (!userProgress) return;

      const achievements = await this.getAchievements();
      const newAchievements = achievements.filter(achievement => {
        if (userProgress.achievements.includes(achievement.id)) return false;
        
        switch (achievement.type) {
          case 'social':
            return this.checkSocialAchievement(userProgress, achievement, action);
          case 'level':
            return userProgress.level >= achievement.requirement;
          case 'points':
            return userProgress.points >= achievement.requirement;
          default:
            return false;
        }
      });

      if (newAchievements.length > 0) {
        await this.awardAchievements(userId, newAchievements);
      }
    } catch (error) {
      console.error('Error al verificar logros:', error);
      throw error;
    }
  }

  private checkSocialAchievement(progress: UserProgress, achievement: Achievement, action: string): boolean {
    const stats = progress.socialStats || {
      posts: 0,
      likes: 0,
      comments: 0,
      shares: 0
    };

    switch (achievement.requirement) {
      case 'first_post':
        return (stats.posts || 0) >= 1;
      case 'first_like':
        return (stats.likes || 0) >= 1;
      case 'first_comment':
        return (stats.comments || 0) >= 1;
      case 'first_share':
        return (stats.shares || 0) >= 1;
      case 'social_butterfly':
        return ((stats.posts || 0) + (stats.likes || 0) + (stats.comments || 0) + (stats.shares || 0)) >= 100;
      default:
        return false;
    }
  }

  async getAchievements(): Promise<Achievement[]> {
    try {
      const achievementsRef = collection(db, 'achievements');
      const snapshot = await getDocs(achievementsRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Achievement[];
    } catch (error) {
      console.error('Error al obtener logros:', error);
      throw error;
    }
  }

  async awardAchievements(userId: string, achievements: Achievement[]): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return;

      const currentProgress = userSnap.data() as UserProgress;
      const newAchievements = [...currentProgress.achievements, ...achievements.map(a => a.id)];
      
      await updateDoc(userRef, {
        achievements: newAchievements,
        points: currentProgress.points + achievements.reduce((sum, a) => sum + a.points, 0)
      });

      // Notificar al usuario sobre los nuevos logros
      await this.createAchievementNotifications(userId, achievements);
    } catch (error) {
      console.error('Error al otorgar logros:', error);
      throw error;
    }
  }

  private async createAchievementNotifications(userId: string, achievements: Achievement[]): Promise<void> {
    try {
      const notificationsRef = collection(db, 'notifications', userId, 'items');
      const timestamp = Timestamp.now();

      for (const achievement of achievements) {
        await addDoc(notificationsRef, {
          type: 'achievement_unlocked',
          title: '¡Nuevo Logro!',
          message: `Has desbloqueado el logro: ${achievement.name}`,
          timestamp,
          read: false
        });
      }
    } catch (error) {
      console.error('Error al crear notificaciones de logros:', error);
      throw error;
    }
  }
}

export default GamificationService; 