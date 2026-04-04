import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config();

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
});

const db = admin.firestore();

// Test query — same as authController does for signin
db.collection('users').where('email', '==', 'test@test.com').get()
    .then((snap) => console.log('✅ Query works! Docs found:', snap.size))
    .catch(err => console.error('❌ Query failed:', err.message));