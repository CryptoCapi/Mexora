import { generateKeyPairSync, publicEncrypt, privateDecrypt, randomBytes } from 'crypto';

// Interfaz para las claves de chat
export interface ChatKeys {
  publicKey: string;
  privateKey: string;
}

// Interfaz para mensajes cifrados
export interface EncryptedMessage {
  encryptedData: string;
  iv: string;
  ephemeralPublicKey: string;
}

// Genera un par de claves para un usuario
export const generateUserKeys = (): ChatKeys => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return {
    publicKey,
    privateKey
  };
};

// Cifra un mensaje
export const encryptMessage = (message: string, recipientPublicKey: string): { data: string, iv: string } => {
  const iv = randomBytes(16);
  const encryptedContent = publicEncrypt(
    recipientPublicKey,
    Buffer.from(message)
  ).toString('base64');

  return {
    data: encryptedContent,
    iv: iv.toString('hex')
  };
};

// Descifra un mensaje
export const decryptMessage = (encryptedData: { data: string, iv: string }, privateKey: string): string => {
  const decrypted = privateDecrypt(
    privateKey,
    Buffer.from(encryptedData.data, 'base64')
  );

  return decrypted.toString();
}; 