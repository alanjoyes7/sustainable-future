import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDQRHB2bzsGSkU0n6a__awVIo21p-X93uY',
  authDomain: 'the-biome.firebaseapp.com',
  projectId: 'the-biome',
  storageBucket: 'the-biome.firebasestorage.app',
  messagingSenderId: '313680272624',
  appId: '1:313680272624:web:2bd26373ba8c79fce5f635',
  measurementId: 'G-4HSZ2E23R7',
};

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  console.log('Firebase initialized successfully');
  console.log('Auth:', auth);
} catch (error) {
  console.error('Firebase initialization error:', error);
}
