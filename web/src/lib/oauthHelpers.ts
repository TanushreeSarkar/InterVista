import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from './firebase';
import { apiFetch } from './api';

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  const user = await apiFetch('/api/auth/oauth', {
    method: 'POST',
    body: JSON.stringify({ idToken, provider: 'google' }),
  });
  return user;
}

export async function signInWithGitHub() {
  const result = await signInWithPopup(auth, githubProvider);
  const idToken = await result.user.getIdToken();
  const user = await apiFetch('/api/auth/oauth', {
    method: 'POST',
    body: JSON.stringify({ idToken, provider: 'github' }),
  });
  return user;
}
