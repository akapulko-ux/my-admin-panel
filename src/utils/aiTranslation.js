// Утилита для автоматического перевода текста с помощью ИИ
// Использует Firebase Functions для безопасного перевода

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

// Инициализируем Firebase Functions
const functions = getFunctions(getApp());
const translateTextFunction = httpsCallable(functions, 'translateText');

// URL для HTTP endpoint
const TRANSLATE_HTTP_URL = 'https://us-central1-bali-estate-1130f.cloudfunctions.net/translateTextHttp';

/**
 * Переводит текст с помощью Firebase Function
 * @param {string} text - текст для перевода
 * @param {string} targetLanguage - целевой язык
 * @returns {Promise<string>} - переведенный текст
 */
export const translateWithFirebase = async (text, targetLanguage) => {
  if (!text || !targetLanguage) {
    return text;
  }

  try {
    console.log(`🔄 Calling Firebase Function for translation to ${targetLanguage}`);
    
    // Используем HTTP endpoint вместо Callable function
    const response = await fetch(TRANSLATE_HTTP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const { success, translatedText } = result;
    
    if (success && translatedText) {
      console.log(`✅ Translation completed: ${targetLanguage}`);
      return translatedText;
    } else {
      console.warn('⚠️ Translation returned no result, using original text');
      return text;
    }
  } catch (error) {
    console.error('❌ Firebase Function translation error:', error);
    return text;
  }
};

/**
 * Кэш для переводов (чтобы не переводить один и тот же текст повторно)
 */
const translationCache = new Map();

/**
 * Переводит текст с кэшированием
 * @param {string} text - текст для перевода
 * @param {string} targetLanguage - целевой язык
 * @returns {Promise<string>} - переведенный текст
 */
export const translateWithCache = async (text, targetLanguage) => {
  if (!text || !targetLanguage) {
    return text;
  }

  // Создаем ключ кэша
  const cacheKey = `${text}_${targetLanguage}`;
  
  // Проверяем кэш
  if (translationCache.has(cacheKey)) {
    console.log(`📋 Using cached translation for ${targetLanguage}`);
    return translationCache.get(cacheKey);
  }

  // Выполняем перевод через Firebase Function
  const translatedText = await translateWithFirebase(text, targetLanguage);
  
  // Сохраняем в кэш
  translationCache.set(cacheKey, translatedText);
  
  return translatedText;
};

// Экспортируем старые функции для обратной совместимости
export const detectLanguage = async (text) => {
  console.warn('detectLanguage is deprecated, use translateWithCache instead');
  return null;
};

export const translateText = async (text, targetLanguage, sourceLanguage = null) => {
  console.warn('translateText is deprecated, use translateWithCache instead');
  return await translateWithCache(text, targetLanguage);
};

export const autoTranslate = async (text, targetLanguage) => {
  console.warn('autoTranslate is deprecated, use translateWithCache instead');
  return await translateWithCache(text, targetLanguage);
};
