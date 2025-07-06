import CryptoJS from 'crypto-js';

class EncryptionService {
  private static instance: EncryptionService;
  private secretKey: string;

  private constructor() {
    // En producción, esto debería venir de variables de entorno
    this.secretKey = process.env.REACT_APP_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  public encryptMessage(message: string): string {
    return CryptoJS.AES.encrypt(message, this.secretKey).toString();
  }

  public decryptMessage(encryptedMessage: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  public generateTemporaryKey(expiresIn: number): string {
    const timestamp = Date.now() + expiresIn;
    return CryptoJS.AES.encrypt(timestamp.toString(), this.secretKey).toString();
  }

  public verifyTemporaryKey(key: string): boolean {
    try {
      const bytes = CryptoJS.AES.decrypt(key, this.secretKey);
      const timestamp = parseInt(bytes.toString(CryptoJS.enc.Utf8));
      return timestamp > Date.now();
    } catch {
      return false;
    }
  }
}

export default EncryptionService; 