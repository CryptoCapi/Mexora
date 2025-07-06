import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDHZOmC3wqbu6oTllK2QMSwgRwOPVfg7l4",
  authDomain: "mexora-40057.firebaseapp.com",
  projectId: "mexora-40057",
  storageBucket: "mexora-40057.firebasestorage.app",
  messagingSenderId: "1048262131747",
  appId: "1:1048262131747:web:1234567890abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); 