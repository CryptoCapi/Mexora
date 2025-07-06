import { initializeApp, cert } from 'firebase-admin/app';
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

const db = getFirestore(app);

const rooms = [
  {
    id: 'trading',
    name: 'Trading',
    description: 'Discute estrategias, análisis y señales de trading',
    createdAt: new Date(),
    messageCount: 0,
    lastMessage: null
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Comparte experiencias y estrategias de juegos',
    createdAt: new Date(),
    messageCount: 0,
    lastMessage: null
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Explora las últimas tendencias en tecnología',
    createdAt: new Date(),
    messageCount: 0,
    lastMessage: null
  }
];

async function initializeRooms() {
  try {
    console.log('Iniciando la creación de salas temáticas...');
    
    for (const room of rooms) {
      const roomRef = db.collection('rooms').doc(room.id);
      const roomDoc = await roomRef.get();

      if (!roomDoc.exists) {
        console.log(`Creando sala: ${room.name}`);
        await roomRef.set(room);
        console.log(`Sala ${room.name} creada correctamente`);
      } else {
        console.log(`La sala ${room.name} ya existe`);
      }
    }
    
    console.log('Inicialización de salas completada.');
  } catch (error) {
    console.error('Error en la inicialización de salas:', error);
  }
}

// Ejecutar la inicialización
initializeRooms(); 