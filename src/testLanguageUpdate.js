import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Тестовая функция для проверки обновления языка
export const testLanguageUpdate = async (userId, newLanguage) => {
  console.log('🧪 Тестирование обновления языка:', { userId, newLanguage });
  
  try {
    const userRef = doc(db, 'users', userId);
    console.log('📁 Создана ссылка на документ:', userRef.path);
    
    const updateData = {
      language: newLanguage,
      languageUpdated: serverTimestamp(),
      testUpdate: true
    };
    
    console.log('📝 Данные для обновления:', updateData);
    
    await updateDoc(userRef, updateData);
    
    console.log('✅ Тестовое обновление успешно завершено');
    return true;
  } catch (error) {
    console.error('❌ Ошибка тестового обновления:', error);
    console.error('❌ Код ошибки:', error.code);
    console.error('❌ Сообщение ошибки:', error.message);
    return false;
  }
};

// Добавляем функцию в глобальную область видимости для тестирования
if (typeof window !== 'undefined') {
  window.testLanguageUpdate = testLanguageUpdate;
} 