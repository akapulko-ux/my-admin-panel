const functions = require('firebase-functions');
const admin = require('firebase-admin');
let OpenAI;
try {
  OpenAI = require('openai');
} catch (_) {
  OpenAI = null;
}

// Инициализация Admin SDK (без повторной инициализации)
// В этом файле инициализации не делаем, она уже происходит в index.js

function getDb() {
  if (!admin.apps.length) {
    // Безопасная ленивоя инициализация на случай раннего импорта
    admin.initializeApp();
  }
  return admin.firestore();
}

function getDefaultBucketName() {
  return process.env.FIREBASE_STORAGE_BUCKET || `${process.env.GCLOUD_PROJECT}.appspot.com`;
}

// Токен бота читаем из окружения лениво, чтобы не зависеть от порядка загрузки .env при деплое
function getBotToken() {
  return process.env.AI_ASSISTANT_TELEGRAM_BOT_TOKEN;
}

// Не шумим на этапе деплоя: проверку токена делаем только при вызове функций

// Функция определения языка запроса
function detectLanguage(text) {
  const lowerText = text.toLowerCase();
  
  // Русские слова-индикаторы
  const russianWords = ['вилла', 'квартира', 'дом', 'цена', 'спальня', 'район', 'бассейн', 'площадь', 'готов', 'строительство', 'от', 'до', 'тысяч', 'миллион', 'рублей', 'долларов', 'метр', 'комната', 'санузел', 'кухня', 'балкон', 'терраса', 'участок', 'земля', 'документы', 'собственность', 'аренда', 'покупка', 'продажа', 'недвижимость', 'объект', 'предложение', 'варианты', 'подборка', 'семиньяк', 'чангу', 'убуд', 'санур', 'кута', 'джимбаран', 'нуса', 'улувату', 'переренан', 'унгасан', 'денпасар'];
  
  // Английские слова-индикаторы
  const englishWords = ['villa', 'apartment', 'house', 'price', 'bedroom', 'district', 'pool', 'area', 'ready', 'construction', 'from', 'to', 'thousand', 'million', 'dollars', 'meter', 'room', 'bathroom', 'kitchen', 'balcony', 'terrace', 'land', 'property', 'real estate', 'rent', 'buy', 'sell', 'offer', 'options', 'selection', 'seminyak', 'canggu', 'ubud', 'sanur', 'kuta', 'jimbaran', 'nusa', 'uluwatu', 'pererenan', 'ungasan', 'denpasar'];
  
  // Индонезийские слова-индикаторы
  const indonesianWords = ['vila', 'apartemen', 'rumah', 'harga', 'kamar tidur', 'distrik', 'kolam renang', 'luas', 'siap', 'konstruksi', 'dari', 'sampai', 'ribu', 'juta', 'dolar', 'meter', 'kamar', 'kamar mandi', 'dapur', 'balkon', 'teras', 'tanah', 'properti', 'real estat', 'sewa', 'beli', 'jual', 'penawaran', 'pilihan', 'seleksi'];
  
  let russianScore = 0;
  let englishScore = 0;
  let indonesianScore = 0;
  
  // Подсчитываем совпадения
  russianWords.forEach(word => {
    if (lowerText.includes(word)) russianScore++;
  });
  
  englishWords.forEach(word => {
    if (lowerText.includes(word)) englishScore++;
  });
  
  indonesianWords.forEach(word => {
    if (lowerText.includes(word)) indonesianScore++;
  });
  
  // Дополнительные проверки по алфавиту
  const cyrillicChars = (text.match(/[а-яё]/gi) || []).length;
  const latinChars = (text.match(/[a-z]/gi) || []).length;
  
  if (cyrillicChars > 0) russianScore += Math.min(cyrillicChars / 3, 5);
  if (latinChars > 0) {
    englishScore += Math.min(latinChars / 10, 3);
    indonesianScore += Math.min(latinChars / 10, 3);
  }
  
  // Определяем язык по наибольшему счету
  if (russianScore > englishScore && russianScore > indonesianScore) {
    return 'ru';
  } else if (englishScore > indonesianScore) {
    return 'en';
  } else if (indonesianScore > 0) {
    return 'id';
  }
  
  // По умолчанию русский (если ничего не определилось)
  return 'ru';
}

// Переводы типов недвижимости
const propertyTypeTranslations = {
  'Вилла': { en: 'Villa', id: 'Vila' },
  'Апартаменты': { en: 'Apartment', id: 'Apartemen' },
  'Дом': { en: 'House', id: 'Rumah' },
  'Коммерческая недвижимость': { en: 'Commercial Property', id: 'Properti Komersial' },
  'Земельный участок': { en: 'Land Plot', id: 'Tanah' },
  'Апарт-вилла': { en: 'Apart-Villa', id: 'Apart-Vila' }
};

// Переводы районов
const districtTranslations = {
  'Ubud': { en: 'Ubud', id: 'Ubud', ru: 'Убуд' },
  'Seminyak': { en: 'Seminyak', id: 'Seminyak', ru: 'Семиньяк' },
  'Canggu': { en: 'Canggu', id: 'Canggu', ru: 'Чангу' },
  'Sanur': { en: 'Sanur', id: 'Sanur', ru: 'Санур' },
  'Nusa Dua': { en: 'Nusa Dua', id: 'Nusa Dua', ru: 'Нуса Дуа' },
  'Jimbaran': { en: 'Jimbaran', id: 'Jimbaran', ru: 'Джимбаран' },
  'Kuta': { en: 'Kuta', id: 'Kuta', ru: 'Кута' },
  'Uluwatu': { en: 'Uluwatu', id: 'Uluwatu', ru: 'Улувату' },
  'Pererenan': { en: 'Pererenan', id: 'Pererenan', ru: 'Переренан' },
  'Nuanu': { en: 'Nuanu', id: 'Nuanu', ru: 'Нуану' },
  'Ungasan': { en: 'Ungasan', id: 'Ungasan', ru: 'Унгасан' },
  'Denpasar': { en: 'Denpasar', id: 'Denpasar', ru: 'Денпасар' },
  'Tabanan': { en: 'Tabanan', id: 'Tabanan', ru: 'Табанан' },
  'Legian': { en: 'Legian', id: 'Legian', ru: 'Легиан' },
  'Bingin': { en: 'Bingin', id: 'Bingin', ru: 'Бингин' },
  'Pecatu': { en: 'Pecatu', id: 'Pecatu', ru: 'Пекату' },
  'Dreamland': { en: 'Dreamland', id: 'Dreamland', ru: 'Дримленд' },
  'Balangan': { en: 'Balangan', id: 'Balangan', ru: 'Баланган' }
};

