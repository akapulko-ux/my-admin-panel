import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Функция для определения типа устройства
const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|phone|blackberry|opera mini|windows phone/i.test(userAgent)) {
    return 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

// Функция для определения браузера
const getBrowser = () => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Firefox')) {
    return 'firefox';
  } else if (userAgent.includes('Chrome')) {
    return 'chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'safari';
  } else if (userAgent.includes('Edge')) {
    return 'edge';
  } else if (userAgent.includes('Opera')) {
    return 'opera';
  } else {
    return 'unknown';
  }
};

// Функция для получения реферера
const getReferrer = () => {
  if (document.referrer) {
    try {
      const url = new URL(document.referrer);
      return url.hostname;
    } catch (e) {
      return document.referrer;
    }
  }
  return 'direct';
};

// Функция для получения геолокации (если доступна)
const getGeolocation = async () => {
  try {
    // Через наш бэкенд-прокси, чтобы не ловить CORS и не трогать SW
    const response = await fetch('/api/v1/geo');
    if (!response.ok) return null;
    const data = await response.json();
    return {
      country: data.country || null,
      city: data.city || null,
      region: data.region || null
    };
  } catch (error) {
    console.log('Не удалось получить геолокацию:', error);
    return null;
  }
};

// Функция для отслеживания посещения страницы
export const trackPageVisit = async (pagePath, additionalData = {}) => {
  try {
    // Получаем информацию о пользователе из localStorage или sessionStorage
    let userRole = 'guest';
    let userId = null;
    
    try {
      // Пытаемся получить информацию о пользователе из AuthContext
      const authData = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
      if (authData) {
        const parsed = JSON.parse(authData);
        userRole = parsed.role || 'user';
        userId = parsed.uid || null;
      }
    } catch (e) {
      console.log('Не удалось получить данные пользователя для аналитики');
    }

    // Получаем базовую информацию о посещении
    const visitData = {
      page: pagePath,
      timestamp: serverTimestamp(),
      url: window.location.href,
      title: document.title,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      referrer: getReferrer(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      userAgent: navigator.userAgent,
      userRole,
      userId,
      ...additionalData
    };

    // Пытаемся получить геолокацию
    try {
      const geoData = await getGeolocation();
      if (geoData) {
        visitData.country = geoData.country;
        visitData.city = geoData.city;
        visitData.region = geoData.region;
      }
    } catch (error) {
      console.log('Ошибка при получении геолокации:', error);
    }

    // Генерируем уникальный ID сессии, если его нет
    if (!visitData.sessionId) {
      visitData.sessionId = sessionStorage.getItem('sessionId') || 
                           Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('sessionId', visitData.sessionId);
    }

    // Добавляем запись в Firestore
    await addDoc(collection(db, 'pageVisits'), visitData);
    
    console.log('Посещение страницы отслежено:', visitData);
    
    return visitData;
  } catch (error) {
    console.error('Ошибка при отслеживании посещения страницы:', error);
  }
};

// Функция для отслеживания времени на странице
export const trackTimeOnPage = async (pagePath, startTime) => {
  try {
    const endTime = Date.now();
    const timeOnPage = endTime - startTime;
    
    // Минимальное время для учета (5 секунд)
    if (timeOnPage < 5000) {
      return;
    }

    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      return;
    }

    // Обновляем запись о посещении с временем на странице
    // В реальном приложении здесь нужно найти существующую запись и обновить её
    // Пока просто логируем
    console.log(`Время на странице ${pagePath}: ${timeOnPage}ms`);
    
  } catch (error) {
    console.error('Ошибка при отслеживании времени на странице:', error);
  }
};

// Функция для отслеживания кликов по элементам
export const trackElementClick = async (elementType, elementId, pagePath) => {
  try {
    const clickData = {
      type: 'click',
      elementType,
      elementId,
      page: pagePath,
      timestamp: serverTimestamp(),
      sessionId: sessionStorage.getItem('sessionId'),
      url: window.location.href
    };

    await addDoc(collection(db, 'userInteractions'), clickData);
    
    console.log('Клик отслежен:', clickData);
  } catch (error) {
    console.error('Ошибка при отслеживании клика:', error);
  }
};

