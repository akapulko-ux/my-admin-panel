import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

// Определение ролей и их алиасов
const ROLES = {
  admin: ['admin', 'administrator', 'администратор'],
  moderator: ['moderator', 'модератор', 'mod'],
  'premium agent': ['premium_agent', 'premium agent', 'премиум агент', 'премиум-агент', 'premium'],
  agent: ['agent', 'агент'],
  user: ['user', 'пользователь', ''],
  застройщик: ['застройщик', 'премиум застройщик'],
  closed: ['closed', 'закрытый аккаунт', 'закрытый', 'заблокированный']
};

// Функция для нормализации роли
function normalizeRole(role) {
  if (!role) return 'user';
  
  const normalizedRole = role.toLowerCase().trim();
  
  // Ищем соответствие в алиасах
  for (const [roleKey, aliases] of Object.entries(ROLES)) {
    if (aliases.includes(normalizedRole)) {
      return roleKey;
    }
  }
  
  console.warn(`Неизвестная роль "${role}" будет заменена на "user"`);
  return 'user';
}

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
          const rawRole = snap.data().role || "agent";
          const normalizedRoleValue = normalizeRole(rawRole);
          setRole(normalizedRoleValue);
          console.log(`Role normalized: "${rawRole}" -> "${normalizedRoleValue}"`);
        } else {
          // Если документ пользователя не существует, создаем его с ролью agent
          try {
            const userData = {
              email: user.email,
              role: "agent",
              createdAt: new Date(),
              uid: user.uid,
              displayName: user.displayName || '',
              name: user.displayName || '',
              language: localStorage.getItem('selectedLanguage') || 'ru'
            };
            await setDoc(docRef, userData);
          setRole("agent");
            console.log("Создан новый документ пользователя с ролью agent");
          } catch (error) {
            console.error("Ошибка создания документа пользователя:", error);
            setRole("agent"); // Используем роль по умолчанию даже если создание не удалось
          }
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
      // Получаем роль пользователя сразу после входа
      const docRef = doc(db, "users", userCredential.user.uid);
      const snap = await getDoc(docRef);
      let userRole = "agent";
      
      if (snap.exists()) {
        const rawRole = snap.data().role || "agent";
        userRole = normalizeRole(rawRole);
        console.log(`Login - Role normalized: "${rawRole}" -> "${userRole}"`);
      } else {
        // Если документ пользователя не существует, создаем его с ролью agent
        try {
          const userData = {
            email: userCredential.user.email,
            role: "agent",
            createdAt: new Date(),
            uid: userCredential.user.uid,
            displayName: userCredential.user.displayName || '',
            name: userCredential.user.displayName || '',
            language: localStorage.getItem('selectedLanguage') || 'ru'
          };
          await setDoc(docRef, userData);
          console.log("Создан новый документ пользователя с ролью agent");
        } catch (error) {
          console.error("Ошибка создания документа пользователя:", error);
        }
      }
      
      return { userCredential, role: userRole };
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