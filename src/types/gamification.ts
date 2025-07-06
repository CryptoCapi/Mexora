import { Timestamp } from 'firebase/firestore';

export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requiredPoints: number;
  requiredActions: { type: string; count: number; }[];
  imageUrl: string;
}

export interface Badge extends BadgeConfig {
  earnedAt: Timestamp;
}

export interface UserLevel {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
}

export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  type: 'social' | 'level' | 'points';
  requirement: string | number;
  points: number;
  badgeId?: string;
  icon: string;
  category: string;
  imageUrl: string;
  target: number;
  requirements: { type: string; target: number }[];
}

export interface Achievement extends Omit<AchievementConfig, 'requirements'> {
  unlockedAt: Timestamp;
  progress: number;
  maxProgress: number;
  completed: boolean;
  completedAt?: Timestamp;
}

export interface UserProgress {
  userId: string;
  level: number;
  points: number;
  totalPoints: number;
  nextLevelPoints: number;
  badges: string[];
  achievements: string[];
  socialStats: {
    posts: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface UserStats {
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
  isPublic: boolean;
}

export interface LevelConfig {
  level: number;
  pointsRequired: number;
  rewards: {
    points: number;
    badgeId?: string;
  };
}

export type BadgeCategory = 
  | 'social' 
  | 'content' 
  | 'engagement' 
  | 'special' 
  | 'achievement';

export type ActionType = 
  | 'send_message'
  | 'create_post'
  | 'react_content'
  | 'make_connection'
  | 'receive_like'
  | 'complete_profile'
  | 'daily_login'
  | 'invite_friend';

export type NotificationType = 'level_up' | 'badge_earned' | 'achievement_unlocked' | 'connection' | 'collaboration' | 'profile_update';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: {
    achievementId?: string;
    badgeId?: string;
    level?: number;
    points?: number;
  };
} 