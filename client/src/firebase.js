// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <-- ADD THIS LINE

const firebaseConfig = {
  apiKey: "AIzaSyAF3aclDOp5dG1qmodOoAH2KXY-3MygA-I",
  authDomain: "pillars-e65ea.firebaseapp.com",
  projectId: "pillars-e65ea",
  storageBucket: "pillars-e65ea.firebasestorage.app",
  messagingSenderId: "623815656845",
  appId: "1:623815656845:web:7a45fc5152f69a33d169c4",
  measurementId: "G-411Z2M2ZV8",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app); // <-- EXPORT THIS TOO
