export interface UserProfile {
  id: string;
  displayName: string;
  photoURL?: string;
  interests: string[];
  skills: string[];
  connections: string[];
  collaborationProjects: string[];
  socialScore: number;
  bio?: string;
  location?: string;
  lastActive: number;
  createdAt: number;
}

export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
  mutualInterests: string[];
  lastInteraction: number;
}

export interface CollaborationProject {
  id: string;
  title: string;
  description: string;
  members: string[];
  status: 'active' | 'completed' | 'archived';
  skillsRequired: string[];
  createdAt: number;
  updatedAt: number;
  ownerId: string;
  tags: string[];
}

export interface SocialActivity {
  id: string;
  userId: string;
  type: 'connection' | 'collaboration' | 'achievement' | 'profile_update';
  timestamp: number;
  details: {
    connectionId?: string;
    projectId?: string;
    achievementId?: string;
    updatedFields?: string[];
  };
}

export interface InterestTag {
  id: string;
  name: string;
  category: string;
  popularity: number;
}

export interface MatchingPreferences {
  userId: string;
  minSocialScore: number;
  requiredSkills: string[];
  preferredInterests: string[];
  locationPreference?: string;
  maxDistance?: number;
  lastUpdated: number;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';
export type ProjectStatus = 'active' | 'completed' | 'archived';
export type ActivityType = 'connection' | 'collaboration' | 'achievement' | 'profile_update'; 