// Расширенная география Бали с детальной информацией
const baliGeography = {
  regions: {
    'Bukit': {
      en: 'Bukit Peninsula', 
      id: 'Semenanjung Bukit', 
      ru: 'полуостров Букит',
      districts: ['Uluwatu', 'Ungasan', 'Jimbaran', 'Nusa Dua', 'Pecatu', 'Bingin', 'Dreamland', 'Balangan'],
      characteristics: {
        coastline: true,
        beaches: ['Uluwatu Beach', 'Bingin Beach', 'Dreamland Beach', 'Balangan Beach', 'Jimbaran Beach'],
        elevation: 'elevated',
        atmosphere: 'luxury, cliffs, surfing',
        distance_to_airport: 'close'
      }
    },
    'Central': {
      en: 'Central Bali',
      id: 'Bali Tengah',
      ru: 'центральный Бали',
      districts: ['Ubud', 'Denpasar', 'Sanur'],
      characteristics: {
        coastline: false, // кроме Sanur
        atmosphere: 'cultural, rice fields, spiritual',
        elevation: 'hills',
        distance_to_airport: 'medium'
      }
    },
    'West Coast': {
      en: 'West Coast',
      id: 'Pantai Barat',
      ru: 'западное побережье',
      districts: ['Seminyak', 'Canggu', 'Pererenan', 'Kuta', 'Legian'],
      characteristics: {
        coastline: true,
        beaches: ['Seminyak Beach', 'Double Six Beach', 'Canggu Beach', 'Echo Beach', 'Kuta Beach', 'Legian Beach'],
        elevation: 'flat',
        atmosphere: 'beach clubs, surfing, nightlife',
        distance_to_airport: 'close'
      }
    },
    'North': {
      en: 'North Bali',
      id: 'Bali Utara',
      ru: 'северный Бали',
      districts: ['Tabanan'],
      characteristics: {
        coastline: false,
        elevation: 'mountains',
        atmosphere: 'quiet, nature, traditional',
        distance_to_airport: 'far'
      }
    }
  },
  
  // Детальная информация по районам
  districts: {
    'Seminyak': {
      coastline: true,
      beaches: ['Seminyak Beach', 'Double Six Beach'],
      atmosphere: 'luxury, beach clubs, restaurants',
      price_level: 'high',
      distance_to_airport: '15min'
    },
    'Canggu': {
      coastline: true,
      beaches: ['Canggu Beach', 'Echo Beach', 'Berawa Beach'],
      atmosphere: 'surfing, digital nomads, rice fields',
      price_level: 'medium-high',
      distance_to_airport: '25min'
    },
    'Uluwatu': {
      coastline: true,
      beaches: ['Uluwatu Beach', 'Padang Padang', 'Bingin Beach'],
      atmosphere: 'cliffs, surfing, luxury villas',
      price_level: 'high',
      distance_to_airport: '20min'
    },
    'Jimbaran': {
      coastline: true,
      beaches: ['Jimbaran Beach'],
      atmosphere: 'seafood restaurants, calm beach, family-friendly',
      price_level: 'medium-high',
      distance_to_airport: '10min'
    },
    'Ubud': {
      coastline: false,
      atmosphere: 'cultural center, rice terraces, yoga, art',
      price_level: 'medium',
      distance_to_airport: '60min'
    },
    'Sanur': {
      coastline: true,
      beaches: ['Sanur Beach'],
      atmosphere: 'calm, family-friendly, traditional',
      price_level: 'medium',
      distance_to_airport: '30min'
    },
    'Kuta': {
      coastline: true,
      beaches: ['Kuta Beach'],
      atmosphere: 'budget-friendly, nightlife, surfing lessons',
      price_level: 'low-medium',
      distance_to_airport: '5min'
    },
    'Nusa Dua': {
      coastline: true,
      beaches: ['Nusa Dua Beach'],
      atmosphere: 'luxury resorts, golf, calm',
      price_level: 'high',
      distance_to_airport: '15min'
    }
  },
  
  neighbors: {
    'Seminyak': ['Canggu', 'Pererenan', 'Kuta', 'Legian'],
    'Canggu': ['Seminyak', 'Pererenan'],
    'Pererenan': ['Canggu', 'Seminyak'],
    'Uluwatu': ['Ungasan', 'Pecatu', 'Bingin'],
    'Ungasan': ['Uluwatu', 'Jimbaran', 'Nusa Dua'],
    'Jimbaran': ['Ungasan', 'Nusa Dua', 'Kuta'],
    'Nusa Dua': ['Jimbaran', 'Ungasan'],
    'Kuta': ['Seminyak', 'Legian', 'Jimbaran'],
    'Legian': ['Kuta', 'Seminyak'],
    'Ubud': ['Denpasar', 'Sanur'],
    'Sanur': ['Ubud', 'Denpasar'],
    'Denpasar': ['Ubud', 'Sanur']
  },
  
  aliases: {
    'букит': 'Bukit',
    'bukit': 'Bukit',
    'семиньяк': 'Seminyak',
    'чангу': 'Canggu',
    'убуд': 'Ubud',
    'кута': 'Kuta',
    'санур': 'Sanur',
    'джимбаран': 'Jimbaran',
    'улувату': 'Uluwatu',
    // Добавляем понимание абстрактных запросов
    'у моря': 'coastline',
    'на берегу': 'coastline',
    'beach': 'coastline',
    'море': 'coastline',
    'пляж': 'coastline',
    'побережье': 'coastline',
    'клифы': 'Bukit',
    'скалы': 'Bukit',
    'cliffs': 'Bukit',
    'центр': 'Central',
    'культурный': 'Ubud',
    'тихо': 'Sanur',
    'спокойно': 'Sanur',
    'серфинг': 'Canggu',
    'surfing': 'Canggu',
    'ночная жизнь': 'Seminyak',
    'nightlife': 'Seminyak',
    'бюджетно': 'Kuta',
    'budget': 'Kuta',
    'люкс': 'Nusa Dua',
    'luxury': 'Nusa Dua'
  }
};

// Переводы статусов
const statusTranslations = {
  'Готово': { en: 'Ready', id: 'Siap' },
  'В строительстве': { en: 'Under Construction', id: 'Sedang Dibangun' },
  'Проект': { en: 'Project', id: 'Proyek' },
  'От собственника': { en: 'From Owner', id: 'Dari Pemilik' },
  'Готовый': { en: 'Ready', id: 'Siap' },
  'Строится': { en: 'Under Construction', id: 'Sedang Dibangun' },
  'Планируется': { en: 'Planned', id: 'Direncanakan' },
  'На стадии проекта': { en: 'In Project Stage', id: 'Tahap Proyek' },
  'Завершено': { en: 'Completed', id: 'Selesai' },
  'Сдано': { en: 'Delivered', id: 'Diserahkan' }
};

// Функции локализации
function translatePropertyType(type, language) {
  if (language === 'ru') return type; // Исходные данные уже на русском
  const translation = propertyTypeTranslations[type];
  return translation ? translation[language] || type : type;
}

