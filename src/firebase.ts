import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9X43RJOgX_RfUJcsAkABoQvBrFi7TeQA",
  authDomain: "ticketbrokerbyhacktes.firebaseapp.com",
  projectId: "ticketbrokerbyhacktes",
  storageBucket: "ticketbrokerbyhacktes.firebasestorage.app",
  messagingSenderId: "474184859050",
  appId: "1:474184859050:web:ae478de877d85e85b33fd3",
  measurementId: "G-P7NE8MN72Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
