// ============================================================
// CONFIGURAÇÃO DE API KEYS - ARQUIVO DE EXEMPLO
// ============================================================
// 
// IMPORTANTE: Este é um arquivo de exemplo.
// Crie um arquivo config.js com suas chaves reais.
// Adicione config.js ao .gitignore para não commitar suas chaves.
//
// Para GitHub Pages (client-side):
// - Não é possível esconder completamente as chaves
// - MAS você pode restringir as chaves nos serviços:
//   1. Firebase: Configure restrições de domínio no Console
//   2. OpenWeatherMap: Configure HTTP referrer restrictions
//
// ============================================================

// Firebase Configuration
export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.region.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// OpenWeatherMap API Key
export const WEATHER_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';

