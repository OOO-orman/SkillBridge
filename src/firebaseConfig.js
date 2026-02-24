import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxkOP-qgwpL0FzDGJhtn9Zn6fTPgs2U_g",
  authDomain: "skillbridge-a35e0.firebaseapp.com",
  projectId: "skillbridge-a35e0",
  storageBucket: "skillbridge-a35e0.firebasestorage.app",
  messagingSenderId: "167378450594",
  appId: "1:167378450594:web:e4cdfc8721945fcf71bffb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);    