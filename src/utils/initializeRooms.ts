import { collection, getDocs, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface Room {
  id: string;
  name: string;
  description: string;
  type: 'trading' | 'gaming' | 'tech';
  participants: string[];
  features: {
    quickSignals: boolean;
    shareCharts: boolean;
    mentions: boolean;
  };
  messageCount: number;
  lastMessage?: {
    text: string;
    timestamp: any;
    sender: string;
  };
  createdAt: any;
}

const defaultRooms = [
  {
    name: 'Trading',
    description: 'Sala dedicada a trading y análisis de mercados',
    type: 'trading' as const,
    participants: [],
    features: {
      quickSignals: true,
      shareCharts: true,
      mentions: true
    },
    messageCount: 0,
    lastMessage: {
      text: 'Bienvenidos a la sala de Trading',
      timestamp: serverTimestamp(),
      sender: 'system'
    }
  },
  {
    name: 'Gaming',
    description: 'Sala para compartir experiencias y estrategias de gaming',
    type: 'gaming' as const,
    participants: [],
    features: {
      quickSignals: false,
      shareCharts: true,
      mentions: true
    },
    messageCount: 0,
    lastMessage: {
      text: 'Bienvenidos a la sala de Gaming',
      timestamp: serverTimestamp(),
      sender: 'system'
    }
  },
  {
    name: 'Tech',
    description: 'Discusiones sobre tecnología y desarrollo',
    type: 'tech' as const,
    participants: [],
    features: {
      quickSignals: false,
      shareCharts: true,
      mentions: true
    },
    messageCount: 0,
    lastMessage: {
      text: 'Bienvenidos a la sala de Tech',
      timestamp: serverTimestamp(),
      sender: 'system'
    }
  }
];

export const initializeRooms = async () => {
  try {
    const roomsRef = collection(db, 'rooms');
    const roomsSnapshot = await getDocs(roomsRef);
    
    if (roomsSnapshot.empty) {
      const batch = writeBatch(db);
      
      for (const room of defaultRooms) {
        const roomRef = doc(collection(db, 'rooms'));
        batch.set(roomRef, {
          ...room,
          createdAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      console.log('Salas temáticas inicializadas correctamente');
    }
  } catch (error) {
    console.error('Error al inicializar las salas:', error);
  }
}; 