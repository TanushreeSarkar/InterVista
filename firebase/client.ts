// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQQnecij4HUk7wacQmUUd65XObmSk_S7E",
  authDomain: "intervista-21fe1.firebaseapp.com",
  projectId: "intervista-21fe1",
  storageBucket: "intervista-21fe1.firebasestorage.app",
  messagingSenderId: "765412099147",
  appId: "1:765412099147:web:d3f34db5c14c07edc7f9ce",
  measurementId: "G-6W957S14H4",
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
