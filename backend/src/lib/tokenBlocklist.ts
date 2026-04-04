import { getDb } from '../db/firestore';

export async function addToBlocklist(jti: string, expiresAt: Date): Promise<void> {
  const db = getDb();
  await db.collection('tokenBlocklist').doc(jti).set({
    jti,
    expiresAt,
  });
}

export async function isBlocked(jti: string): Promise<boolean> {
  const db = getDb();
  const doc = await db.collection('tokenBlocklist').doc(jti).get();
  
  if (!doc.exists) {
    return false;
  }
  
  const data = doc.data()!;
  const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
  if (expiresAt < new Date()) {
    // Optionally clean up expired token
    db.collection('tokenBlocklist').doc(jti).delete().catch(() => {});
    return false;
  }
  
  return true;
}
