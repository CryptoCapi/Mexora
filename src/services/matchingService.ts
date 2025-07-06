import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';
import { 
  UserProfile, 
  MatchingPreferences,
  InterestTag
} from '../types/social';
import Fuse from 'fuse.js';

interface ScoredProfile extends UserProfile {
  matchingScore: number;
}

class MatchingService {
  private static instance: MatchingService;
  private fuseOptions = {
    keys: ['interests', 'skills', 'bio'],
    threshold: 0.3,
    distance: 100
  };

  private constructor() {}

  public static getInstance(): MatchingService {
    if (!MatchingService.instance) {
      MatchingService.instance = new MatchingService();
    }
    return MatchingService.instance;
  }

  async getProfileRecommendations(
    userId: string, 
    limit: number = 10
  ): Promise<UserProfile[]> {
    try {
      // Obtener preferencias de matching del usuario
      const prefsRef = doc(db, 'matchingPreferences', userId);
      const prefsSnap = await getDoc(prefsRef);
      const preferences = prefsSnap.exists() ? prefsSnap.data() as MatchingPreferences : null;

      // Obtener perfil del usuario
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('Perfil de usuario no encontrado');
      }

      // Construir query base
      const baseQuery = collection(db, 'userProfiles');
      let q = query(
        baseQuery,
        where('id', '!=', userId),
        orderBy('socialScore', 'desc'),
        firestoreLimit(limit * 2) // Obtener más resultados para filtrar
      );

      // Aplicar filtros según preferencias
      if (preferences) {
        if (preferences.minSocialScore) {
          q = query(q, where('socialScore', '>=', preferences.minSocialScore));
        }
        if (preferences.locationPreference) {
          q = query(q, where('location', '==', preferences.locationPreference));
        }
      }

      const snapshot = await getDocs(q);
      let profiles = snapshot.docs.map(doc => doc.data() as UserProfile);

      // Filtrar y ordenar resultados
      profiles = this.filterAndSortProfiles(profiles, userProfile, preferences);

      return profiles.slice(0, limit);
    } catch (error) {
      console.error('Error al obtener recomendaciones:', error);
      throw error;
    }
  }

  private filterAndSortProfiles(
    profiles: UserProfile[],
    userProfile: UserProfile,
    preferences: MatchingPreferences | null
  ): UserProfile[] {
    // Crear índice Fuse.js para búsqueda difusa
    const fuse = new Fuse(profiles, this.fuseOptions);

    return profiles
      .map(profile => {
        // Calcular puntaje de matching
        const score = this.calculateMatchingScore(profile, userProfile, preferences);
        return { ...profile, matchingScore: score } as ScoredProfile;
      })
      .filter(profile => {
        // Aplicar filtros básicos
        if (preferences?.requiredSkills?.length) {
          const hasRequiredSkills = preferences.requiredSkills.every(skill => 
            profile.skills.includes(skill)
          );
          if (!hasRequiredSkills) return false;
        }

        if (preferences?.preferredInterests?.length) {
          const hasPreferredInterests = preferences.preferredInterests.some(interest =>
            profile.interests.includes(interest)
          );
          if (!hasPreferredInterests) return false;
        }

        return true;
      })
      .sort((a, b) => (b.matchingScore || 0) - (a.matchingScore || 0))
      .map(({ matchingScore, ...profile }) => profile);
  }

  private calculateMatchingScore(
    profile: UserProfile,
    userProfile: UserProfile,
    preferences: MatchingPreferences | null
  ): number {
    let score = 0;

    // Puntaje base por intereses comunes
    const commonInterests = profile.interests.filter(interest =>
      userProfile.interests.includes(interest)
    );
    score += commonInterests.length * 10;

    // Puntaje por habilidades complementarias
    const complementarySkills = profile.skills.filter(skill =>
      !userProfile.skills.includes(skill)
    );
    score += complementarySkills.length * 5;

    // Puntaje por preferencias del usuario
    if (preferences) {
      if (preferences.preferredInterests?.length) {
        const matchingInterests = profile.interests.filter(interest =>
          preferences.preferredInterests.includes(interest)
        );
        score += matchingInterests.length * 15;
      }

      if (preferences.requiredSkills?.length) {
        const matchingSkills = profile.skills.filter(skill =>
          preferences.requiredSkills.includes(skill)
        );
        score += matchingSkills.length * 20;
      }
    }

    // Bonus por puntaje social
    score += profile.socialScore * 0.1;

    return score;
  }

  async getSimilarProfiles(
    userId: string,
    basedOn: 'interests' | 'skills' | 'both' = 'both',
    limit: number = 5
  ): Promise<UserProfile[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('Perfil de usuario no encontrado');
      }

      const profilesRef = collection(db, 'userProfiles');
      let q = query(
        profilesRef,
        where('id', '!=', userId),
        orderBy('socialScore', 'desc'),
        firestoreLimit(limit * 2)
      );

      const snapshot = await getDocs(q);
      let profiles = snapshot.docs.map(doc => doc.data() as UserProfile);

      // Filtrar perfiles similares
      profiles = profiles.filter(profile => {
        if (basedOn === 'interests' || basedOn === 'both') {
          const commonInterests = profile.interests.filter(interest =>
            userProfile.interests.includes(interest)
          );
          if (commonInterests.length === 0) return false;
        }

        if (basedOn === 'skills' || basedOn === 'both') {
          const commonSkills = profile.skills.filter(skill =>
            userProfile.skills.includes(skill)
          );
          if (commonSkills.length === 0) return false;
        }

        return true;
      });

      // Ordenar por número de coincidencias
      profiles.sort((a, b) => {
        const aMatches = this.countMatches(a, userProfile, basedOn);
        const bMatches = this.countMatches(b, userProfile, basedOn);
        return bMatches - aMatches;
      });

      return profiles.slice(0, limit);
    } catch (error) {
      console.error('Error al obtener perfiles similares:', error);
      throw error;
    }
  }

  private countMatches(
    profile: UserProfile,
    userProfile: UserProfile,
    basedOn: 'interests' | 'skills' | 'both'
  ): number {
    let matches = 0;

    if (basedOn === 'interests' || basedOn === 'both') {
      matches += profile.interests.filter(interest =>
        userProfile.interests.includes(interest)
      ).length;
    }

    if (basedOn === 'skills' || basedOn === 'both') {
      matches += profile.skills.filter(skill =>
        userProfile.skills.includes(skill)
      ).length;
    }

    return matches;
  }

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'userProfiles', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() as UserProfile : null;
  }
}

export default MatchingService; 