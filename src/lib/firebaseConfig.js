// Colle ici la configuration de ton projet Firebase :
// Console Firebase > Paramètres du projet (roue crantée) > Général > "Vos applications" > icône Web (</>) > objet firebaseConfig.
// Ces valeurs ne sont pas secrètes : la sécurité vient des règles Firestore, pas de leur confidentialité.
export const firebaseConfig = {
  apiKey: 'AIzaSyDxBJ-BskZNk6sdREaMZJg32z1IAJ4Oy6Q',
  authDomain: 'sporttrack-c4161.firebaseapp.com',
  projectId: 'sporttrack-c4161',
  storageBucket: 'sporttrack-c4161.firebasestorage.app',
  messagingSenderId: '598035917140',
  appId: '1:598035917140:web:6aa812a0f56477dfeec0c1',
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