// Функция для отслеживания скролла
export const trackScroll = async (pagePath, scrollDepth) => {
  try {
    const scrollData = {
      type: 'scroll',
      page: pagePath,
      scrollDepth,
      timestamp: serverTimestamp(),
      sessionId: sessionStorage.getItem('sessionId'),
      url: window.location.href
    };

    await addDoc(collection(db, 'userInteractions'), scrollData);
    
    console.log('Скролл отслежен:', scrollData);
  } catch (error) {
    console.error('Ошибка при отслеживании скролла:', error);
  }
};

// Функция для инициализации отслеживания на странице
export const initPageTracking = (pagePath) => {
  const startTime = Date.now();
  
  // Отслеживаем посещение страницы
  trackPageVisit(pagePath);
  
  // Отслеживаем время на странице при уходе
  const handleBeforeUnload = () => {
    trackTimeOnPage(pagePath, startTime);
  };
  
  const handleVisibilityChange = () => {
    if (document.hidden) {
      trackTimeOnPage(pagePath, startTime);
    }
  };
  
  // Добавляем обработчики событий
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Возвращаем функцию для очистки
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    trackTimeOnPage(pagePath, startTime);
  };
};

// Функция для отслеживания ошибок
export const trackError = async (error, pagePath) => {
  try {
    const errorData = {
      type: 'error',
      error: error.message || error.toString(),
      stack: error.stack,
      page: pagePath,
      timestamp: serverTimestamp(),
      sessionId: sessionStorage.getItem('sessionId'),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    await addDoc(collection(db, 'errors'), errorData);
    
    console.log('Ошибка отслежена:', errorData);
  } catch (trackingError) {
    console.error('Ошибка при отслеживании ошибки:', trackingError);
  }
};

// Функция для отслеживания авторизации пользователя
export const trackUserAuth = async (pagePath, success, userRole = null, userId = null, errorMessage = null) => {
  try {
    const authData = {
      type: 'auth',
      page: pagePath,
      timestamp: serverTimestamp(),
      sessionId: sessionStorage.getItem('sessionId'),
      url: window.location.href,
      success,
      userRole: userRole || 'unknown',
      userId,
      errorMessage,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      userAgent: navigator.userAgent
    };

    await addDoc(collection(db, 'userAuthLogs'), authData);
    
    console.log('Авторизация отслежена:', authData);
  } catch (error) {
    console.error('Ошибка при отслеживании авторизации:', error);
  }
};

// Функция для отслеживания переходов на страницы объектов
export const trackPropertyVisit = async (propertyId, propertyTitle = null, additionalData = {}) => {
  try {
    const pagePath = `/public/property/${propertyId}`;
    
    // Получаем информацию о пользователе
    let userRole = 'guest';
    let userId = null;
    
    try {
      const authData = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
      if (authData) {
        const parsed = JSON.parse(authData);
        userRole = parsed.role || 'user';
        userId = parsed.uid || null;
      }
    } catch (e) {
      console.log('Не удалось получить данные пользователя для аналитики');
    }

    const propertyVisitData = {
      page: pagePath,
      timestamp: serverTimestamp(),
      url: window.location.href,
      title: propertyTitle || `Объект ${propertyId}`,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      referrer: getReferrer(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      userAgent: navigator.userAgent,
      userRole,
      userId,
      propertyId,
      propertyTitle,
      type: 'property_visit',
      ...additionalData
    };

    await addDoc(collection(db, 'pageVisits'), propertyVisitData);
    
    console.log('Переход на объект отслежен:', propertyVisitData);
  } catch (error) {
    console.error('Ошибка при отслеживании перехода на объект:', error);
  }
};

// Функция для отслеживания производительности
export const trackPerformance = async (pagePath) => {
  try {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      const performanceData = {
        type: 'performance',
        page: pagePath,
        timestamp: serverTimestamp(),
        sessionId: sessionStorage.getItem('sessionId'),
        url: window.location.href,
        loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null,
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || null,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || null
      };

      await addDoc(collection(db, 'performance'), performanceData);
      
      console.log('Производительность отслежена:', performanceData);
    }
  } catch (error) {
    console.error('Ошибка при отслеживании производительности:', error);
  }
};

const pageAnalytics = {
  trackPageVisit,
  trackTimeOnPage,
  trackElementClick,
  trackScroll,
  initPageTracking,
  trackError,
  trackPerformance,
  trackUserAuth,
  trackPropertyVisit
};

export default pageAnalytics;
