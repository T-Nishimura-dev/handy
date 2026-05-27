import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA20vpYiJk6SOepI7OzMzgmmmDIlUUXdg",
  authDomain: "nari-chan.firebaseapp.com",
  projectId: "nari-chan",
  storageBucket: "nari-chan.firebasestorage.app",
  messagingSenderId: "717439205914",
  appId: "1:717439205914:web:2c3f9ef5596c72b97f07a3",
  measurementId: "G-BHVY900BF7",
  databaseURL: "https://nari-chan-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