function translateStatus(status, language) {
  if (!status) return status;
  if (language === 'ru') return status; // Исходные данные уже на русском
  
  // Прямой поиск по ключу
  const translation = statusTranslations[status];
  if (translation && translation[language]) {
    return translation[language];
  }
  
  // Поиск по значениям (если статус уже переведен)
  const entry = Object.entries(statusTranslations).find(([key, value]) => 
    value.en === status || value.id === status || key === status
  );
  
  if (entry && entry[1][language]) {
    return entry[1][language];
  }
  
  return status; // Возвращаем как есть, если перевод не найден
}

function translateDistrict(district, language) {
  if (language === 'ru') {
    // Если нужен русский, ищем по английскому ключу
    const entry = Object.entries(districtTranslations).find(([key, value]) => 
      key === district || value.en === district || value.id === district
    );
    return entry ? entry[1].ru || district : district;
  }
  
  // Для других языков ищем по русскому или английскому ключу
  const translation = districtTranslations[district];
  if (translation) return translation[language] || district;
  
  // Поиск по значениям
  const entry = Object.entries(districtTranslations).find(([key, value]) => 
    value.ru === district || value.en === district || value.id === district
  );
  return entry ? entry[1][language] || district : district;
}

// Функции для умной работы с районами
function findRegionByAlias(text, language) {
  const lowerText = text.toLowerCase();
  
  // Поиск по алиасам
  for (const [alias, region] of Object.entries(baliGeography.aliases)) {
    if (lowerText.includes(alias)) {
      return region;
    }
  }
  
  // Поиск по названиям регионов
  for (const [regionKey, regionData] of Object.entries(baliGeography.regions)) {
    const regionName = regionData[language] || regionData.en;
    if (lowerText.includes(regionName.toLowerCase())) {
      return regionKey;
    }
  }
  
  return null;
}

function getDistrictsInRegion(regionKey) {
  const region = baliGeography.regions[regionKey];
  return region ? region.districts : [];
}

function getNeighborDistricts(district) {
  return baliGeography.neighbors[district] || [];
}

function findDistrictInText(text) {
  const lowerText = text.toLowerCase();
  
  // Поиск по алиасам
  for (const [alias, district] of Object.entries(baliGeography.aliases)) {
    if (lowerText.includes(alias) && district !== 'Bukit') { // Bukit - это регион, не район
      return district;
    }
  }
  
  // Поиск по названиям районов
  for (const district of Object.keys(districtTranslations)) {
    const translations = districtTranslations[district];
    if (lowerText.includes(district.toLowerCase()) ||
        lowerText.includes(translations.ru.toLowerCase()) ||
        lowerText.includes(translations.en.toLowerCase()) ||
        lowerText.includes(translations.id.toLowerCase())) {
      return district;
    }
  }
  
  return null;
}

async function checkDistrictsAvailability(districts) {
  try {
    const availableDistricts = [];
    
    for (const district of districts) {
      const snap = await getDb().collection('properties')
        .where('district', '==', district)
        .limit(1)
        .get();
      
      if (!snap.empty) {
        availableDistricts.push(district);
      }
    }
    
    return availableDistricts;
  } catch (error) {
    console.error('[aiAssistantBot] Error checking districts availability:', error);
    return [];
  }
}

// Переводы для ответов бота
const botTranslations = {
  ru: {
    noResults: 'По вашему запросу не нашлось точных совпадений. Уточните район, бюджет, тип или особенности — и я подберу варианты.',
    foundResults: 'Нашёл {count} подходящ{suffix} объект{suffix2}.',
    types: 'Типы: {types}',
    districts: 'Районы: {districts}',
    priceRange: 'Цены: {min} - {max}',
    bedrooms: 'Спальни: {bedrooms}',
    areas: 'Площадь: {min} - {max} м²',
    statuses: 'Статус: {statuses}',
    withPool: 'С бассейном: {count}',
    seeCardsBelow: 'См. карточки ниже ⤵️',
    openSelection: 'Открыть подборку',
    yourQuery: 'Ваш запрос:',
    // Умные ответы
    noPropertiesInDistrict: 'В нашей базе пока нет объектов в районе {district}.',
    suggestNeighbors: 'Возможно, вас заинтересуют объекты в соседних районах: {neighbors}?',
    regionSearch: 'Ищу объекты в районах {region}: {districts}',
    foundInRegion: 'Найдены объекты в {region}:',
    confirmNeighbors: 'Да',
    declineNeighbors: 'Нет'
  },
  en: {
    noResults: 'No exact matches found for your request. Please specify the area, budget, type or features — and I will find suitable options.',
    foundResults: 'Found {count} suitable propert{suffix}.',
    types: 'Types: {types}',
    districts: 'Districts: {districts}',
    priceRange: 'Prices: {min} - {max}',
    bedrooms: 'Bedrooms: {bedrooms}',
    areas: 'Area: {min} - {max} m²',
    statuses: 'Status: {statuses}',
    withPool: 'With pool: {count}',
    seeCardsBelow: 'See cards below ⤵️',
    openSelection: 'Open Selection',
    yourQuery: 'Your query:',
    // Умные ответы
    noPropertiesInDistrict: 'We currently have no properties in {district} area.',
    suggestNeighbors: 'Perhaps you might be interested in properties in nearby areas: {neighbors}?',
    regionSearch: 'Searching for properties in {region} areas: {districts}',
    foundInRegion: 'Found properties in {region}:',
    confirmNeighbors: 'Yes',
    declineNeighbors: 'No'
  },
  id: {
    noResults: 'Tidak ditemukan hasil yang tepat untuk permintaan Anda. Harap tentukan area, anggaran, tipe atau fitur — dan saya akan menemukan opsi yang sesuai.',
    foundResults: 'Ditemukan {count} properti yang sesuai.',
    types: 'Tipe: {types}',
    districts: 'Distrik: {districts}',
    priceRange: 'Harga: {min} - {max}',
    bedrooms: 'Kamar tidur: {bedrooms}',
    areas: 'Luas: {min} - {max} m²',
    statuses: 'Status: {statuses}',
    withPool: 'Dengan kolam renang: {count}',
    seeCardsBelow: 'Lihat kartu di bawah ⤵️',
    openSelection: 'Buka Pilihan',
    yourQuery: 'Permintaan Anda:',
    // Умные ответы
    noPropertiesInDistrict: 'Saat ini kami tidak memiliki properti di area {district}.',
    suggestNeighbors: 'Mungkin Anda tertarik dengan properti di area terdekat: {neighbors}?',
    regionSearch: 'Mencari properti di area {region}: {districts}',
    foundInRegion: 'Ditemukan properti di {region}:',
    confirmNeighbors: 'Ya',
    declineNeighbors: 'Tidak'
  }
};

