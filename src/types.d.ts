declare module 'react-firebase-hooks/auth' {
  import { User } from 'firebase/auth';
  
  export function useAuthState(auth: any): [User | null, boolean, any];
} 