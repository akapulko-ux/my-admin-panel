// Утилита для миграции расчетов ROI из localStorage в Firestore
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export const migrateRoiCalculations = async (userId) => {
  try {
    // Получаем данные из localStorage
    const savedCalculations = localStorage.getItem('roiCalculations');
    
    if (!savedCalculations) {
      console.log('Нет данных для миграции');
      return { success: true, migrated: 0 };
    }

    const calculations = JSON.parse(savedCalculations);
    
    if (!Array.isArray(calculations) || calculations.length === 0) {
      console.log('Нет расчетов для миграции');
      return { success: true, migrated: 0 };
    }

    let migratedCount = 0;
    const errors = [];

    // Мигрируем каждый расчет
    for (const calculation of calculations) {
      try {
        // Проверяем, что у расчета есть необходимые данные
        if (!calculation.data || !calculation.name) {
          console.warn('Пропускаем расчет без данных:', calculation);
          continue;
        }

        // Создаем новый документ в Firestore
        const newCalculation = {
          userId: userId,
          name: calculation.name,
          date: calculation.date || new Date().toLocaleDateString(),
          createdAt: new Date(),
          data: calculation.data
        };

        await addDoc(collection(db, 'roiCalculations'), newCalculation);
        migratedCount++;
        
        console.log(`Мигрирован расчет: ${calculation.name}`);
      } catch (error) {
        console.error('Ошибка миграции расчета:', calculation.name, error);
        errors.push({ calculation: calculation.name, error: error.message });
      }
    }

    // Если миграция прошла успешно, очищаем localStorage
    if (migratedCount > 0 && errors.length === 0) {
      localStorage.removeItem('roiCalculations');
      console.log('localStorage очищен после успешной миграции');
    }

    return {
      success: errors.length === 0,
      migrated: migratedCount,
      errors: errors
    };

  } catch (error) {
    console.error('Ошибка миграции:', error);
    return {
      success: false,
      migrated: 0,
      errors: [{ error: error.message }]
    };
  }
};

// Функция для проверки наличия данных в localStorage
export const hasLocalStorageCalculations = () => {
  const savedCalculations = localStorage.getItem('roiCalculations');
  if (!savedCalculations) return false;
  
  try {
    const calculations = JSON.parse(savedCalculations);
    return Array.isArray(calculations) && calculations.length > 0;
  } catch {
    return false;
  }
}; 