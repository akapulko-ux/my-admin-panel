// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMxOXvkuF3ahYG5f2Qfmh717VRn2aSZRg",
  authDomain: "bali-estate-1130f.firebaseapp.com",
  projectId: "bali-estate-1130f",
  storageBucket: "bali-estate-1130f.appspot.com",
  messagingSenderId: "794245545645",
  appId: "1:794245545645:ios:d9abd3ac5e8a0452bbd024"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);