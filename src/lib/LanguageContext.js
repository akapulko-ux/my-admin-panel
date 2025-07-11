import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Получаем сохраненный язык из localStorage или используем английский по умолчанию
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    // Если это первое посещение или сохраненный язык не валидный, используем английский
    if (!savedLanguage || !['ru', 'en', 'id'].includes(savedLanguage)) {
      return 'en';
    }
    return savedLanguage;
  });

  // При изменении языка сохраняем его в localStorage
  useEffect(() => {
    localStorage.setItem('selectedLanguage', language);
  }, [language]);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
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