import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function createAdminUser() {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'admin@mexora.com', 'admin123');
    await updateProfile(userCredential.user, {
      displayName: 'Admin',
      photoURL: 'https://example.com/admin-avatar.png'
    });
    console.log('Usuario administrador creado exitosamente');
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
  }
}

createAdminUser(); 