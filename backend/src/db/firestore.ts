import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK using environment variables.
 * No mock fallbacks — will throw if credentials are invalid.
 */
let _db: admin.firestore.Firestore | null = null

function initFirebase() {
  if (_db) return _db
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    })
  }
  _db = admin.firestore()
  return _db
}

export const getDb = () => initFirebase()
export const getFieldValue = () => admin.firestore.FieldValue
export const getAdmin = () => { initFirebase(); return admin; }
