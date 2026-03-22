import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1c7ndxGshXirW_7YlhdXCEznUC8BqoVg",
  authDomain: "de-la-matriz---online.firebaseapp.com",
  projectId: "de-la-matriz---online",
  storageBucket: "de-la-matriz---online.firebasestorage.app",
  messagingSenderId: "46635134318",
  appId: "1:46635134318:web:78dc29ec595adbece9657f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
