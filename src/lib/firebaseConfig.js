// Colle ici la configuration de ton projet Firebase :
// Console Firebase > Paramètres du projet (roue crantée) > Général > "Vos applications" > icône Web (</>) > objet firebaseConfig.
// Ces valeurs ne sont pas secrètes : la sécurité vient des règles Firestore, pas de leur confidentialité.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
