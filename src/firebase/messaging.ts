import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const messaging = getMessaging(app);

export const initializeMessaging = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    });

    return token;
  } catch (error) {
    console.error('Error getting messaging token:', error);
    throw error;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export const sendNotification = async (userId: string, notification: {
  title: string;
  body: string;
  data?: any;
}) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const fcmToken = userDoc.data()?.fcmToken;

    if (fcmToken) {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=TU_SERVER_KEY` // Necesitarás tu Server Key de Firebase
        },
        body: JSON.stringify({
          to: fcmToken,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data
        })
      });
      return response.ok;
    }
    return false;
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return false;
  }
}; 