// Утилита: отправка сообщения
async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  const botToken = getBotToken();
  if (!botToken) throw new Error('BOT_TOKEN_MISSING');
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await resp.json();
  if (!resp.ok) {
    console.error('[aiAssistantBot] Telegram sendMessage error:', data);
    throw new Error(data.description || 'Telegram API error');
  }
  return data;
}

// Утилита: отправка фото-карточки объекта
async function sendTelegramPhoto(chatId, photoUrl, caption, replyMarkup = null) {
  const botToken = getBotToken();
  if (!botToken) throw new Error('BOT_TOKEN_MISSING');
  const form = {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
  };
  if (replyMarkup) form.reply_markup = replyMarkup;

  const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  const data = await resp.json();
  if (!resp.ok) {
    console.error('[aiAssistantBot] Telegram sendPhoto error:', data);
    throw new Error(data.description || 'Telegram API error');
  }
  return data;
}

// Примитивный парсер критериев (как в iOS AIAssistantService, упрощенная версия)
function analyzeUserRequest(message) {
  const text = (message || '').toLowerCase();
  const criteria = {};

  // Тип
  if (text.includes('вилл') || text.includes('villa')) criteria.propertyType = 'Вилла';
  else if (text.includes('апарт') || text.includes('apartment')) criteria.propertyType = 'Апартаменты';
  else if (text.includes('дом') || text.includes('house')) criteria.propertyType = 'Дом';
  else if (text.includes('коммер')) criteria.propertyType = 'Коммерческая недвижимость';

  // Район (на лету
  const districtMap = [
    ['убуд', 'Ubud'], ['ubud', 'Ubud'],
    ['семиньяк', 'Seminyak'], ['seminyak', 'Seminyak'],
    ['чангу', 'Canggu'], ['canggu', 'Canggu'],
    ['санур', 'Sanur'], ['sanur', 'Sanur'],
    ['нуса дуа', 'Nusa Dua'], ['nusa dua', 'Nusa Dua'],
    ['джимбаран', 'Jimbaran'], ['jimbaran', 'Jimbaran'],
    ['кута', 'Kuta'], ['kuta', 'Kuta'],
    ['улувату', 'Uluwatu'], ['uluwatu', 'Uluwatu'],
    ['переренан', 'Pererenan'], ['pererenan', 'Pererenan'],
    ['нуану', 'Nuanu'], ['nuanu', 'Nuanu'],
    ['унгасан', 'Ungasan'], ['ungasan', 'Ungasan'],
  ];
  for (const [key, val] of districtMap) {
    if (text.includes(key)) { criteria.district = val; break; }
  }

  // Цена min/max
  const range = text.match(/от\s+(\d+)\s*(тыс|тысяч|k|thousand)?\s+до\s+(\d+)\s*(тыс|тысяч|k|thousand|млн|миллион|million|m)?/i);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[3]);
    let mulMin = 1, mulMax = 1;
    if (range[2] && /тыс|k|thousand/i.test(range[2])) mulMin = 1000;
    if (range[4] && /(млн|million|m)/i.test(range[4])) mulMax = 1000000;
    if (range[4] && /тыс|k|thousand/i.test(range[4])) mulMax = 1000;
    criteria.minPrice = min * mulMin;
    criteria.maxPrice = max * mulMax;
  } else {
    // Одинарные числа с контекстом "до/от"
    const singles = [...text.matchAll(/(от|до)\s+(\d+)\s*(тыс|тысяч|k|thousand|млн|миллион|million|m)?/gi)];
    for (const m of singles) {
      let val = Number(m[2]);
      if (m[3]) {
        if (/(млн|million|m)/i.test(m[3])) val *= 1000000;
        else if (/(тыс|k|thousand)/i.test(m[3])) val *= 1000;
      }
      if (m[1].toLowerCase() === 'от') criteria.minPrice = val;
      else criteria.maxPrice = val;
    }
  }

  // Спальни
  const bed = text.match(/(\d+)\s*(спал|bed)/i);
  if (bed) criteria.bedrooms = Number(bed[1]);

  // Площадь
  const area = text.match(/(\d+)\s*(м2|кв|sqm|square)/i);
  if (area) {
    // трактуем как minArea по умолчанию
    criteria.minArea = Number(area[1]);
  }

  // Бассейн
  if (text.includes('бассейн') || text.includes('pool')) criteria.hasPool = true;

  // Статус
  if (text.includes('готов')) criteria.status = 'Готово';
  if (text.includes('строитель') || text.includes('construction')) criteria.status = 'В строительстве';

  return criteria;
}

