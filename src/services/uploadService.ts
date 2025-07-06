import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const storageRef = ref(storage, `${path}/${fileName}`);
    
    // Validar el tamaño del archivo
    if (file.size > 100 * 1024 * 1024) { // 100MB máximo
      throw new Error('El archivo es demasiado grande. El tamaño máximo es 100MB.');
    }

    // Validar el tipo de archivo
    if (file.type.startsWith('video/') && !['video/mp4', 'video/quicktime', 'video/x-m4v'].includes(file.type)) {
      throw new Error('Formato de video no soportado. Por favor, usa MP4, MOV o M4V.');
    }

    // Subir el archivo directamente
    try {
      console.log('Iniciando la subida...');
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadTimestamp: timestamp.toString()
        }
      };

      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('Archivo subido correctamente');

      // Obtener la URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('URL de descarga obtenida:', downloadURL);

      return downloadURL;
    } catch (error: any) {
      console.error('Error al subir el archivo:', error);
      if (error.code === 'storage/unauthorized') {
        throw new Error('No tienes permiso para subir archivos');
      } else if (error.code === 'storage/canceled') {
        throw new Error('La subida fue cancelada');
      } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.');
      } else {
        throw new Error('Error al subir el archivo. Por favor, intenta de nuevo.');
      }
    }
  } catch (error: any) {
    console.error('Error al iniciar la carga:', error);
    throw error;
  }
}; 