import { db } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const functions = getFunctions();
const sendEmail = httpsCallable(functions, 'sendEmail');

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendWelcomeEmail = async (email: string, name: string) => {
  const emailData: EmailData = {
    to: email,
    subject: '¡Bienvenido a Mexora!',
    text: `Hola ${name},\n\n¡Bienvenido a Mexora! Estamos emocionados de tenerte con nosotros.\n\nSaludos,\nEl equipo de Mexora`
  };
  return sendEmail(emailData);
};

export const sendNotificationEmail = async (
  userEmail: string,
  notificationType: string,
  content: string
) => {
  const emailData: EmailData = {
    to: userEmail,
    subject: `Nueva notificación de Mexora - ${notificationType}`,
    text: content,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Nueva notificación de Mexora</h2>
        <p style="font-size: 16px; color: #333;">${content}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p style="margin: 0; color: #666;">
            Este es un mensaje automático, por favor no responder.
          </p>
        </div>
        <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} Mexora. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `
  };
  return sendEmail(emailData);
};

export const sendSuggestionEmail = async (suggestion: string) => {
  try {
    const emailRef = collection(db, 'suggestions');
    await addDoc(emailRef, {
      suggestion,
      createdAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error sending suggestion:', error);
    return false;
  }
}; 