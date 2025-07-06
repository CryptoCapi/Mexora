import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  doc,
  getDoc
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDH0OEQ89ZnOmGVH3LPc_ghP1vvP_1Pwqc",
  authDomain: "mexora-40057.firebaseapp.com",
  databaseURL: "https://mexora-40057-default-rtdb.firebaseio.com",
  projectId: "mexora-40057",
  storageBucket: "mexora-40057.firebasestorage.app",
  messagingSenderId: "300023762228",
  appId: "1:300023762228:web:8505aedcf1d0c8e80d6961",
  measurementId: "G-XBGFXDPSQ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
});

// Configure persistence for authentication
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// Cache de apodos
const nicknameCache = new Map<string, string>();

// Función para obtener el apodo de un usuario
export const getUserNickname = async (userId: string): Promise<string> => {
  // Verificar si el apodo está en caché
  if (nicknameCache.has(userId)) {
    return nicknameCache.get(userId)!;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const nickname = userDoc.data()?.displayName || 'Usuario';
      // Guardar en caché
      nicknameCache.set(userId, nickname);
      return nickname;
    }
    return 'Usuario';
  } catch (error) {
    console.error('Error al obtener apodo:', error);
    return 'Usuario';
  }
};

// Limpiar caché cuando el usuario cierra sesión
onAuthStateChanged(auth, (user) => {
  if (!user) {
    nicknameCache.clear();
  }
});

export default app;
