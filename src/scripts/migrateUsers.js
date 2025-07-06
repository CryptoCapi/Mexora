import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://mexora-40057-default-rtdb.firebaseio.com"
});

const auth = getAuth(app);
const db = getFirestore(app);

async function migrateUsers() {
  try {
    console.log('Iniciando migración de usuarios...');
    const listUsersResult = await auth.listUsers();
    
    for (const userRecord of listUsersResult.users) {
      try {
        const userRef = db.collection('users').doc(userRecord.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          console.log(`Creando documento para usuario: ${userRecord.email}`);
          await userRef.set({
            displayName: userRecord.displayName || 'Usuario',
            email: userRecord.email || '',
            photoURL: userRecord.photoURL || '',
            bio: '',
            followers: [],
            following: [],
            createdAt: new Date(userRecord.metadata.creationTime)
          });
          console.log(`Usuario ${userRecord.email} migrado correctamente`);
        } else {
          console.log(`El usuario ${userRecord.email} ya existe en Firestore`);
        }
      } catch (error) {
        console.error(`Error al migrar usuario ${userRecord.email}:`, error);
      }
    }
    
    console.log('Migración completada.');
  } catch (error) {
    console.error('Error en la migración:', error);
  }
}

// Ejecutar la migración
migrateUsers(); 