import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Para la base de datos [2]
import { getAuth } from "firebase/auth";           // Para el sistema de roles [3]

// Tus credenciales privadas de la consola de Firebase
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

// Inicializamos la aplicación
const app = initializeApp(firebaseConfig);

// INSTRUCCIÓN PRECISA: Exportación de los motores de datos y seguridad
export const db = getFirestore(app);  // Permite acceder a Estudios, Usuarios y Casos [2]
export const auth = getAuth(app);    // Permite gestionar el login y la Matriz de Acceso [3]