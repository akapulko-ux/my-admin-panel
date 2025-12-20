import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

// ⚠️ КРИТИЧЕСКИ ВАЖНО: НЕ ИЗМЕНЯТЬ ЭТИ РОЛИ! ⚠️
// "застройщик" и "премиум застройщик" - ЭТО РАЗНЫЕ РОЛИ!
// "премиум застройщик" имеет доступ к уведомлениям и публичным страницам
// "застройщик" НЕ имеет доступа к этим функциям
// НИКОГДА НЕ ОБЪЕДИНЯТЬ ИХ В ОДНУ РОЛЬ!

const ROLES = {
  admin: ['admin', 'administrator', 'администратор'],
  moderator: ['moderator', 'mod'],
  'premium agent': ['premium_agent', 'premium agent', 'премиум агент', 'премиум-агент', 'premium'],
  agent: ['agent', 'агент'],
  user: ['user', 'пользователь', ''],
  
  // ⚠️ ВНИМАНИЕ: ЭТИ ДВЕ РОЛИ ДОЛЖНЫ БЫТЬ РАЗДЕЛЬНЫМИ! ⚠️
  застройщик: ['застройщик'], // Обычный застройщик БЕЗ премиум функций
  'премиум застройщик': ['премиум застройщик'], // Премиум застройщик С доступом к уведомлениям
  // ⚠️ НЕ ДОБАВЛЯТЬ 'премиум застройщик' в массив 'застройщик'! ⚠️
  
  closed: ['closed', 'закрытый аккаунт', 'закрытый', 'заблокированный']
};

// ⚠️ КОНСТАНТЫ ДЛЯ КРИТИЧЕСКИ ВАЖНЫХ РОЛЕЙ - НЕ ИЗМЕНЯТЬ! ⚠️
const DEVELOPER_ROLE = 'застройщик';
const PREMIUM_DEVELOPER_ROLE = 'премиум застройщик';

// ⚠️ ФУНКЦИЯ ВАЛИДАЦИИ РОЛЕЙ - ЗАЩИТА ОТ ОШИБОК ⚠️
function validateRolesIntegrity() {
  const developerAliases = ROLES[DEVELOPER_ROLE];
  const premiumDeveloperAliases = ROLES[PREMIUM_DEVELOPER_ROLE];
  
  // Проверяем что роли не смешаны
  if (developerAliases.includes(PREMIUM_DEVELOPER_ROLE)) {
    console.error('🚨 КРИТИЧЕСКАЯ ОШИБКА: "премиум застройщик" найден в алиасах "застройщик"!');
    console.error('🚨 ЭТО СЛОМАЕТ ДОСТУП К УВЕДОМЛЕНИЯМ!');
    throw new Error('РОЛИ ЗАСТРОЙЩИКОВ НАРУШЕНЫ! Исправьте AuthContext.js');
  }
  
  if (premiumDeveloperAliases.includes(DEVELOPER_ROLE)) {
    console.error('🚨 КРИТИЧЕСКАЯ ОШИБКА: "застройщик" найден в алиасах "премиум застройщик"!');
    throw new Error('РОЛИ ЗАСТРОЙЩИКОВ НАРУШЕНЫ! Исправьте AuthContext.js');
  }
  
  // Валидация ролей пройдена успешно
}

// Запускаем валидацию при загрузке модуля
validateRolesIntegrity();

// Функция для нормализации роли
function normalizeRole(role) {
  if (!role) return 'user';
  
  const normalizedRole = role.toLowerCase().trim();
  
  // ⚠️ КРИТИЧЕСКИЙ CHECK: Проверяем что роли застройщиков разделены
  if (normalizedRole === 'премиум застройщик') {
    return 'премиум застройщик';
  }
  if (normalizedRole === 'застройщик') {
    return 'застройщик';
  }
  
  // Ищем соответствие в алиасах
  for (const [roleKey, aliases] of Object.entries(ROLES)) {
    if (aliases.includes(normalizedRole)) {
      return roleKey;
    }
  }
  
  console.warn(`Неизвестная роль "${role}" будет заменена на "user"`);
  return 'user';
}

// ⚠️ ФУНКЦИИ-ПОМОЩНИКИ ДЛЯ БЕЗОПАСНОЙ ПРОВЕРКИ РОЛЕЙ ⚠️
// Используйте эти функции вместо прямого сравнения строк!

export const isDeveloper = (role) => role === DEVELOPER_ROLE;
export const isPremiumDeveloper = (role) => role === PREMIUM_DEVELOPER_ROLE;
export const isAnyDeveloper = (role) => isDeveloper(role) || isPremiumDeveloper(role);

// Константы для использования в других компонентах
export const ROLE_NAMES = {
  DEVELOPER: DEVELOPER_ROLE,
  PREMIUM_DEVELOPER: PREMIUM_DEVELOPER_ROLE,
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  AGENT: 'agent',
  PREMIUM_AGENT: 'premium agent',
  USER: 'user',
  CLOSED: 'closed'
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null); // "admin", "moderator", "agent", etc.
  const [loading, setLoading] = useState(true);

  // Функция отладки ролей удалена для чистоты консоли

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
    <AuthContext.Provider value={{ currentUser, role, login, logout, loading, register: async (email, password, name, phoneCode, phone, status) => {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        try { await updateProfile(userCred.user, { displayName: name }); } catch {}
      }
      const userDocRef = doc(db, "users", userCred.user.uid);
      const safeName = name || userCred.user.displayName || '';
      const selectedLanguage = localStorage.getItem('selectedLanguage') || 'ru';
      const phoneCodeSafe = typeof phoneCode === 'string' ? phoneCode.trim() : '';
      const phoneRaw = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
      const statusValue = typeof status === 'string' ? status : '';
      await setDoc(userDocRef, {
        uid: userCred.user.uid,
        email: userCred.user.email,
        role: "agent",
        createdAt: new Date(),
        displayName: safeName,
        name: safeName,
        language: selectedLanguage,
        phoneCode: phoneCodeSafe,
        phone: phoneRaw,
        status: statusValue
      }, { merge: true });
      setRole('agent');
      return userCred;
    } }}>
      {!loading ? children : (
        <div className="fixed top-2 left-2 z-50">
          <div className="animate-spin h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent" />
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}