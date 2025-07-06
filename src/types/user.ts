import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio: string;
  level: number;
  points: number;
  badges: string[];
  achievements: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  socialStats: {
    posts: number;
    followers: number;
    following: number;
  };
} 