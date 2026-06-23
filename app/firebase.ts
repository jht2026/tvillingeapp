import { getApps, initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD6F9jcnCFNjTIgrR9PVmTkyQD8e8q8eOg",
  authDomain: "tvillingeapp.firebaseapp.com",
  projectId: "tvillingeapp",
  storageBucket: "tvillingeapp.firebasestorage.app",
  messagingSenderId: "48267119661",
  appId: "1:48267119661:web:ddfbfb62d93457b3013ca4",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});