// Поиск в Firestore по критериям (часть фильтров серверные, остальное локально)
async function searchProperties(criteria) {
  let query = getDb().collection('properties');

  if (criteria.propertyType) query = query.where('type', '==', criteria.propertyType);
  if (criteria.status) query = query.where('status', '==', criteria.status);

  // Берём больший лимит для работы с множественными районами
  const snap = await query.limit(100).get();
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  function canonicalType(raw) {
    const t = (raw || '').toString().trim().toLowerCase();
    if (!t) return '';
    if (/(вил+|villa)/i.test(t)) return 'Вилла';
    if (/(апарт|apart|apartment)/i.test(t)) return 'Апартаменты';
    if (/(дом|house)/i.test(t)) return 'Дом';
    if (/(коммер|commercial)/i.test(t)) return 'Коммерческая недвижимость';
    if (/(земел|участок|land)/i.test(t)) return 'Земельный участок';
    if (/(апарт-?вилл)/i.test(t)) return 'Апарт-вилла';
    return raw;
  }

  function canonicalDistrict(raw) {
    const t = (raw || '').toString().trim().toLowerCase();
    if (!t) return '';
    const map = new Map([
      ['убуд','cang:ubud'], ['ubud','cang:ubud'],
      ['семиньяк','sem:seminyak'], ['seminyak','sem:seminyak'],
      ['чангу','cgg:canggu'], ['canggu','cgg:canggu'],
      ['санур','snr:sanur'], ['sanur','snr:sanur'],
      ['нуса дуа','nsd:nusa dua'], ['nusa dua','nsd:nusa dua'],
      ['джимбаран','jmb:jimbaran'], ['jimbaran','jmb:jimbaran'],
      ['кута','kta:kuta'], ['kuta','kta:kuta'],
      ['улувату','ulw:uluwatu'], ['uluwatu','ulw:uluwatu'],
      ['переренан','prr:pererenan'], ['pererenan','prr:pererenan'],
      ['нуану','nnu:nuanu'], ['nuanu','nnu:nuanu'],
      ['унгасан','ugs:ungasan'], ['ungasan','ugs:ungasan'],
      ['денпасар','dps:denpasar'], ['denpasar','dps:denpasar'],
      ['табанан','tbn:tabanan'], ['tabanan','tbn:tabanan'],
      ['легиан','lgn:legian'], ['legian','lgn:legian']
    ]);
    for (const [k,v] of map.entries()) {
      if (t.includes(k)) return v;
    }
    return t;
  }

  function priceOf(p) {
    // В БД ожидаем числовое поле price, fallback 0
    return typeof p.price === 'number' ? p.price : Number(p.price) || 0;
  }

  function matchesLocal(p) {
    // Тип недвижимости (строгое соответствие по каноническому типу)
    if (criteria.propertyType) {
      const pt = canonicalType(p.type || p.propertyType || '');
      if (pt !== criteria.propertyType) return false;
    }
    
    // Поддержка множественных районов (новая логика)
    if (criteria.districts && Array.isArray(criteria.districts)) {
      const propDistrictKey = canonicalDistrict(p.district);
      const matchesAnyDistrict = criteria.districts.some(district => {
        const needKey = canonicalDistrict(district);
        return propDistrictKey && needKey && propDistrictKey === needKey;
      });
      if (!matchesAnyDistrict) return false;
    }
    // Старая логика для одного района (обратная совместимость)
    else if (criteria.district) {
      const propDistrictKey = canonicalDistrict(p.district);
      const needKey = canonicalDistrict(criteria.district);
      if (!propDistrictKey || !needKey || propDistrictKey !== needKey) return false;
    }
    
    if (criteria.minPrice != null && priceOf(p) < criteria.minPrice) return false;
    if (criteria.maxPrice != null && priceOf(p) > criteria.maxPrice) return false;
    if (criteria.bedrooms != null) {
      const b = parseInt(p.bedrooms, 10);
      if (!Number.isNaN(b) && b < criteria.bedrooms) return false;
    }
    if (criteria.minArea != null) {
      const a = typeof p.area === 'number' ? p.area : Number(p.area) || 0;
      if (a < criteria.minArea) return false;
    }
    if (criteria.maxArea != null) {
      const a = typeof p.area === 'number' ? p.area : Number(p.area) || 0;
      if (a > criteria.maxArea) return false;
    }
    if (criteria.hasPool === true) {
      const pool = (p.pool || '').toString();
      if (!pool || pool === 'Нет') return false;
    }
    return true;
  }

  const filtered = items.filter(matchesLocal);
  // Сортировка по цене по возрастанию (виллы до бюджета будут выше)
  filtered.sort((a, b) => priceOf(a) - priceOf(b));
  return filtered.slice(0, 10);
}

// Умная функция поиска с географической логикой
async function smartSearchProperties(text, language) {
  const t = botTranslations[language] || botTranslations.ru;
  
  // Проверяем, ищет ли пользователь по региону (например, "Букит")
  const regionKey = findRegionByAlias(text, language);
  if (regionKey) {
    const regionDistricts = getDistrictsInRegion(regionKey);
    const availableDistricts = await checkDistrictsAvailability(regionDistricts);
    
    if (availableDistricts.length > 0) {
      // Есть объекты в регионе - делаем обычный поиск по всем районам региона
      const criteria = analyzeUserRequest(text);
      criteria.districts = availableDistricts; // Ограничиваем поиск районами региона
      
      const properties = await searchPropertiesByDistricts(criteria, availableDistricts);
      
      const regionName = baliGeography.regions[regionKey][language] || baliGeography.regions[regionKey].en;
      const localizedDistricts = availableDistricts.map(d => translateDistrict(d, language)).join(', ');
      
      return {
        properties,
        message: t.regionSearch.replace('{region}', regionName).replace('{districts}', localizedDistricts),
        type: 'region_search'
      };
    }
  }
  
  // Проверяем, ищет ли пользователь по конкретному району
  const requestedDistrict = findDistrictInText(text);
  if (requestedDistrict) {
    const criteria = analyzeUserRequest(text);
    criteria.district = requestedDistrict;
    
    const properties = await searchProperties(criteria);
    
    if (properties.length === 0) {
      // Нет объектов в запрошенном районе - предлагаем соседние
      const neighbors = getNeighborDistricts(requestedDistrict);
      const availableNeighbors = await checkDistrictsAvailability(neighbors);
      
      if (availableNeighbors.length > 0) {
        const localizedDistrict = translateDistrict(requestedDistrict, language);
        const localizedNeighbors = availableNeighbors.map(d => translateDistrict(d, language)).join(', ');
        
        return {
          properties: [],
          message: t.noPropertiesInDistrict.replace('{district}', localizedDistrict) + '\n\n' +
                   t.suggestNeighbors.replace('{neighbors}', localizedNeighbors),
          type: 'suggest_neighbors',
          originalDistrict: requestedDistrict,
          suggestedDistricts: availableNeighbors,
          originalCriteria: criteria
        };
      }
    }
    
    return {
      properties,
      message: null,
      type: 'normal_search'
    };
  }
  
  // Обычный поиск без географической логики
  const criteria = analyzeUserRequest(text);
  const properties = await searchProperties(criteria);
  
  return {
    properties,
    message: null,
    type: 'normal_search'
  };
}

async function searchPropertiesByDistricts(criteria, districts) {
  let allProperties = [];
  
  for (const district of districts) {
    const districtCriteria = { ...criteria, district };
    const properties = await searchProperties(districtCriteria);
    allProperties = allProperties.concat(properties);
  }
  
  // Убираем дубликаты по ID
  const uniqueProperties = allProperties.filter((property, index, self) =>
    index === self.findIndex(p => p.id === property.id)
  );
  
  // Сортируем по цене
  uniqueProperties.sort((a, b) => {
    const priceA = typeof a.price === 'number' ? a.price : Number(a.price) || 0;
    const priceB = typeof b.price === 'number' ? b.price : Number(b.price) || 0;
    return priceA - priceB;
  });
  
  return uniqueProperties.slice(0, 10);
}

