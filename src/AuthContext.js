import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null); // "admin", "moderator", "agent", etc.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Предполагаем, что в коллекции users документ с id равен uid содержит поле role
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setRole(snap.data().role || "agent");
        } else {
          setRole("agent");
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error("Ошибка входа:", error);
      if (error.code === "auth/invalid-credential") {
        throw new Error("Неверный email или пароль");
      } else if (error.code === "auth/user-not-found") {
        throw new Error("Пользователь не найден");
      } else if (error.code === "auth/wrong-password") {
        throw new Error("Неверный пароль");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Неверный формат email");
      } else {
        throw new Error("Ошибка входа: " + error.message);
      }
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ currentUser, role, login, logout, loading }}>
      {!loading ? children : <div>Загрузка...</div>}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}