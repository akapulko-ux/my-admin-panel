import toast from 'react-hot-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from '../firebaseConfig';

export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  });
};

export const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
  });
};

export const showInfo = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
  });
};

const functions = getFunctions(app);

/**
 * Отправляет пуш-уведомление от премиум застройщика
 * @param {Object} notificationData - Данные уведомления
 * @param {string} notificationData.title - Заголовок уведомления
 * @param {string} notificationData.body - Текст уведомления
 * @param {string} notificationData.targetAudience - Целевая аудитория ('all_users', 'complex_interested')
 * @param {Array} notificationData.complexIds - Массив ID комплексов (для targetAudience = 'complex_interested')
 * @returns {Promise<Object>} Результат отправки
 */
export const sendDeveloperNotification = async (notificationData) => {
  // Проверяем авторизацию перед вызовом
  const currentUser = auth.currentUser;
  console.log('🔐 Current user before sendDeveloperNotification:', currentUser ? currentUser.uid : 'NOT AUTHENTICATED');
  
  if (!currentUser) {
    throw new Error('Пользователь не авторизован. Пожалуйста, войдите в систему.');
  }

  const sendNotification = httpsCallable(functions, 'sendDeveloperNotification');
  
  try {
    console.log('📤 Sending notification data:', notificationData);
    const result = await sendNotification(notificationData);
    console.log('✅ Notification sent successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error sending developer notification:', error);
    throw new Error(error.message || 'Ошибка при отправке уведомления');
  }
};

/**
 * Получает историю отправленных уведомлений
 * @param {number} limit - Количество записей для получения
 * @returns {Promise<Array>} Массив отправленных уведомлений
 */
export const getDeveloperNotificationHistory = async (limit = 20) => {
  // Проверяем авторизацию перед вызовом
  const currentUser = auth.currentUser;
  console.log('🔐 Current user before getDeveloperNotificationHistory:', currentUser ? currentUser.uid : 'NOT AUTHENTICATED');
  
  if (!currentUser) {
    throw new Error('Пользователь не авторизован. Пожалуйста, войдите в систему.');
  }

  const getHistory = httpsCallable(functions, 'getDeveloperNotificationHistory');
  
  try {
    const result = await getHistory({ limit });
    return result.data.history;
  } catch (error) {
    console.error('❌ Error getting notification history:', error);
    throw new Error(error.message || 'Ошибка при получении истории');
  }
};

/**
 * Получает статистику уведомлений
 * @returns {Promise<Object>} Статистика уведомлений
 */
export const getDeveloperNotificationStats = async () => {
  // Проверяем авторизацию перед вызовом
  const currentUser = auth.currentUser;
  console.log('🔐 Current user before getDeveloperNotificationStats:', currentUser ? currentUser.uid : 'NOT AUTHENTICATED');
  
  if (!currentUser) {
    throw new Error('Пользователь не авторизован. Пожалуйста, войдите в систему.');
  }

  const getStats = httpsCallable(functions, 'getDeveloperNotificationStats');
  
  try {
    const result = await getStats();
    return result.data.stats;
  } catch (error) {
    console.error('❌ Error getting notification stats:', error);
    throw new Error(error.message || 'Ошибка при получении статистики');
  }
};

/**
 * Валидирует данные уведомления
 * @param {string} title - Заголовок уведомления
 * @param {string} body - Текст уведомления
 * @returns {Object} Объект с результатом валидации
 */
export const validateNotificationData = (title, body) => {
  const errors = {};
  
  if (!title || title.trim().length === 0) {
    errors.title = 'Заголовок обязателен';
  } else if (title.trim().length < 3) {
    errors.title = 'Заголовок слишком короткий (минимум 3 символа)';
  } else if (title.length > 100) {
    errors.title = 'Заголовок не должен превышать 100 символов';
  }
  
  if (!body || body.trim().length === 0) {
    errors.body = 'Текст сообщения обязателен';
  } else if (body.trim().length < 10) {
    errors.body = 'Текст сообщения слишком короткий (минимум 10 символов)';
  } else if (body.length > 500) {
    errors.body = 'Текст сообщения не должен превышать 500 символов';
  }

  // Проверка на спам-контент только если есть текст
  const spamKeywords = ['кредит', 'займ', 'бесплатно', 'срочно', 'успей', 'акция заканчивается', 'только сегодня'];
  let spamFound = [];
  
  if (title && body) {
    const lowerTitle = title.toLowerCase();
    const lowerBody = body.toLowerCase();
    
    spamFound = spamKeywords.filter(keyword => 
      lowerTitle.includes(keyword) || lowerBody.includes(keyword)
    );
  }

  if (spamFound.length > 0) {
    errors.spam = `Обнаружены подозрительные слова: ${spamFound.join(', ')}. Это может привести к блокировке уведомления.`;
  }

  return {
    isValid: Object.keys(errors).filter(key => key !== 'spam').length === 0,
    errors,
    warnings: spamFound.length > 0 ? [errors.spam] : []
  };
};

/**
 * Форматирует дату для отображения
 * @param {Date|string} date - Дата для форматирования
 * @returns {string} Отформатированная дата
 */
export const formatNotificationDate = (date) => {
  if (!date) return 'Не указано';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Получает цвет статуса для уведомления
 * @param {number} successCount - Количество успешных отправок
 * @param {number} totalCount - Общее количество получателей
 * @returns {string} CSS класс цвета
 */
export const getNotificationStatusColor = (successCount, totalCount) => {
  if (successCount === 0) return 'text-red-600';
  if (successCount === totalCount) return 'text-green-600';
  return 'text-yellow-600';
};

/**
 * Получает текст статуса для уведомления
 * @param {number} successCount - Количество успешных отправок
 * @param {number} totalCount - Общее количество получателей
 * @returns {string} Текст статуса
 */
export const getNotificationStatusText = (successCount, totalCount) => {
  if (successCount === 0) return 'Не доставлено';
  if (successCount === totalCount) return 'Доставлено всем';
  return `Доставлено ${successCount} из ${totalCount}`;
}; 