function formatMoneyUSD(n) {
  const val = typeof n === 'number' ? n : Number(n) || 0;
  return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

// Функция для умного анализа запроса с помощью ИИ
async function analyzeRequestWithAI(userText, language = 'ru') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !OpenAI) {
    console.log('[aiAssistantBot] OpenAI not available, using fallback');
    return analyzeUserRequest(userText); // fallback на старый метод
  }

  try {
    // Подготавливаем контекст о географии Бали
    const geographyContext = `
ГЕОГРАФИЯ БАЛИ:

РЕГИОНЫ И РАЙОНЫ:
- Букит (Bukit Peninsula): Uluwatu, Ungasan, Jimbaran, Nusa Dua, Pecatu, Bingin, Dreamland, Balangan
  * У моря, на скалах, люкс виллы, близко к аэропорту
- Западное побережье: Seminyak, Canggu, Pererenan, Kuta, Legian  
  * Пляжи, серфинг, ночная жизнь, близко к аэропорту
- Центральный Бали: Ubud, Denpasar, Sanur
  * Ubud - культурный центр, рисовые поля (НЕ у моря)
  * Sanur - спокойный пляжный район

РАЙОНЫ У МОРЯ: Seminyak, Canggu, Uluwatu, Jimbaran, Sanur, Kuta, Legian, Nusa Dua, Bingin, Dreamland, Balangan
РАЙОНЫ НЕ У МОРЯ: Ubud, Denpasar

ЦЕНОВЫЕ КАТЕГОРИИ:
- Люкс: Seminyak, Uluwatu, Nusa Dua, Jimbaran
- Средний: Canggu, Sanur, Ubud  
- Бюджет: Kuta, Legian

АТМОСФЕРА:
- Серфинг: Canggu, Uluwatu, Kuta
- Ночная жизнь: Seminyak, Kuta
- Спокойно: Sanur, Nusa Dua, Jimbaran
- Культура: Ubud
`;

    const systemPrompt = `Ты эксперт по недвижимости Бали. Проанализируй запрос пользователя и верни JSON с критериями поиска.

${geographyContext}

ВАЖНО:
- Если запрос "у моря", "на берегу", "beach" - это означает ТОЛЬКО прибрежные районы
- "Букит" означает ВСЕ районы полуострова Букит
- Абстрактные запросы типа "тихое место" = Sanur, Nusa Dua
- "Серфинг" = Canggu, Uluwatu, Kuta
- Понимай контекст и атмосферу

Верни ТОЛЬКО JSON:
{
  "districts": ["район1", "район2"] или null,
  "propertyType": "Вилла|Апартаменты|Дом" или null,
  "minPrice": число или null,
  "maxPrice": число или null,
  "bedrooms": число или null,
  "minArea": число или null,
  "hasPool": true/false или null,
  "status": "Готово|В строительстве" или null,
  "reasoning": "объяснение логики выбора районов"
}`;

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Запрос пользователя: "${userText}"` }
      ],
      temperature: 0.1,
      max_tokens: 800
    });

    const content = completion.choices?.[0]?.message?.content || '';
    console.log('[aiAssistantBot] AI analysis response:', content);
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('[aiAssistantBot] No JSON found in AI response, using fallback');
      return analyzeUserRequest(userText);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('[aiAssistantBot] AI parsed criteria:', parsed);
    
    // Преобразуем результат в формат, совместимый с существующим кодом
    const criteria = {};
    if (parsed.districts && Array.isArray(parsed.districts)) {
      criteria.districts = parsed.districts;
    }
    if (parsed.propertyType) criteria.propertyType = parsed.propertyType;
    if (parsed.minPrice) criteria.minPrice = parsed.minPrice;
    if (parsed.maxPrice) criteria.maxPrice = parsed.maxPrice;
    if (parsed.bedrooms) criteria.bedrooms = parsed.bedrooms;
    if (parsed.minArea) criteria.minArea = parsed.minArea;
    if (parsed.hasPool !== null) criteria.hasPool = parsed.hasPool;
    if (parsed.status) criteria.status = parsed.status;
    
    // Добавляем reasoning для отладки
    criteria._aiReasoning = parsed.reasoning;
    
    return criteria;
    
  } catch (error) {
    console.error('[aiAssistantBot] AI analysis error:', error);
    return analyzeUserRequest(userText); // fallback
  }
}

// Попытка умного подбора с OpenAI (как в iOS):
async function selectWithAI(userText, candidateItems = null) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !OpenAI) {
    return null;
  }

  // Используем кандидатов (если есть) или загружаем до 100
  let items = [];
  if (Array.isArray(candidateItems) && candidateItems.length > 0) {
    items = candidateItems.slice(0, 100).map((d, i) => ({ idx: i + 1, ...d }));
  } else {
    const snap = await getDb().collection('properties').limit(100).get();
    items = snap.docs.map((d, i) => ({ idx: i + 1, id: d.id, ...d.data() }));
  }

  const propertiesContext = items.map(p => {
    const price = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
    const desc = (p.description || '').toString().slice(0, 80);
    const bedrooms = parseInt(p.bedrooms, 10);
    const area = typeof p.area === 'number' ? p.area : Number(p.area) || 0;
    const pool = p.pool ? 'Да' : 'Нет';
    return `ID:${p.idx} | ${p.type || ''} | ${p.district || ''} | $${price} | ${Number.isFinite(bedrooms) ? bedrooms + ' сп' : ''} | ${area} м² | ${p.status || ''} | Бассейн:${pool} | ${desc}...`;
  }).join('\n');

  const systemPrompt = [
    'Ты — эксперт по недвижимости на Бали. У тебя есть ЖИВАЯ база объектов (ниже).',
    'Задача: выбрать ВСЕ подходящие объекты под запрос пользователя.',
    'Верни ТОЛЬКО JSON:',
    '{ "selectedPropertyIds": [числа], "responseText": "краткий текст" }'
  ].join('\n');

  const userMessage = [
    `Запрос пользователя: "${userText}"`,
    'База (ID | тип | район | цена | спальни | площадь | статус | бассейн | описание):',
    propertiesContext
  ].join('\n');

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.2,
    max_tokens: 600
  });

  const content = completion.choices?.[0]?.message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const ids = Array.isArray(parsed.selectedPropertyIds) ? parsed.selectedPropertyIds : [];
    const selected = ids
      .map(idx => items.find(p => p.idx === Number(idx)))
      .filter(Boolean)
      .slice(0, 10)
      .map(p => ({ id: p.id, ...p }));
    return {
      properties: selected,
      text: typeof parsed.responseText === 'string' && parsed.responseText.trim() ? parsed.responseText.trim() : null,
    };
  } catch (_) {
    return null;
  }
}

function summarizeResultsText(properties, original, language = 'ru') {
  const t = botTranslations[language] || botTranslations.ru;
  
  if (properties.length === 0) {
    return `${t.noResults}\n\n${t.yourQuery} \n"${original}"`;
  }
  
  // Локализуем районы и типы
  const uniqueDistricts = [...new Set(properties.map(p => p.district).filter(Boolean))];
  const localizedDistricts = uniqueDistricts.map(d => translateDistrict(d, language)).join(', ');
  
  const uniqueTypes = [...new Set(properties.map(p => p.type).filter(Boolean))];
  const localizedTypes = uniqueTypes.map(t => translatePropertyType(t, language)).join(', ');
  
  // Диапазон цен
  const prices = properties.map(p => typeof p.price === 'number' ? p.price : Number(p.price) || 0).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  
  // Диапазон площадей
  const areas = properties.map(p => typeof p.area === 'number' ? p.area : Number(p.area) || 0).filter(a => a > 0);
  const minArea = areas.length > 0 ? Math.min(...areas) : 0;
  const maxArea = areas.length > 0 ? Math.max(...areas) : 0;
  
  // Спальни
  const bedrooms = [...new Set(properties.map(p => parseInt(p.bedrooms, 10)).filter(b => !isNaN(b) && b > 0))].sort((a, b) => a - b);
  const bedroomsText = bedrooms.length > 0 ? bedrooms.join(', ') : '—';
  
  // Статусы
  const uniqueStatuses = [...new Set(properties.map(p => p.status).filter(Boolean))];
  console.log('[aiAssistantBot] Original statuses:', uniqueStatuses, 'Language:', language);
  const localizedStatuses = uniqueStatuses.map(s => {
    const translated = translateStatus(s, language);
    console.log('[aiAssistantBot] Status translation:', s, '->', translated);
    return translated;
  }).join(', ');
  
  // Количество с бассейном
  const withPoolCount = properties.filter(p => p.pool && p.pool !== 'Нет').length;
  
  // Склонения для русского языка
  let suffix = '';
  let suffix2 = '';
  if (language === 'ru') {
    suffix = properties.length === 1 ? 'ий' : 'их';
    suffix2 = properties.length === 1 ? '' : '(а)';
  } else if (language === 'en') {
    suffix = properties.length === 1 ? 'y' : 'ies';
  }
  
  let result = t.foundResults.replace('{count}', properties.length).replace('{suffix}', suffix).replace('{suffix2}', suffix2) + '\n\n';
  
  // Добавляем информацию
  if (localizedTypes) result += t.types.replace('{types}', localizedTypes) + '\n';
  if (localizedDistricts) result += t.districts.replace('{districts}', localizedDistricts) + '\n';
  if (prices.length > 0) {
    if (minPrice === maxPrice) {
      result += t.priceRange.replace('{min}', formatMoneyUSD(minPrice)).replace(' - {max}', '') + '\n';
    } else {
      result += t.priceRange.replace('{min}', formatMoneyUSD(minPrice)).replace('{max}', formatMoneyUSD(maxPrice)) + '\n';
    }
  }
  if (bedroomsText !== '—') result += t.bedrooms.replace('{bedrooms}', bedroomsText) + '\n';
  if (areas.length > 0) {
    if (minArea === maxArea) {
      result += t.areas.replace('{min}', Math.round(minArea)).replace(' - {max}', '') + '\n';
    } else {
      result += t.areas.replace('{min}', Math.round(minArea)).replace('{max}', Math.round(maxArea)) + '\n';
    }
  }
  if (localizedStatuses) result += t.statuses.replace('{statuses}', localizedStatuses) + '\n';
  if (withPoolCount > 0) result += t.withPool.replace('{count}', withPoolCount) + '\n';
  
  result += '\n' + t.seeCardsBelow;
  
  return result;
}

function buildPropertyCaption(p, language = 'ru') {
  const price = formatMoneyUSD(p.price);
  const district = p.district || '';
  const type = p.type || p.propertyType || '';
  const bedroomsNum = parseInt(p.bedrooms, 10);
  const areaNum = typeof p.area === 'number' ? p.area : Number(p.area) || undefined;
  const status = p.status || '';
  const parts = [];
  
  // Локализуем тип и район
  const localizedType = translatePropertyType(type, language);
  const localizedDistrict = translateDistrict(district, language);
  
  // Локализованные предлоги и единицы измерения
  const locationPrep = language === 'ru' ? 'в ' : (language === 'en' ? 'in ' : 'di ');
  const bedroomsUnit = language === 'ru' ? 'сп' : (language === 'en' ? 'br' : 'kt');
  const areaUnit = language === 'ru' ? 'м²' : (language === 'en' ? 'm²' : 'm²');
  
  parts.push(`<b>${localizedType}</b> ${localizedDistrict ? locationPrep + localizedDistrict : ''} — <b>${price}</b>`);
  const line2 = [
    Number.isFinite(bedroomsNum) ? `${bedroomsNum} ${bedroomsUnit}` : null,
    Number.isFinite(areaNum) ? `${Math.round(areaNum)} ${areaUnit}` : null,
    status || null,
  ].filter(Boolean).join(' · ');
  if (line2) parts.push(line2);
  // По умолчанию ОТКЛЮЧАЕМ длинные описания для исключения путаницы
  if (process.env.BOT_INCLUDE_DESCRIPTION === 'true') {
    const short = (p.description || '').toString().trim();
    if (short) parts.push(short.length > 400 ? short.slice(0, 397) + '…' : short);
  }
  return parts.join('\n');
}

async function getImageUrl(property) {
  // Собираем кандидаты из разных возможных полей
  const candidates = [];
  const pushUrl = (val) => {
    if (!val) return;
    if (typeof val === 'string') candidates.push(val);
    else if (typeof val === 'object') {
      for (const key of ['url', 'src', 'href']) {
        if (typeof val[key] === 'string') candidates.push(val[key]);
      }
    }
  };

  // images: массив строк/объектов ИЛИ единичная строка
  if (Array.isArray(property.images)) {
    property.images.forEach(pushUrl);
  } else if (typeof property.images === 'string') {
    pushUrl(property.images);
  }
  // возможные альтернативные поля
  ['image', 'mainImage', 'coverImage', 'preview', 'thumbnail'].forEach((k) => pushUrl(property[k]));

  for (let raw of candidates) {
    if (!raw) continue;
    // Поддержка формата "thumb||full"
    if (typeof raw === 'string' && raw.includes('||')) {
      const parts = raw.split('||');
      raw = parts[1] || parts[0];
    }
    let url = (raw || '').toString().trim();
    if (!url) continue;

    // Поддержка gs://bucket/path → подпиcанная ссылка
    if (/^gs:\/\//i.test(url)) {
      try {
        const without = url.replace(/^gs:\/\//i, '');
        const idx = without.indexOf('/');
        if (idx > 0) {
          const bucketName = without.slice(0, idx);
          const filePath = without.slice(idx + 1);
          const bucket = admin.storage().bucket(bucketName || getDefaultBucketName());
          const [signed] = await bucket.file(filePath).getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
          if (signed) return signed;
        }
      } catch (_) {}
      continue;
    }

    // Если это Firebase Storage REST URL — сразу пробуем получить подписанную ссылку через дефолтный bucket
    if (/firebasestorage\.googleapis\.com\/v0\/b\//i.test(url)) {
      try {
        const m2 = url.match(/\/o\/([^?]+)/);
        if (m2) {
          const filePath2 = decodeURIComponent(m2[1]);
          const [signed2] = await admin.storage().bucket(getDefaultBucketName()).file(filePath2).getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
          if (signed2) return signed2;
        }
      } catch (_) {}
      // На всякий случай добавляем alt=media (если подпись не удалась)
      if (!/alt=media/i.test(url)) {
        url += (url.includes('?') ? '&' : '?') + 'alt=media';
      }
    }

    if (/^https?:\/\//i.test(url)) {
      // Пропускаем явные изображения/Cloudinary/Storage
      if (/\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(url)) return url;
      if (url.includes('res.cloudinary.com') || url.includes('storage.googleapis.com') || url.includes('firebasestorage.googleapis.com')) return url;

      // Если это страница, попробуем превратить в прямой файл известного провайдера (минимально)
      // иначе пропускаем к подписи ниже
    }

    // Пытаемся получить подписанную ссылку из GCS, если это Firebase Storage URL формата /v0/b/.../o/...
    const m = url.match(/\/o\/([^?]+)/);
    const bucketMatch = url.match(/\/v0\/b\/([^/]+)\//);
    if (m) {
      try {
        const filePath = decodeURIComponent(m[1]);
        // Всегда подписываем через дефолтный bucket проекта — Telegram требует прямой контент
        const bucket = admin.storage().bucket(getDefaultBucketName());
        const [signed] = await bucket.file(filePath).getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
        if (signed) return signed;
      } catch (_) {}
    }
  }
  return null;
}

// HTTPS Function: Webhook нового бота ИИ ассистента
const aiAssistantTelegramWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  if (!getBotToken()) {
    return res.status(500).send('Bot token is not configured');
  }

  try {
    const update = req.body;
    
    // Обработка callback query (нажатие на inline кнопки)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;
      
      if (data.startsWith('neighbors_yes_')) {
        try {
          const jsonData = data.replace('neighbors_yes_', '');
          const parsed = JSON.parse(jsonData);
          const { districts, criteria } = parsed;
          
          // Выполняем поиск по соседним районам
          const searchCriteria = { ...criteria, districts };
          const properties = await searchProperties(searchCriteria);
          
          const detectedLanguage = detectLanguage(callbackQuery.message.text || 'ru');
          const summary = summarizeResultsText(properties, `поиск в районах: ${districts.join(', ')}`, detectedLanguage);
          
          await sendTelegramMessage(chatId, summary);
          
        } catch (error) {
          console.error('[aiAssistantBot] Callback processing error:', error);
          await sendTelegramMessage(chatId, 'Произошла ошибка при обработке запроса');
        }
      } else if (data === 'neighbors_no') {
        const t = botTranslations.ru; // можно улучшить определение языка
        await sendTelegramMessage(chatId, 'Попробуйте уточнить запрос или выбрать другой район');
      }
      
      return res.status(200).send('OK');
    }
    
    const message = update && update.message;
    if (!message || !message.chat || !message.chat.id) {
      return res.status(200).send('OK');
    }

    const chatId = message.chat.id;
    const text = message.text || '';

    // Обрабатываем только текстовые запросы
    if (typeof text === 'string' && text.trim().length > 0) {
      // Определяем язык запроса
      const detectedLanguage = detectLanguage(text);
      const t = botTranslations[detectedLanguage] || botTranslations.ru;
      
      try {
        // Сначала анализируем запрос с помощью ИИ
        const aiCriteria = await analyzeRequestWithAI(text, detectedLanguage);
        console.log('[aiAssistantBot] AI criteria:', aiCriteria);
        
        // Если ИИ определил конкретные районы, используем их
        let searchResult;
        if (aiCriteria.districts && aiCriteria.districts.length > 0) {
          const properties = await searchProperties(aiCriteria);
          searchResult = {
            properties,
            message: aiCriteria._aiReasoning || null,
            type: 'ai_search'
          };
        } else {
          // Fallback на старую логику, если ИИ не определил районы
          searchResult = await smartSearchProperties(text, detectedLanguage);
        }
        
        if (searchResult.type === 'suggest_neighbors') {
          // Предлагаем соседние районы
          const keyboard = {
            inline_keyboard: [[
              { text: t.confirmNeighbors, callback_data: `neighbors_yes_${JSON.stringify({
                districts: searchResult.suggestedDistricts,
                criteria: searchResult.originalCriteria
              })}` },
              { text: t.declineNeighbors, callback_data: 'neighbors_no' }
            ]]
          };
          
          await sendTelegramMessage(chatId, searchResult.message, keyboard);
          return res.status(200).send('OK');
        }
        
        let properties = searchResult.properties;
        
        // Если есть объекты, пробуем улучшить результат с помощью ИИ
        if (properties.length > 0) {
          try {
            const picked = await selectWithAI(text, properties);
            if (picked && picked.properties && picked.properties.length > 0) {
              properties = picked.properties;
            }
          } catch (e) {
            console.error('[aiAssistantBot] AI selection error:', e);
          }
        }

        // Формируем ответ
        let responseText = '';
        if (searchResult.message) {
          responseText = searchResult.message + '\n\n';
        }
        
        if (properties.length > 0) {
          responseText += summarizeResultsText(properties, text, detectedLanguage);
        } else {
          responseText += t.noResults + '\n\n' + t.yourQuery + '\n"' + text + '"';
        }
        
        // Отправляем основной ответ
        if (properties.length > 0) {
          const propertyIds = properties.map(p => p.id).join(',');
          const webAppUrl = `${process.env.PUBLIC_GALLERY_BASE_URL || 'https://it-agent.pro'}/?selection=${encodeURIComponent(propertyIds)}`;
          const openSelectionKeyboard = {
            inline_keyboard: [[
              { text: t.openSelection, web_app: { url: webAppUrl } }
            ]]
          };
          
          await sendTelegramMessage(chatId, responseText, openSelectionKeyboard);
        } else {
          await sendTelegramMessage(chatId, responseText);
        }
      } catch (error) {
        console.error('[aiAssistantBot] Smart search error:', error);
        // Фоллбек на старую логику
        const criteria = analyzeUserRequest(text);
        const properties = await searchProperties(criteria);
        const summary = summarizeResultsText(properties, text, detectedLanguage);
        await sendTelegramMessage(chatId, summary);
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('[aiAssistantBot] webhook error:', err);
    return res.status(200).send('OK');
  }
});

// Callable: Установка вебхука (по запросу; безопасно вызывать вручную)
const aiAssistantSetWebhook = functions.https.onCall(async (data, context) => {
  const botToken = getBotToken();
  if (!botToken) {
    throw new functions.https.HttpsError('failed-precondition', 'Bot token is not configured');
  }
  const url = (data && (data.url || (data.data && data.data.url))) || null;
  if (!url) {
    throw new functions.https.HttpsError('invalid-argument', 'Укажите url вебхука');
  }
  const resp = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  const result = await resp.json();
  if (!resp.ok) {
    console.error('[aiAssistantBot] setWebhook error:', result);
    throw new functions.https.HttpsError('internal', result.description || 'Telegram API error');
  }
  return { success: true, result };
});

module.exports = {
  aiAssistantTelegramWebhook,
  aiAssistantSetWebhook,
};


