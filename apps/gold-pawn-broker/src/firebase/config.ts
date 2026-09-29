import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyDnKB9cZX9kndB4QrT0VJi2sbj5mUQ45So",
  authDomain: "nexus-gold-erp.firebaseapp.com",
  projectId: "nexus-gold-erp",
  storageBucket: "nexus-gold-erp.firebasestorage.app",
  messagingSenderId: "882576651805",
  appId: "1:882576651805:web:08446a4fca9801be2438f4"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
