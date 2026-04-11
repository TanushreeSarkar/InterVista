import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from './firebase';
import { apiFetch, AuthResponse } from './api';

/**
 * Common handler to send Firebase ID token to our backend
 * so the backend can issue an HttpOnly JWT session cookie.
 */
async function syncSessionWithBackend(idToken: string, provider: string): Promise<AuthResponse> {
  return await apiFetch<AuthResponse>('/api/auth/verify-firebase', {
    method: 'POST',
    body: JSON.stringify({ idToken, provider }),
  });
}

export async function signInWithGoogle() {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return await syncSessionWithBackend(idToken, 'google');
}

export async function signInWithGitHub() {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  const result = await signInWithPopup(auth, githubProvider);
  const idToken = await result.user.getIdToken();
  return await syncSessionWithBackend(idToken, 'github');
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  // 1. Create user in Firebase Auth
  const result = await createUserWithEmailAndPassword(auth, email, password);
  
  // 2. Set the displayName
  await updateProfile(result.user, { displayName: name });
  
  // 3. Sync to Backend
  const idToken = await result.user.getIdToken();
  return await syncSessionWithBackend(idToken, 'email');
}

export async function signInWithEmail(email: string, password: string) {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  // 1. Sign in via Firebase Auth
  const result = await signInWithEmailAndPassword(auth, email, password);
  
  // 2. Sync to Backend
  const idToken = await result.user.getIdToken();
  return await syncSessionWithBackend(idToken, 'email');
}

export async function resetPasswordEmail(email: string) {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  await sendPasswordResetEmail(auth, email);
  return { message: "Password reset email sent." };
}

export async function signOutClient() {
  if (auth) {
    await firebaseSignOut(auth);
  }
}
