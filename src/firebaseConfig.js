// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCMxOXvkuF3ahYG5f2Qfmh717VRn2aSZRg",
  authDomain: "bali-estate-1130f.firebaseapp.com",
  projectId: "bali-estate-1130f",
  storageBucket: "bali-estate-1130f.appspot.com",
  messagingSenderId: "794245545645",
  appId: "1:794245545645:web:d9abd3ac5e8a0452bbd024"
};

// 🔥 Инициализация Firebase App
const app = initializeApp(firebaseConfig);

// 🔥 Firestore & Auth
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

// ✅ Экспорт
export { app, db, auth, functions };