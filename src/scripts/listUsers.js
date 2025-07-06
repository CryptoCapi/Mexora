import * as admin from 'firebase-admin';

// Inicializar Firebase Admin con las credenciales del servicio
const serviceAccount = {
  projectId: "mexora-40057",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function listAllUsers(nextPageToken) {
  try {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    
    console.log('Usuarios registrados:');
    listUsersResult.users.forEach((userRecord) => {
      console.log('Usuario:', {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        createdAt: userRecord.metadata.creationTime,
        lastSignIn: userRecord.metadata.lastSignInTime
      });
    });

    if (listUsersResult.pageToken) {
      // Si hay más usuarios, llamar recursivamente
      await listAllUsers(listUsersResult.pageToken);
    }
  } catch (error) {
    console.error('Error al listar usuarios:', error);
  }
}

// Ejecutar la función
listAllUsers(); 