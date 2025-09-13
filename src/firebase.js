// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// CONFIGURACIÓN DE FIREBASE - Funciona tanto en desarrollo como producción
const firebaseConfig = {
  apiKey: "AIzaSyDaLuu1AsVufQlTqrg4-U-0yyywbM7Z3KU",
  authDomain: "task-manager-app-50304.firebaseapp.com",
  projectId: "task-manager-app-50304",
  storageBucket: "task-manager-app-50304.firebasestorage.app",
  messagingSenderId: "402953480828",
  appId: "1:402953480828:web:e70354498f898ca0b0b7f9"
};

// LOGGING PARA DEBUG
console.log('🔥 Firebase Config Loading...');
console.log('🌍 Environment:', typeof window !== 'undefined' ? 'browser' : 'server');
console.log('📋 Project ID:', firebaseConfig.projectId);
console.log('🔗 Auth Domain:', firebaseConfig.authDomain);
console.log('🔑 API Key presente:', !!firebaseConfig.apiKey);
console.log('📦 Storage Bucket:', firebaseConfig.storageBucket);

let app, db, auth;

try {
  // Inicializar Firebase
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App inicializada correctamente');

  // Inicializar Firestore
  db = getFirestore(app);
  console.log('✅ Firestore inicializado correctamente');

  // Inicializar Auth
  auth = getAuth(app);
  console.log('✅ Auth inicializado correctamente');

  console.log('🎉 Firebase configurado y funcionando correctamente!');
} catch (error) {
  console.error('❌ Error crítico inicializando Firebase:', error);
  console.error('🔍 Detalles del error:', {
    code: error.code,
    message: error.message,
    config: firebaseConfig
  });
  throw error;
}

export { db, auth };
export default app;