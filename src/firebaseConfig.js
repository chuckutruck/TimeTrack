// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLezJUZMmeLllsdEPCUVkDBKwwR6OuoD8",
  authDomain: "userbase-5061c.firebaseapp.com",
  databaseURL: "https://userbase-5061c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "userbase-5061c",
  storageBucket: "userbase-5061c.firebasestorage.app",
  messagingSenderId: "414829360217",
  appId: "1:414829360217:web:21d0839ee0ccfbea336d48"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;