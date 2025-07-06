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
  Timestamp
} from 'firebase/firestore';
import { 
  UserProfile, 
  Connection, 
  CollaborationProject, 
  SocialActivity,
  InterestTag,
  MatchingPreferences
} from '../types/social';

class SocialService {
  private static instance: SocialService;

  private constructor() {}

  public static getInstance(): SocialService {
    if (!SocialService.instance) {
      SocialService.instance = new SocialService();
    }
    return SocialService.instance;
  }

  // Perfil de Usuario
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'userProfiles', userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? userSnap.data() as UserProfile : null;
    } catch (error) {
      console.error('Error al obtener perfil de usuario:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'userProfiles', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now().toMillis()
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  }

  // Conexiones
  async getConnections(userId: string): Promise<Connection[]> {
    try {
      const connectionsRef = collection(db, 'connections');
      const q = query(
        connectionsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Connection));
    } catch (error) {
      console.error('Error al obtener conexiones:', error);
      throw error;
    }
  }

  async sendConnectionRequest(userId: string, targetUserId: string): Promise<string> {
    try {
      const connectionsRef = collection(db, 'connections');
      const newConnection = {
        userId,
        connectedUserId: targetUserId,
        status: 'pending',
        timestamp: Timestamp.now().toMillis(),
        mutualInterests: [],
        lastInteraction: Timestamp.now().toMillis()
      };
      const docRef = await addDoc(connectionsRef, newConnection);
      return docRef.id;
    } catch (error) {
      console.error('Error al enviar solicitud de conexión:', error);
      throw error;
    }
  }

  // Proyectos de Colaboración
  async getCollaborationProjects(userId: string): Promise<CollaborationProject[]> {
    try {
      const projectsRef = collection(db, 'collaborationProjects');
      const q = query(
        projectsRef,
        where('members', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CollaborationProject));
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      throw error;
    }
  }

  // Actividad Social
  async getSocialActivity(userId: string, limit: number = 20): Promise<SocialActivity[]> {
    try {
      const activityRef = collection(db, 'socialActivity');
      const q = query(
        activityRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialActivity));
    } catch (error) {
      console.error('Error al obtener actividad social:', error);
      throw error;
    }
  }

  // Intereses y Matching
  async getPopularInterestTags(limit: number = 10): Promise<InterestTag[]> {
    try {
      const tagsRef = collection(db, 'interestTags');
      const q = query(
        tagsRef,
        orderBy('popularity', 'desc'),
        firestoreLimit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InterestTag));
    } catch (error) {
      console.error('Error al obtener tags populares:', error);
      throw error;
    }
  }

  async updateMatchingPreferences(userId: string, preferences: Partial<MatchingPreferences>): Promise<void> {
    try {
      const prefsRef = doc(db, 'matchingPreferences', userId);
      await updateDoc(prefsRef, {
        ...preferences,
        lastUpdated: Timestamp.now().toMillis()
      });
    } catch (error) {
      console.error('Error al actualizar preferencias de matching:', error);
      throw error;
    }
  }
}

export default SocialService; 