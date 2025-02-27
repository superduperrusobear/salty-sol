import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDHFfPapaG4eVX2BOAs1_64Nr8hHYvZ5_A",
  authDomain: "ssv2-b0b8e.firebaseapp.com",
  databaseURL: "https://ssv2-b0b8e-default-rtdb.firebaseio.com",
  projectId: "ssv2-b0b8e",
  storageBucket: "ssv2-b0b8e.firebasestorage.app",
  messagingSenderId: "822608175177",
  appId: "1:822608175177:web:9a92591a1cef783aabdf98"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
const auth = getAuth(app);

// Handle anonymous auth
if (typeof window !== 'undefined') {
  // Listen for auth state changes
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // If no user, sign in anonymously
      signInAnonymously(auth)
        .then(() => {
          console.log('Anonymous auth successful');
        })
        .catch((error) => {
          console.error('Anonymous auth error:', error);
        });
    }
  });
}

export { db, auth }; 