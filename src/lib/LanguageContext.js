import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  console.log('🌐 LanguageProvider инициализирован');
  
  // Получаем сохраненный язык из localStorage или используем английский по умолчанию
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    console.log('💾 Язык из localStorage:', savedLanguage);
    // Если это первое посещение или сохраненный язык не валидный, используем английский
    if (!savedLanguage || !['ru', 'en', 'id'].includes(savedLanguage)) {
      console.log('🔄 Используется язык по умолчанию: en');
      return 'en';
    }
    console.log('✅ Используется сохраненный язык:', savedLanguage);
    return savedLanguage;
  });

  const [currentUser, setCurrentUser] = useState(null);

  // Отслеживаем состояние авторизации
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔑 Auth state changed:', user ? `Пользователь: ${user.uid}` : 'Пользователь не авторизован');
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // При изменении языка сохраняем его в localStorage
  useEffect(() => {
    localStorage.setItem('selectedLanguage', language);
  }, [language]);

  const changeLanguage = async (newLanguage, userId = null) => {
    console.log('🔄 changeLanguage вызван:', { newLanguage, userId, currentUserUid: currentUser?.uid });
    
    setLanguage(newLanguage);
    
    // Автоматически получаем userId если пользователь авторизован
    const userIdToUse = userId || currentUser?.uid;
    
    console.log('👤 Используемый userId:', userIdToUse);
    
    // Обновляем язык в базе данных, если пользователь авторизован
    if (userIdToUse) {
      try {
        console.log('📝 Попытка обновления документа пользователя...');
        const userRef = doc(db, 'users', userIdToUse);
        await updateDoc(userRef, {
          language: newLanguage,
          languageUpdated: serverTimestamp()
        });
        console.log(`✅ Язык пользователя ${userIdToUse} обновлен на ${newLanguage}`);
      } catch (error) {
        console.error('❌ Ошибка при обновлении языка пользователя:', error);
        console.error('❌ Детали ошибки:', error.message);
      }
    } else {
      console.warn('⚠️ Пользователь не авторизован, язык не сохранен в базе данных');
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 