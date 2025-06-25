import React, { createContext, useContext, useState, useCallback } from 'react';
import { db } from "./firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const CacheContext = createContext();

export function CacheProvider({ children }) {
  const [propertiesCache, setPropertiesCache] = useState({
    list: null,
    details: {} // { id: { data, timestamp } }
  });

  // Время жизни кеша (5 минут)
  const CACHE_TTL = 5 * 60 * 1000;

  // Проверка актуальности кеша
  const isCacheValid = useCallback((timestamp) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
  }, [CACHE_TTL]);

  // Получение списка объектов с учетом кеша
  const getPropertiesList = useCallback(async () => {
    // Проверяем кеш списка
    if (propertiesCache.list?.data && isCacheValid(propertiesCache.list.timestamp)) {
      return propertiesCache.list.data;
    }

    // Загружаем новые данные
    const snapshot = await getDocs(collection(db, "properties"));
    const data = snapshot.docs.map(doc => {
      const docData = { id: doc.id, ...doc.data() };
      
      // Сохраняем детали объекта в кеш
      setPropertiesCache(prev => ({
        ...prev,
        details: {
          ...prev.details,
          [doc.id]: {
            data: docData,
            timestamp: Date.now()
          }
        }
      }));

      return docData;
    });

    // Обновляем кеш списка
    setPropertiesCache(prev => ({
      ...prev,
      list: {
        data,
        timestamp: Date.now()
      }
    }));

    return data;
  }, [isCacheValid, propertiesCache.list?.data, propertiesCache.list?.timestamp]);

  // Получение детальной информации об объекте с учетом кеша
  const getPropertyDetails = useCallback(async (propertyId) => {
    // Проверяем кеш деталей
    const cachedDetails = propertiesCache.details[propertyId];
    if (cachedDetails?.data && isCacheValid(cachedDetails.timestamp)) {
      return cachedDetails.data;
    }

    // Проверяем, есть ли объект в кеше списка
    if (propertiesCache.list?.data && isCacheValid(propertiesCache.list.timestamp)) {
      const foundInList = propertiesCache.list.data.find(p => p.id === propertyId);
      if (foundInList) {
        // Сохраняем в кеш деталей и возвращаем
        setPropertiesCache(prev => ({
          ...prev,
          details: {
            ...prev.details,
            [propertyId]: {
              data: foundInList,
              timestamp: Date.now()
            }
          }
        }));
        return foundInList;
      }
    }

    // Загружаем новые данные
    const snapshot = await getDoc(doc(db, "properties", propertyId));
    if (!snapshot.exists()) return null;
    
    const data = { id: snapshot.id, ...snapshot.data() };

    // Обновляем кеш деталей
    setPropertiesCache(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [propertyId]: {
          data,
          timestamp: Date.now()
        }
      }
    }));

    return data;
  }, [propertiesCache.list?.data, propertiesCache.list?.timestamp, propertiesCache.details, isCacheValid]);

  const value = {
    getPropertiesList,
    getPropertyDetails,
    propertiesCache // Экспортируем сам кеш для прямого доступа
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
} 