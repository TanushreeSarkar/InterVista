import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if the API key is provided
let app;
if (typeof window !== 'undefined' || firebaseConfig.apiKey) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

export const auth = app ? getAuth(app) : null;
if (auth) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Firebase Auth SetPersistence error:", err);
  });
}
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
