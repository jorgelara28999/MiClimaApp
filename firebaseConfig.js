// 1. IMPORTA las funciones que necesitas
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 2. TU CONFIGURACIÓN (esto es lo que pegaste y está perfecto)
const firebaseConfig = {
  apiKey: "AIzaSyCPq-ondBFwkb7c3_VymGMbKMicmNMK_R0", // (No te preocupes por ocultar esto, es normal)
  authDomain: "mi-clima-app-f0f8f.firebaseapp.com",
  projectId: "mi-clima-app-f0f8f",
  storageBucket: "mi-clima-app-f0f8f.appspot.com",
  messagingSenderId: "544669552869",
  appId: "1:544669552869:web:be7ca4e3415e93a41c40c",
  measurementId: "G-RRHY4B5T80"
};

// 3. INICIALIZA Firebase
const app = initializeApp(firebaseConfig);

// 4. EXPORTA los servicios que SÍ VAMOS A USAR
// Esto es lo más importante que faltaba
export const auth = getAuth(app);
export const db = getFirestore(app);