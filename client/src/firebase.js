// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// your firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAF3aclDOp5dG1qmodOoAH2KXY-3MygA-I",
  authDomain: "pillars-e65ea.firebaseapp.com",
  projectId: "pillars-e65ea",
  storageBucket: "pillars-e65ea.firebasestorage.app",
  messagingSenderId: "623815656845",
  appId: "1:623815656845:web:7a45fc5152f69a33d169c4",
  measurementId: "G-411Z2M2ZV8",
};

// init firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// auth helpers to keep all firebase/auth in firebase.js
export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const listenToAuth = (callback) =>
  onAuthStateChanged(auth, callback);