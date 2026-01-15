import admin from 'firebase-admin';
import { config } from '../config';

let db: admin.firestore.Firestore;

export function initializeFirestore() {
  try {
    if (!admin.apps.length) {
      // Try to load service account from file first
      let serviceAccount;
      try {
        serviceAccount = require('../../serviceAccountKey.json');
      } catch (fileError) {
        // If file doesn't exist, try environment variables
        if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
          serviceAccount = {
            projectId: config.firebase.projectId,
            clientEmail: config.firebase.clientEmail,
            privateKey: config.firebase.privateKey,
          };
        } else {
          console.warn('⚠️  Firebase credentials not found. Using mock mode.');
          console.warn('   To use real Firebase, either:');
          console.warn('   1. Place serviceAccountKey.json in backend/ directory');
          console.warn('   2. Set FIREBASE_* environment variables in .env');
          return null;
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${config.firebase.projectId || serviceAccount.projectId}.appspot.com`
      });
    }

    db = admin.firestore();
    console.log('✅ Firestore initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize Firestore:', error);
    console.warn('⚠️  Running in mock mode without database');
    return null;
  }
}

export function getFirestore() {
  if (!db) {
    const initialized = initializeFirestore();
    if (!initialized) {
      throw new Error('Firestore not initialized. Please configure Firebase credentials.');
    }
    return initialized;
  }
  return db;
}

export const collections = {
  users: 'users',
  sessions: 'sessions',
  questions: 'questions',
  answers: 'answers',
  evaluations: 'evaluations',
};

export function getStorage() {
  if (!admin.apps.length) {
    initializeFirestore();
  }
  return admin.storage();
}