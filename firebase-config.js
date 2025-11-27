// Firebase Configuration - Firebase 8.10.1
console.log('🔥 Inicializando Firebase v8...');

const firebaseConfig = {
  apiKey: "AIzaSyDOb5qp9VEqiMtKGHDGBK4JwAi2M_KkH6Q",
  authDomain: "lidermaneu.firebaseapp.com",
  projectId: "lidermaneu",
  storageBucket: "lidermaneu.firebasestorage.app",
  messagingSenderId: "84620702148",
  appId: "1:84620702148:web:5918014d3e6e954c093491",
  measurementId: "G-B56ML25QD3"
};

// Global variables
window.auth = null;
window.db = null;
window.firebaseReady = false;

// Initialize Firebase - usando sintaxis Firebase 8
const initFirebase = () => {
  console.log('🔍 Buscando Firebase SDK v8...');
  
  if (typeof firebase === 'undefined') {
    console.warn('⏳ Firebase SDK aún no está cargado, reintentando...');
    setTimeout(initFirebase, 100);
    return;
  }
  
  console.log('✅ Firebase SDK v8 encontrado');
  
  try {
    // Initialize Firebase app
    if (!firebase.apps || firebase.apps.length === 0) {
      console.log('⚙️ Inicializando Firebase app...');
      firebase.initializeApp(firebaseConfig);
    } else {
      console.log('✅ Firebase ya estaba inicializado');
    }
    
    // Get Firebase services (Firebase 8 syntax)
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    window.firebaseReady = true;
    
    console.log('✅ Firebase v8 inicializado correctamente');
    console.log('   ✓ Auth disponible:', !!window.auth);
    console.log('   ✓ Firestore disponible:', !!window.db);
    
    // Trigger auth module initialization
    if (window.authModuleInit) {
      console.log('🚀 Iniciando módulo de autenticación');
      window.authModuleInit();
    }
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    setTimeout(initFirebase, 500);
  }
};

// Start initialization
console.log('⏳ Esperando Firebase SDK v8...');
setTimeout(initFirebase, 100);
