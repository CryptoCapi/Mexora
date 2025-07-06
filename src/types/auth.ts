import { User as FirebaseUser } from 'firebase/auth';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtendedUser extends FirebaseUser {
  bio?: string;
  level?: number;
  points?: number;
  badges?: string[];
  achievements?: string[];
  socialStats?: {
    posts: number;
    followers: number;
    following: number;
  };
} 