import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuZiuSEN_d_Ya0LgU1X3AsVGGRmYqjto8",
  authDomain: "unity-grade.firebaseapp.com",
  projectId: "unity-grade",
  storageBucket: "unity-grade.firebasestorage.app",
  messagingSenderId: "667407656633",
  appId: "1:667407656633:web:c628aa289fac51547b9d68",
  measurementId: "G-TLKPB5BJBC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
