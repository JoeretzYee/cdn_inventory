// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  where,
  query,
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGMmqIJvKcZNoUZE1XtaPPyWN5SXV4qwE",
  authDomain: "cdn-inventory-25c95.firebaseapp.com",
  projectId: "cdn-inventory-25c95",
  storageBucket: "cdn-inventory-25c95.firebasestorage.app",
  messagingSenderId: "890103998873",
  appId: "1:890103998873:web:61ae2a43b735a08bbd8b08",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  deleteDoc,
  where,
  updateDoc,
  query,
};
