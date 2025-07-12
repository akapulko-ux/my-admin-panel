import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { translations } from './translations'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Function to translate district names based on current language
export function translateDistrict(districtName, language = 'ru') {
  if (!districtName) return districtName;
  
  const t = translations[language];
  if (t && t.districts && t.districts[districtName]) {
    return t.districts[districtName];
  }
  
  // Return original name if no translation found
  return districtName;
} 

/**
 * Переводит тип недвижимости на выбранный язык
 * @param {string} propertyType - Тип недвижимости на русском языке
 * @param {string} language - Язык ('en', 'ru', 'id')
 * @returns {string} Переведенный тип недвижимости
 */
export const translatePropertyType = (propertyType, language) => {
  if (!propertyType) return '';
  
  const propertyTypeTranslations = {
    'Вилла': {
      en: 'Villa',
      ru: 'Вилла', 
      id: 'Villa'
    },
    'Апартаменты': {
      en: 'Apartment',
      ru: 'Апартаменты',
      id: 'Apartemen'
    },
    'Дом': {
      en: 'House',
      ru: 'Дом',
      id: 'Rumah'
    },
    'Коммерческая недвижимость': {
      en: 'Commercial Property',
      ru: 'Коммерческая недвижимость',
      id: 'Properti Komersial'
    },
    'Апарт-вилла': {
      en: 'Apart-Villa',
      ru: 'Апарт-вилла',
      id: 'Apart-Villa'
    },
    'Таунхаус': {
      en: 'Townhouse',
      ru: 'Таунхаус',
      id: 'Townhouse'
    },
    'Земельный участок': {
      en: 'Land Plot',
      ru: 'Земельный участок',
      id: 'Lahan'
    }
  };
  
  return propertyTypeTranslations[propertyType]?.[language] || propertyType;
}; 

/**
 * Переводит единицы измерения площади на выбранный язык
 * @param {string} area - Площадь в м²
 * @param {string} language - Язык ('en', 'ru', 'id')
 * @returns {string} Переведенная единица измерения
 */
export const translateAreaUnit = (area, language) => {
  if (!area) return '—';
  
  const units = {
    en: 'm²',
    ru: 'м²',
    id: 'm²'
  };
  
  return `${area} ${units[language] || 'м²'}`;
};

/**
 * Переводит тип постройки на выбранный язык
 * @param {string} buildingType - Тип постройки на русском языке
 * @param {string} language - Язык ('en', 'ru', 'id')
 * @returns {string} Переведенный тип постройки
 */
export const translateBuildingType = (buildingType, language) => {
  if (!buildingType) return '';
  
  const buildingTypeTranslations = {
    'Новый комплекс': {
      en: 'New Complex',
      ru: 'Новый комплекс',
      id: 'Kompleks Baru'
    },
    'Реновация': {
      en: 'Renovation',
      ru: 'Реновация',
      id: 'Renovasi'
    },
    'ИЖС': {
      en: 'Individual',
      ru: 'ИЖС',
      id: 'Individual'
    }
  };
  
  return buildingTypeTranslations[buildingType]?.[language] || buildingType;
};

/**
 * Переводит статус строительства на выбранный язык
 * @param {string} status - Статус строительства на русском языке
 * @param {string} language - Язык ('en', 'ru', 'id')
 * @returns {string} Переведенный статус строительства
 */
export const translateConstructionStatus = (status, language) => {
  if (!status) return '';
  
  const statusTranslations = {
    'Проект': {
      en: 'Project',
      ru: 'Проект',
      id: 'Proyek'
    },
    'Строится': {
      en: 'Under Construction',
      ru: 'Строится',
      id: 'Sedang Dibangun'
    },
    'Готовый': {
      en: 'Ready',
      ru: 'Готовый',
      id: 'Siap'
    },
    'От собственника': {
      en: 'From Owner',
      ru: 'От собственника',
      id: 'Dari Pemilik'
    }
  };
  
  return statusTranslations[status]?.[language] || status;
};

/**
 * Переводит статус земли на выбранный язык
 * @param {string} landStatus - Статус земли на русском языке
 * @param {string} language - Язык ('en', 'ru', 'id')
 * @returns {string} Переведенный статус земли
 */
export const translateLandStatus = (landStatus, language) => {
  if (!landStatus) return '';
  
  const landStatusTranslations = {
    'Туристическая зона (W)': {
      en: 'Tourism Zone (W)',
      ru: 'Туристическая зона (W)',
      id: 'Zona Pariwisata (W)'
    },
    'Торговая зона (K)': {
      en: 'Commercial Zone (K)',
      ru: 'Торговая зона (K)',
      id: 'Zona Komersial (K)'
    },
    'Смешанная зона (C)': {
      en: 'Mixed Zone (C)',
      ru: 'Смешанная зона (C)',
      id: 'Zona Campuran (C)'
    },
    'Жилая зона (R)': {
      en: 'Residential Zone (R)',
      ru: 'Жилая зона (R)',
      id: 'Zona Perumahan (R)'
    },
    'Сельхоз зона (P)': {
      en: 'Agricultural Zone (P)',
      ru: 'Сельхоз зона (P)',
      id: 'Zona Pertanian (P)'
    },
    'Заповедная зона (RTH)': {
      en: 'Protected Zone (RTH)',
      ru: 'Заповедная зона (RTH)',
      id: 'Zona Hijau (RTH)'
    }
  };
  
  return landStatusTranslations[landStatus]?.[language] || landStatus;
};

/**
 * Переводит статус бассейна на выбранный язык
 * @param {string} pool - Статус бассейна на русском языке
 * @param {string} language - Язык ('en', 'ru', 'id')
 * @returns {string} Переведенный статус бассейна
 */
export const translatePoolStatus = (pool, language) => {
  if (!pool) return '';
  
  const poolTranslations = {
    'Нет': {
      en: 'No',
      ru: 'Нет',
      id: 'Tidak'
    },
    'Частный': {
      en: 'Private',
      ru: 'Частный',
      id: 'Pribadi'
    },
    'Общий': {
      en: 'Shared',
      ru: 'Общий',
      id: 'Bersama'
    }
  };
  
  return poolTranslations[pool]?.[language] || pool;
};

/**
 * Переводит форму собственности на выбранный язык
 * @param {string} ownership - Форма собственности на русском языке
 * @param {string} language - Язык ('en', 'ru', 'id')
 * @returns {string} Переведенная форма собственности
 */
export const translateOwnership = (ownership, language) => {
  if (!ownership) return '';
  
  const ownershipTranslations = {
    'Leashold': {
      en: 'Leasehold',
      ru: 'Leashold',
      id: 'Leasehold'
    },
    'Leasehold': {
      en: 'Leasehold',
      ru: 'Leasehold',
      id: 'Leasehold'
    },
    'Freehold': {
      en: 'Freehold',
      ru: 'Freehold',
      id: 'Freehold'
    }
  };
  
  return ownershipTranslations[ownership]?.[language] || ownership;
}; 