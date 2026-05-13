// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6F9jcnCFNjTIgrR9PVmTkyQD8e8q8eOg",
  authDomain: "tvillingeapp.firebaseapp.com",
  projectId: "tvillingeapp",
  storageBucket: "tvillingeapp.firebasestorage.app",
  messagingSenderId: "48267119661",
  appId: "1:48267119661:web:ddfbfb62d93457b3013ca4",
  measurementId: "G-G08YRV8142"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);