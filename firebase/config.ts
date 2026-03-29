import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA1c7ndxGshXirW_7YlhdXCEznUC8BqoVg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "de-la-matriz---online.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "de-la-matriz---online",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "de-la-matriz---online.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "46635134318",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:46635134318:web:78dc29ec595adbece9657f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;