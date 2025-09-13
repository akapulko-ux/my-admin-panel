const functions = require('firebase-functions');
const admin = require('firebase-admin');
const speech = require('@google-cloud/speech');
const { cacheGet, cacheSet } = require('./utils/cache');
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

// =======================
// Память диалога (per chat)
// =======================
function getConversationRef(chatId) {
  return getDb().collection('botConversations').doc(String(chatId));
}

async function readConversation(chatId) {
  try {
    const ref = getConversationRef(chatId);
    const snap = await ref.get();
    return snap.exists ? (snap.data() || {}) : {};
  } catch (_) {
    return {};
  }
}

async function writeConversation(chatId, update) {
  try {
    const ref = getConversationRef(chatId);
    await ref.set({
      ...update,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (_) {}
}

function mergeCriteriaWithMemory(memory, criteria) {
  const merged = { ...(criteria || {}) };
  if (!merged.propertyType && memory.propertyType) merged.propertyType = memory.propertyType;
  if (!merged.minPrice && Number.isFinite(memory.minPrice)) merged.minPrice = memory.minPrice;
  if (!merged.maxPrice && Number.isFinite(memory.maxPrice)) merged.maxPrice = memory.maxPrice;
  if (!merged.bedrooms && Number.isFinite(memory.bedrooms)) merged.bedrooms = memory.bedrooms;
  if (!merged.minArea && Number.isFinite(memory.minArea)) merged.minArea = memory.minArea;
  if (!merged.hasPool && typeof memory.hasPool === 'boolean') merged.hasPool = memory.hasPool;
  if ((!merged.districts || merged.districts.length === 0) && Array.isArray(memory.districts) && memory.districts.length > 0) {
    merged.districts = memory.districts;
  }
  return merged;
}

function deriveClarifyingHints(criteria, resultsCount) {
  const hints = [];
  if (!criteria.propertyType) hints.push('тип: Вилла / Апартаменты');
  if (!criteria.maxPrice) hints.push('бюджет: до $300k / до $500k');
  if (!criteria.bedrooms) hints.push('кол-во спален: 1 / 2 / 3+');
  if (!criteria.districts || criteria.districts.length === 0) hints.push('район: Букит / Санур / Семиньяк');
  if (resultsCount > 30) hints.push('сузить район или бюджет');
  return hints.slice(0, 3);
}

async function composeConversationalReply(userText, language, aiCriteria, results, mode = 'auto') {
  const apiKey = process.env.OPENAI_API_KEY;
  const resultsCount = Array.isArray(results) ? results.length : 0;
  const hints = deriveClarifyingHints(aiCriteria || {}, resultsCount);
  const fallback = () => {
    const parts = [];
    parts.push('Я понял запрос и подобрал варианты.');
    if (resultsCount > 0) parts.push(`Нашёл ${resultsCount} подходящих вариантов.`);
    if (hints.length > 0) parts.push(`Уточните: ${hints.join(' | ')}`);
    return parts.join(' ');
  };
  if (!apiKey || !OpenAI) return fallback();
  try {
    const client = new OpenAI({ apiKey });
    const sys = [
      'Ты вежливый, краткий и говоришь как человек, без канцелярита.',
      'Всегда сначала подтверждай, что понял запрос, затем коротко расскажи логику подбора (1–2 предложения).',
      'Разрешён ОДИН уточняющий вопрос и ТОЛЬКО из списка: район/регион, бюджет, количество спален, у моря (да/нет), ориентировочная площадь. Запрещено спрашивать про стиль/дизайн/вид/материалы и т.п.',
      'Строгое правило: НЕ придумывай параметры (бюджет, спальни, районы, площадь, статус), если пользователь их не указывал явно. Если параметр отсутствует в критериях, не упоминай его.',
      'Не перечисляй конкретные районы, если они не заданы в критериях. Используй нейтрально: "подходящих районах Бали".',
      'Не делай выводов о цене/количестве спален без явных чисел в запросе.',
      'Не отправляй карточки/фото. Только текст. Максимум 3–5 предложений.'
    ].join('\n');
    const usr = [
      `Язык ответа: ${language || 'ru'}.`,
      `Запрос пользователя: "${userText}"`,
      `Критерии ИИ: ${JSON.stringify(aiCriteria || {})}`,
      `Кол-во найденных: ${resultsCount}`,
      `Подсказки для уточнения: ${hints.join(' | ') || 'нет'}`
    ].join('\n');
    const c = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: usr }
      ],
      temperature: 0.5,
      max_tokens: 220
    });
    return (c.choices?.[0]?.message?.content || '').trim() || fallback();
  } catch (_) {
    return fallback();
  }
}

// LLM-классификация интента: 'search' | 'smalltalk' | 'help' | 'goodbye' | 'thanks'
async function classifyIntentWithLLM(userText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !OpenAI) return null;
  try {
    const client = new OpenAI({ apiKey });
    const system = [
      'Classify user message into one of intents: search, smalltalk, help, goodbye, thanks.',
      'Return ONLY JSON: {"intent":"search|smalltalk|help|goodbye|thanks"}.',
      'Use search ONLY if the user asks about real estate, properties, areas, prices, budgets, villas, apartments, or related criteria. Otherwise smalltalk.'
    ].join('\n');
    const user = `Message: "${(userText || '').toString()}"`;
    const c = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [ { role: 'system', content: system }, { role: 'user', content: user } ],
      temperature: 0,
      max_tokens: 60
    });
    const content = c.choices?.[0]?.message?.content || '';
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    const intent = (parsed && typeof parsed.intent === 'string') ? parsed.intent.toLowerCase() : null;
    if (['search','smalltalk','help','goodbye','thanks'].includes(intent)) return intent;
    return null;
  } catch (_) {
    return null;
  }
}

// Полноценный smalltalk ответ с LLM (без запуска подбора)
async function composeSmalltalkReply(userText, language) {
  const apiKey = process.env.OPENAI_API_KEY;
  const lang = (language || 'ru').toLowerCase();
  const fallbackByLang = {
    ru: 'Привет! Чем могу помочь? Я подбираю недвижимость на Бали по простому описанию. Расскажите, что важно: район, бюджет, у моря, спальни?',
    en: 'Hi! How can I help? I can find Bali properties from plain text. What matters: area, budget, coastal, bedrooms?',
    id: 'Halo! Bisa bantu apa? Saya memilih properti Bali dari teks. Apa penting: area, budget, dekat pantai, kamar tidur?'
  };
  const fallback = fallbackByLang[lang] || fallbackByLang.ru;
  if (!apiKey || !OpenAI) return fallback;
  try {
    const client = new OpenAI({ apiKey });
    const sys = [
      'You are a friendly real-estate AI assistant for Bali.',
      'Respond naturally and briefly (2–4 sentences), like a human.',
      'Acknowledge the user message, then gently offer help about property search (area, budget, coastal, bedrooms).',
      'Do NOT send cards or photos. Text only.'
    ].join('\n');
    const usr = `Language: ${lang}. User: "${(userText || '').toString()}"`;
    const c = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [ { role: 'system', content: sys }, { role: 'user', content: usr } ],
      temperature: 0.7,
      max_tokens: 220
    });
    const content = (c.choices?.[0]?.message?.content || '').trim();
    return content || fallback;
  } catch (_) {
    return fallback;
  }
}

// RAG: поиск релевантных чанков из БЗ и сбор контекста
async function fetchKnowledgeContext(queryText, language, tenantId) {
  try {
    if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) return [];
    const { getEmbedding } = require('./utils/embeddings');
    const { searchSimilarIn } = require('./utils/qdrant');
    const KB_COLLECTION = process.env.QDRANT_KB_COLLECTION || 'knowledge_kb';
    const vec = await getEmbedding(String(queryText || ''));
    const must = [];
    if (tenantId) must.push({ key: 'tenantId', match: { value: tenantId } });
    if (language) must.push({ key: 'locale', match: { value: language } });
    const filter = must.length ? { must } : null;
    const resp = await searchSimilarIn(KB_COLLECTION, vec, Number(process.env.KB_TOP_K || 20), filter);
    const points = Array.isArray(resp) ? resp : (resp?.result || []);
    const chunks = points.map(p => ({
      docId: p?.payload?.docId,
      title: p?.payload?.title,
      score: p?.score
    })).filter(c => c.docId);
    return chunks;
  } catch (e) {
    console.error('[RAG] fetchKnowledgeContext error:', e);
    return [];
  }
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
  
  // Определяем язык по наибольшему счету (фикс: при равенстве латиницы — английский)
  if (russianScore > englishScore && russianScore > indonesianScore) {
    return 'ru';
  }
  if (englishScore >= indonesianScore && englishScore > 0) {
    return 'en';
  }
  if (indonesianScore > englishScore) {
    return 'id';
  }
  
  // По умолчанию русский (если ничего не определилось)
  return 'ru';
}

// =======================
// Intent detection (простая, быстрая)
// =======================
function detectUserIntent(text) {
  const s = (text || '').trim().toLowerCase();
  const isGreeting = /\b(привет|здравствуй|здравствуйте|добрый день|доброе утро|добрый вечер|hi|hello|hey|halo|selamat (pagi|siang|sore|malam))\b/i.test(s);
  if (isGreeting) return 'greeting';
  const isThanks = /(спасибо|благодарю|thanks|thank you|terima kasih|makasih)/i.test(s);
  if (isThanks) return 'thanks';
  const isGoodbye = /(пока|до свидания|bye|see you|sampai jumpa)/i.test(s);
  if (isGoodbye) return 'goodbye';
  const isHelp = /(что умеешь|помощь|help|как пользоваться|что ты умеешь|возможности|инструкция|что можно)/i.test(s);
  if (isHelp) return 'help';
  const hasRealEstateSignals = /(вил(ла|лы)|apartment|апартам|дом|house|квартира|земля|участок|budget|бюджет|цена|$\s*\d|\d+\s*\$|спальн|bedroom|район|district|у моря|пляж|букит|bukit|sem(inyak)?|canggu|uluwatu|jimbaran|sanur|nusa dua|kuta|legian|bingin|dreamland|balangan)/i.test(s);
  return hasRealEstateSignals ? 'search' : 'smalltalk';
}

function buildHumanReply(intent, language = 'ru') {
  const lang = (language || 'ru').toLowerCase();
  const L = {
    ru: {
      greeting: 'Привет! Чем могу помочь? Могу: 1) умный поиск по тексту, 2) показать список объектов, 3) подобрать под бюджет/район. Расскажите, что важно для вас?',
      thanks: 'Пожалуйста! Нужна ещё помощь с подборкой или хотите посмотреть список объектов?',
      goodbye: 'Хорошего дня! Если понадобится подборка — просто напишите.',
      help: 'Я могу: 1) сделать умный поиск недвижимости по простому тексту; 2) показать список объектов; 3) подобрать под бюджет, район, спальни, "у моря" и т.д. Напишите, что для вас важнее всего.'
    },
    en: {
      greeting: 'Hi! How can I help? I can: 1) smart text search, 2) show full properties list, 3) tailor to your budget/area. What matters to you?',
      thanks: 'You\'re welcome! Need another selection or see the properties list?',
      goodbye: 'Have a great day! Text me anytime for a new selection.',
      help: 'I can: 1) do smart property search from plain text; 2) show the full list; 3) tailor by budget, area, bedrooms, coastal, etc. What\'s your priority?'
    },
    id: {
      greeting: 'Halo! Bisa bantu apa? Saya bisa: 1) pencarian pintar dengan teks, 2) daftar properti lengkap, 3) rekomendasi sesuai budget/area. Apa yang paling penting?',
      thanks: 'Sama-sama! Perlu seleksi lain atau lihat daftar properti?',
      goodbye: 'Semoga harimu menyenangkan! Tulis kapan saja jika perlu seleksi.',
      help: 'Saya bisa: 1) pencarian properti pintar dari teks; 2) daftar lengkap; 3) sesuaikan budget, area, kamar tidur, dekat pantai, dll. Apa prioritasmu?'
    }
  };
  const T = L[lang] || L.ru;
  if (intent === 'greeting') return T.greeting;
  if (intent === 'thanks') return T.thanks;
  if (intent === 'goodbye') return T.goodbye;
  if (intent === 'help') return T.help;
  // smalltalk fallback
  return T.greeting;
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
async function sendTelegramMessage(chatId, text, replyMarkup = null, tokenOverride = null) {
  const botToken = tokenOverride || getBotToken();
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

// Загрузка файла из Telegram по file_id
async function fetchTelegramFileBuffer(fileId) {
  const botToken = getBotToken();
  if (!botToken || !fileId) throw new Error('MISSING_TOKEN_OR_FILE_ID');
  const fileResp = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const fileJson = await fileResp.json();
  if (!fileResp.ok || !fileJson.ok || !fileJson.result || !fileJson.result.file_path) {
    throw new Error('TELEGRAM_GET_FILE_FAILED');
  }
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileJson.result.file_path}`;
  const binResp = await fetch(fileUrl);
  if (!binResp.ok) throw new Error('TELEGRAM_FILE_DOWNLOAD_FAILED');
  const buf = Buffer.from(await binResp.arrayBuffer());
  return buf;
}

// Распознавание речи с помощью Google Cloud Speech (OGG_OPUS)
async function transcribeTelegramVoice(fileId) {
  const buf = await fetchTelegramFileBuffer(fileId);
  const client = new speech.SpeechClient();
  const audioBytes = buf.toString('base64');
  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: 'OGG_OPUS',
      sampleRateHertz: 48000,
      audioChannelCount: 1,
      enableAutomaticPunctuation: true,
      languageCode: 'ru-RU',
      alternativeLanguageCodes: ['en-US', 'id-ID']
    }
  };
  const [response] = await client.recognize(request);
  const transcription = (response.results || [])
    .map(r => r.alternatives && r.alternatives[0] && r.alternatives[0].transcript || '')
    .filter(Boolean)
    .join(' ')
    .trim();
  return transcription || '';
}

// Индикация набора текста ("печатает...")
async function sendTyping(chatId, tokenOverride = null) {
  const botToken = tokenOverride || getBotToken();
  if (!botToken) throw new Error('BOT_TOKEN_MISSING');
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' })
    });
  } catch (_) { /* игнорируем */ }
}

// Запускает цикл отправки "typing" каждые ~4s до остановки
function startTypingLoop(chatId, tokenOverride = null) {
  let stopped = false;
  async function tick() {
    if (stopped) return;
    try { await sendTyping(chatId, tokenOverride); } catch (_) {}
    setTimeout(tick, 4000);
  }
  tick();
  return () => { stopped = true; };
}

// Утилита: отправка фото-карточки объекта
async function sendTelegramPhoto(chatId, photoUrl, caption, replyMarkup = null, tokenOverride = null) {
  const botToken = tokenOverride || getBotToken();
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

// Поиск в Firestore по критериям (всё критичное фильтруем локально, чтобы не терять объекты из‑за разных записей в БД)
async function searchProperties(criteria) {
  const db = getDb();

  // Расширяем лимит, если есть множественные районы/абстрактные запросы
  const fetchLimit = Array.isArray(criteria.districts) && criteria.districts.length > 0 ? 800 : 500;

  // Загружаем общий пул объектов и фильтруем локально по канонам (тип/район/статус могут быть записаны по‑разному)
  const snap = await db.collection('properties').limit(fetchLimit).get();
  let items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
      ['легиан','lgn:legian'], ['legian','lgn:legian'],
      ['бингин','bgn:bingin'], ['bingin','bgn:bingin'],
      ['дримленд','drm:dreamland'], ['dreamland','drm:dreamland'],
      ['баланган','blg:balangan'], ['balangan','blg:balangan'],
      ['пекату','pct:pecatu'], ['pecatu','pct:pecatu']
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
  // Возвращаем больше результатов, чтобы покрыть больше районов и объектов
  return filtered.slice(0, 30);
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
  // Кэш по ключу запроса (упрощенно)
  const cacheKey = `rag:props:${JSON.stringify(criteria)}`;
  const cached = await cacheGet(cacheKey);
  if (cached && Array.isArray(cached)) return cached;
  const properties = await searchProperties(criteria);
  await cacheSet(cacheKey, properties);
  
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
  
  return uniqueProperties.slice(0, 30);
}

function formatMoneyUSD(n) {
  const val = typeof n === 'number' ? n : Number(n) || 0;
  return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

// ====== Новый LLM-пайплайн отбора ======
function getRegionForDistrict(district) {
  const name = (district || '').toString();
  for (const [regionKey, regionData] of Object.entries(baliGeography.regions || {})) {
    if (Array.isArray(regionData.districts) && regionData.districts.includes(name)) return regionKey;
  }
  return 'Unknown';
}

function deriveDistrictTags(rawDistrict) {
  const district = (rawDistrict || '').toString();
  const tags = [];
  // Признаки побережья
  const info = (baliGeography.districts && baliGeography.districts[district]) || null;
  if (info && info.coastline === true) tags.push('coastal');
  // Букит
  if (baliGeography.regions && baliGeography.regions.Bukit && baliGeography.regions.Bukit.districts.includes(district)) {
    tags.push('bukit');
  }
  // Атмосфера
  if (info && typeof info.atmosphere === 'string') {
    const a = info.atmosphere.toLowerCase();
    if (a.includes('surf')) tags.push('surf');
    if (a.includes('nightlife')) tags.push('nightlife');
    if (a.includes('family')) tags.push('family');
    if (a.includes('quiet')) tags.push('quiet');
    if (a.includes('luxury')) tags.push('luxury');
  }
  return tags;
}

function derivePriceBand(price) {
  const p = typeof price === 'number' ? price : Number(price) || 0;
  if (p >= 700000) return 'lux';
  if (p >= 300000) return 'mid';
  return 'budget';
}

function generateCandidateLine(p) {
  const id = p.id || '';
  const type = (p.type || p.propertyType || '').toString();
  const district = (p.district || '').toString();
  const region = getRegionForDistrict(district);
  const price = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
  const bedrooms = parseInt(p.bedrooms, 10);
  const area = typeof p.area === 'number' ? p.area : Number(p.area) || 0;
  const status = (p.status || '').toString();
  const pool = p.pool ? 'Да' : 'Нет';
  const tags = [...deriveDistrictTags(district), derivePriceBand(price)];
  const desc = (p.description || '').toString().replace(/\s+/g, ' ').slice(0, 80);
  const coastal = (baliGeography.districts && baliGeography.districts[district]?.coastline) ? 'true' : 'false';
  return `ID:${id} | ${type} | ${district} | region:${region} | coastal:${coastal} | $${price} | ${Number.isFinite(bedrooms) ? bedrooms + ' сп' : ''} | ${area} м² | ${status} | Бассейн:${pool} | tags:${tags.join(',')} | ${desc}...`;
}

// Канонизация названия района для сопоставления (англ/рус варианты → единый ключ)
function canonicalDistrictKey(raw) {
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
    ['легиан','lgn:legian'], ['legian','lgn:legian'],
    ['бингин','bgn:bingin'], ['bingin','bgn:bingin'],
    ['дримленд','drm:dreamland'], ['dreamland','drm:dreamland'],
    ['баланган','blg:balangan'], ['balangan','blg:balangan'],
    ['унгасан','ugs:ungasan'], ['ungasan','ugs:ungasan'],
    ['пекату','pct:pecatu'], ['pecatu','pct:pecatu'],
    ['нуану','nnu:nuanu'], ['nuanu','nnu:nuanu'],
    ['денпасар','dps:denpasar'], ['denpasar','dps:denpasar'],
    ['табанан','tbn:tabanan'], ['tabanan','tbn:tabanan']
  ]);
  for (const [k, v] of map.entries()) { if (t.includes(k)) return v; }
  return t;
}

// Диагностика: гистограмма по районам
function districtsHistogram(items) {
  const map = new Map();
  for (const p of Array.isArray(items) ? items : []) {
    const k = canonicalDistrictKey(p.district);
    map.set(k, (map.get(k) || 0) + 1);
  }
  const obj = {};
  for (const [k, v] of map.entries()) obj[k || '—'] = v;
  return obj;
}

async function loadCandidatesForAI(baseLimit = 1200) {
  const db = getDb();
  const snap = await db.collection('properties').limit(baseLimit).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// RAG: Загрузка кандидатов через Qdrant (если доступен)
async function loadCandidatesViaQdrant(userText, aiCriteria = {}, topK = 300) {
  try {
    if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) return null;
    const { getEmbedding } = require('./utils/embeddings');
    const { searchSimilar } = require('./utils/qdrant');
    const vec = await getEmbedding(String(userText || ''));

    // Ограничение по районам (если задано ИИ или по ключевым словам)
    let restrictDistricts = null;
    const lower = (userText || '').toLowerCase();
    const coastalDistricts = ['Seminyak','Canggu','Pererenan','Kuta','Legian','Uluwatu','Jimbaran','Sanur','Nusa Dua','Bingin','Dreamland','Balangan'];
    const bukitDistricts = ['Uluwatu','Ungasan','Jimbaran','Nusa Dua','Pecatu','Bingin','Dreamland','Balangan'];
    if (Array.isArray(aiCriteria?.districts) && aiCriteria.districts.length > 0) {
      restrictDistricts = aiCriteria.districts;
    } else if (/(букит|bukit)/i.test(lower)) {
      restrictDistricts = bukitDistricts;
    } else if (/(море|пляж|берег|coast|beach)/i.test(lower)) {
      restrictDistricts = coastalDistricts;
    }

    const filter = restrictDistricts ? { must: [ { key: 'district', match: { any: restrictDistricts } } ] } : null;
    const resp = await searchSimilar(vec, Math.min(topK, 400), filter);
    const points = Array.isArray(resp) ? resp : (resp?.result || []);
    const ids = points
      .map(p => (p?.payload && (p.payload.docId || p.payload.id)) || p?.id)
      .filter(Boolean)
      .map(String);

    if (ids.length === 0) return [];

    // Загружаем документы из Firestore, сохраняя порядок ранжирования
    const admin = require('firebase-admin');
    const db = getDb();
    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
    const results = [];
    for (const chunk of chunks) {
      try {
        const snap = await db.collection('properties')
          .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        snap.docs.forEach(d => results.push({ id: d.id, ...d.data() }));
      } catch (e) {
        // Если IN превысил лимит или возникла ошибка — догружаем по одному
        for (const id of chunk) {
          try {
            const d = await db.collection('properties').doc(id).get();
            if (d.exists) results.push({ id: d.id, ...d.data() });
          } catch (_) {}
        }
      }
    }
    const order = new Map(ids.map((id, idx) => [String(id), idx]));
    results.sort((a, b) => (order.get(String(a.id)) ?? 1e9) - (order.get(String(b.id)) ?? 1e9));
    return results;
  } catch (e) {
    console.error('[RAG] loadCandidatesViaQdrant error:', e);
    return null;
  }
}

// Стратифицированная выборка по районам (по N кандидатов из каждого района)
async function loadCandidatesViaQdrantStratified(userText, districts, perDistrict = 20) {
  try {
    if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) return null;
    const { getEmbedding } = require('./utils/embeddings');
    const { searchSimilar } = require('./utils/qdrant');
    const vec = await getEmbedding(String(userText || ''));
    const uniqueDistricts = Array.from(new Set((districts || []).map(d => String(d))));
    const collected = [];
    const db = getDb();
    for (const d of uniqueDistricts) {
      try {
        const filter = { must: [ { key: 'district', match: { value: d } } ] };
        const resp = await searchSimilar(vec, Math.max(perDistrict * 2, perDistrict), filter);
        const points = Array.isArray(resp) ? resp : (resp?.result || []);
        const ids = points
          .map(p => (p?.payload && (p.payload.docId || p.payload.id)) || p?.id)
          .filter(Boolean)
          .map(String)
          .slice(0, perDistrict);
        const chunkSize = 10;
        for (let i = 0; i < ids.length; i += chunkSize) {
          const chunk = ids.slice(i, i + chunkSize);
          try {
            const snap = await db.collection('properties').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
            snap.docs.forEach(doc => collected.push({ id: doc.id, ...doc.data() }));
          } catch (_) {
            for (const id of chunk) {
              try {
                const one = await db.collection('properties').doc(id).get();
                if (one.exists) collected.push({ id: one.id, ...one.data() });
              } catch (_) {}
            }
          }
        }
      } catch (_) { /* ignore errors per district */ }
    }
    return collected;
  } catch (e) {
    console.error('[RAG] loadCandidatesViaQdrantStratified error:', e);
    return null;
  }
}

async function loadCandidatesHybrid(userText, aiCriteria, baseLimit = 1200) {
  if (process.env.ENABLE_RAG === 'false') {
    return await loadCandidatesForAI(baseLimit);
  }
  const viaQ = await loadCandidatesViaQdrant(userText, aiCriteria, Math.min(baseLimit, 400));
  if (viaQ && viaQ.length > 0) return viaQ;
  return await loadCandidatesForAI(baseLimit);
}

function prefilterCandidatesByStrategy(candidates, strategy) {
  let items = Array.isArray(candidates) ? candidates.slice() : [];
  // Жестко не режем по району — оставляем LLM, но мягко сокращаем по типу/цене/статусу
  if (strategy && strategy.propertyType) {
    items = items.filter(p => {
      const t = (p.type || p.propertyType || '').toString().toLowerCase();
      if (strategy.propertyType === 'Вилла') return /(вил+|villa)/i.test(t);
      if (strategy.propertyType === 'Апартаменты') return /(апарт|apart|apartment)/i.test(t);
      if (strategy.propertyType === 'Дом') return /(дом|house)/i.test(t);
      return true;
    });
  }
  if (strategy && Number.isFinite(strategy.maxPrice)) {
    const max = Number(strategy.maxPrice);
    items = items.filter(p => (typeof p.price === 'number' ? p.price : Number(p.price) || 0) <= max * 1.2);
  }
  if (strategy && Number.isFinite(strategy.minPrice)) {
    const min = Number(strategy.minPrice);
    items = items.filter(p => (typeof p.price === 'number' ? p.price : Number(p.price) || 0) >= min * 0.8);
  }
  return items;
}

async function selectWithAIEnhanced(userText, candidates) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !OpenAI) return null;
  const client = new OpenAI({ apiKey });

  // Компрессируем объекты в строки
  const lines = candidates.map(generateCandidateLine).join('\n');
  const geographyContext = [
    'ГЕОГРАФИЯ:',
    '- Букит (Bukit Peninsula) включает строго: Uluwatu, Ungasan, Jimbaran, Nusa Dua, Pecatu, Bingin, Dreamland, Balangan.',
    '- West Coast: Seminyak, Canggu, Pererenan, Kuta, Legian.',
    '- Central: Ubud, Denpasar, Sanur (у Sanur — побережье, у Ubud/Denpasar — нет).',
    'ВАЖНО: Canggu/Pererenan/Legian — НЕ БУКИТ.',
  ].join('\n');

  const systemPrompt = [
    'Ты — эксперт по недвижимости Бали. Ты работаешь на ЖИВОЙ базе объектов (см. ниже).',
    geographyContext,
    'Цель: выбрать ВСЕ релевантные объекты под смысл запроса. Придерживайся географических ограничений запроса (например, "Букит" должен исключать Canggu/Pererenan и т.п.). Обеспечь разнообразие по районам: не все объекты из одного района.',
    'Выполни самопроверку перед ответом: исключены ли объекты вне требуемых районов/береговости.',
    'Верни ТОЛЬКО JSON (до 30 id):',
    '{ "selectedIds": ["id1","id2", ... до 30], "reason": "почему выбраны эти районы/объекты и чем они соответствуют" }'
  ].join('\n');

  // Явные ограничения из запроса
  const lower = userText.toLowerCase();
  const constraints = {
    requireBukit: /\bбукит\b|\bbukit\b/.test(lower) || false,
    requireCoastal: /(море|пляж|берег|coast|beach)/.test(lower) || false,
  };

  const userMessage = [
    `Запрос: "${userText}"`,
    `Ограничения: ${JSON.stringify(constraints)}`,
    'Кандидаты (ID | тип | район | region | coastal | цена | спальни | площадь | статус | бассейн | tags | desc):',
    lines
  ].join('\n');

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.2,
    max_tokens: 800
  });

  const content = completion.choices?.[0]?.message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const ids = Array.isArray(parsed.selectedIds) ? parsed.selectedIds : [];
    const selected = ids
      .map(id => candidates.find(p => String(p.id) === String(id)))
      .filter(Boolean);
    return { properties: selected.slice(0, 30), reason: parsed.reason || null };
  } catch (_) {
    return null;
  }
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

ЖЁСТКОЕ ПРАВИЛО:
- НИКОГДА не придумывай значения для minPrice/maxPrice/bedrooms/minArea/hasPool/status/districts, если пользователь явно не упомянул эти параметры. В таких случаях ставь null.
- Districts указывай только если район явно присутствует в тексте (или речь о конкретном регионе, например "Букит"). Если запрос просто "у моря" — districts = null (это лишь фильтр берега на этапе подбора, но не список районов).

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
    if (typeof parsed.minPrice === 'number') criteria.minPrice = parsed.minPrice;
    if (typeof parsed.maxPrice === 'number') criteria.maxPrice = parsed.maxPrice;
    if (typeof parsed.bedrooms === 'number') criteria.bedrooms = parsed.bedrooms;
    if (typeof parsed.minArea === 'number') criteria.minArea = parsed.minArea;
    if (typeof parsed.hasPool === 'boolean') criteria.hasPool = parsed.hasPool;
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
      
      if (data === 'choose_lang_en' || data === 'choose_lang_ru' || data === 'choose_lang_id') {
        try {
          const lang = data.endsWith('_en') ? 'en' : data.endsWith('_ru') ? 'ru' : 'id';
          await writeConversation(chatId, { language: lang });
          let stopTyping = startTypingLoop(chatId);
          const reply = await composeSmalltalkReply('Start', lang);
          if (typeof stopTyping === 'function') stopTyping();
          await sendTelegramMessage(chatId, reply);
        } catch (e) {
          console.error('[aiAssistantBot] Language choose error:', e);
          await sendTelegramMessage(chatId, 'Error choosing language. Try again.');
        }
        return res.status(200).send('OK');
      } else if (data.startsWith('neighbors_yes_')) {
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
    const voice = message.voice || null;

    // /start → выбор языка через инлайн‑клавиатуру (English / Русский / Bahasa)
    if (typeof text === 'string' && text.trim().toLowerCase().startsWith('/start')) {
      const keyboard = {
        inline_keyboard: [
          [{ text: 'English', callback_data: 'choose_lang_en' }],
          [{ text: 'Русский', callback_data: 'choose_lang_ru' }],
          [{ text: 'Bahasa', callback_data: 'choose_lang_id' }]
        ]
      };
      await sendTelegramMessage(chatId, 'Please choose language / Выберите язык / Pilih bahasa:', keyboard);
      return res.status(200).send('OK');
    }

    // Если пришёл голос — распознаём в текст
    if (voice && voice.file_id) {
      try {
        // Анти-дубли: не обрабатывать один и тот же voice дважды и не спамить ошибками
        const memForVoice = await readConversation(chatId);
        if (voice.file_unique_id && memForVoice.lastProcessedVoiceId === voice.file_unique_id) {
          return res.status(200).send('OK');
        }
        let stopTyping = startTypingLoop(chatId);
        const transcript = await transcribeTelegramVoice(voice.file_id);
        if (typeof stopTyping === 'function') stopTyping();
        if (transcript && transcript.trim().length > 0) {
          // Подставляем распознанный текст как обычный пользовательский запрос
          message.text = transcript;
          await writeConversation(chatId, { lastProcessedVoiceId: voice.file_unique_id || null, lastVoiceErrorAtMs: null });
        } else {
          // Анти-спам ошибки: не чаще раза в 60с
          const now = Date.now();
          const lastErr = Number(memForVoice.lastVoiceErrorAtMs || 0);
          if (!lastErr || now - lastErr > 60000) {
            await sendTelegramMessage(chatId, 'Не удалось распознать голос. Пожалуйста, повторите и говорите ближе к микрофону.');
            await writeConversation(chatId, { lastVoiceErrorAtMs: now });
          }
          return res.status(200).send('OK');
        }
      } catch (e) {
        console.error('[aiAssistantBot] Voice transcription error:', e);
        // Останавливаем typing и не спамим ошибкой чаще 60с
        try { if (typeof stopTyping === 'function') stopTyping(); } catch (_) {}
        const memForVoice = await readConversation(chatId);
        const now = Date.now();
        const lastErr = Number(memForVoice.lastVoiceErrorAtMs || 0);
        if (!lastErr || now - lastErr > 60000) {
          await sendTelegramMessage(chatId, 'Произошла ошибка распознавания голоса. Попробуйте ещё раз.');
          await writeConversation(chatId, { lastVoiceErrorAtMs: now });
        }
        return res.status(200).send('OK');
      }
    }

    // Обрабатываем только текстовые запросы
    if (typeof message.text === 'string' && message.text.trim().length > 0) {
      // Включаем индикацию набора на время обработки запроса
      let stopTyping = startTypingLoop(chatId);
      // Определяем язык запроса (приоритет: выбранный ранее язык из памяти)
      const memory = await readConversation(chatId);
      const preferredLang = (memory && memory.language) || null;
      // Жёстко: кириллица -> ru; иначе детектор; предпочтение учитываем только если не кириллица
      const detectedLanguage = /[а-яё]/i.test(message.text) ? 'ru' : (detectLanguage(message.text) || preferredLang || 'ru');
      const t = botTranslations[detectedLanguage] || botTranslations.ru;
      
      // Чатовый режим: если интент не про поиск — отвечаем по‑человечески без подбора
      let intent = await classifyIntentWithLLM(message.text);
      if (!intent) intent = detectUserIntent(message.text);
      if (intent && intent !== 'search') {
        if (typeof stopTyping === 'function') stopTyping();
        const reply = await composeSmalltalkReply(message.text, detectedLanguage);
        await sendTelegramMessage(chatId, reply);
        await writeConversation(chatId, { lastSmalltalk: message.text });
        return res.status(200).send('OK');
      }
      
      try {
        // Подгружаем релевантные сниппеты БЗ (по языку и, если есть, tenantId в памяти)
        const kbSnippets = await fetchKnowledgeContext(message.text, detectedLanguage, (memory && memory.tenantId) || null);
        // Сначала анализируем запрос с помощью ИИ
        const aiCriteria = await analyzeRequestWithAI(message.text, detectedLanguage);
        console.log('[aiAssistantBot] AI criteria:', aiCriteria);
        const mergedCriteria = mergeCriteriaWithMemory(memory, aiCriteria || {});
        
        // Если ИИ определил конкретные районы, используем их; иначе — умный поиск
        let searchResult;
        const coastalDistricts = ['Seminyak','Canggu','Pererenan','Kuta','Legian','Uluwatu','Jimbaran','Sanur','Nusa Dua','Bingin','Dreamland','Balangan'];
        const bukitDistricts = ['Uluwatu','Ungasan','Jimbaran','Nusa Dua','Pecatu','Bingin','Dreamland','Balangan'];

        if (mergedCriteria.districts && mergedCriteria.districts.length > 0) {
          let properties = await searchProperties(mergedCriteria);
          // Фоллбек-расширение, если ничего не нашлось
          if (properties.length === 0) {
            const lower = message.text.toLowerCase();
            if (lower.includes('море') || lower.includes('пляж') || lower.includes('берег') || lower.includes('beach')) {
              properties = await searchProperties({ ...mergedCriteria, districts: coastalDistricts });
            } else if (lower.includes('букит') || lower.includes('bukit')) {
              properties = await searchProperties({ ...mergedCriteria, districts: bukitDistricts });
            }
          }
          searchResult = { properties, message: mergedCriteria._aiReasoning || aiCriteria._aiReasoning || null, type: 'ai_search' };
        } else {
          // Fallback на старую логику, если ИИ не определил районы
          searchResult = await smartSearchProperties(message.text, detectedLanguage);
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
          
          // Останавливаем индикацию перед отправкой ответа
          if (typeof stopTyping === 'function') stopTyping();
          await sendTelegramMessage(chatId, searchResult.message, keyboard);
          return res.status(200).send('OK');
        }
        
        let properties = searchResult.properties;
        
        // Новый LLM‑пайплайн: если результатов мало (< 15) или запрос абстрактный — берём широкий пул и даём LLM выбрать
        const lower = message.text.toLowerCase();
        const isAbstract = /(море|пляж|берег|тихо|спокойно|семья|семейн|серф|nightlife|lux|люкс|букит|coast|beach|quiet|family|surf)/i.test(lower);
        if (isAbstract || properties.length < 15) {
          try {
            // Увеличиваем пул и добавляем стратификацию по прибрежным районам
            const wide = await loadCandidatesHybrid(message.text, mergedCriteria, 2000);
            const strat = await loadCandidatesViaQdrantStratified(message.text, coastalDistricts, 10) || [];
            const mergedWide = Array.isArray(wide) ? wide.concat(strat) : strat;
            console.log('[diag] wide size:', Array.isArray(wide) ? wide.length : 'null', 'strat size:', strat.length, 'merged size:', mergedWide.length, 'districts:', districtsHistogram(mergedWide));
            const narrowed = prefilterCandidatesByStrategy(mergedWide, mergedCriteria);
            console.log('[diag] narrowed size:', narrowed.length, 'districts:', districtsHistogram(narrowed));
            // Жесткое ограничение районов, если запрос явный (Букит/побережье)
            let restrictTo = null;
            if (lower.includes('букит') || lower.includes('bukit')) restrictTo = bukitDistricts;
            else if (/(море|пляж|берег|coast|beach)/i.test(lower)) restrictTo = coastalDistricts;
            else if (Array.isArray(mergedCriteria.districts) && mergedCriteria.districts.length > 0) restrictTo = mergedCriteria.districts;

            let finalPool = narrowed;
            if (restrictTo) {
              const set = new Set(restrictTo.map(d => canonicalDistrictKey(d)));
              finalPool = narrowed.filter(p => set.has(canonicalDistrictKey(p.district)));
            }

            const aiPick = await selectWithAIEnhanced(message.text, finalPool.slice(0, 2000));
            console.log('[diag] finalPool size:', finalPool.length, 'districts:', districtsHistogram(finalPool), 'aiPick size:', aiPick && aiPick.properties ? aiPick.properties.length : 0);
            if (aiPick && aiPick.properties && aiPick.properties.length > 0) {
              properties = aiPick.properties;
              if (!searchResult.message && aiPick.reason) {
                searchResult.message = aiPick.reason;
              }
            }
          } catch (e) {
            console.error('[aiAssistantBot] Enhanced AI selection error:', e);
          }
        }

        // Формируем ответ (+ источники БЗ)
        const conversational = await composeConversationalReply(message.text, detectedLanguage, mergedCriteria, properties);
        const kbTail = (kbSnippets && kbSnippets.length)
          ? ('\n\n' + (detectedLanguage === 'en' ? 'Sources: ' : detectedLanguage === 'id' ? 'Sumber: ' : 'Источник(и): ') + kbSnippets.slice(0,3).map(s => s.title).filter(Boolean).join(' · '))
          : '';
        let responseText = conversational + '\n\n';
        if (properties.length > 0) responseText += summarizeResultsText(properties, message.text, detectedLanguage);
        else responseText += t.noResults + '\n\n' + t.yourQuery + '\n"' + message.text + '"';
        responseText += kbTail;
        
        // Останавливаем индикацию и отправляем основной ответ
        if (typeof stopTyping === 'function') stopTyping();
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

        // Сохраняем важные предпочтения в памяти диалога
        await writeConversation(chatId, {
          lastQuery: message.text,
          lastCriteria: mergedCriteria,
          districts: Array.isArray(mergedCriteria.districts) ? mergedCriteria.districts : (memory.districts || null),
          propertyType: mergedCriteria.propertyType || memory.propertyType || null,
          minPrice: Number.isFinite(mergedCriteria.minPrice) ? mergedCriteria.minPrice : (memory.minPrice || null),
          maxPrice: Number.isFinite(mergedCriteria.maxPrice) ? mergedCriteria.maxPrice : (memory.maxPrice || null),
          bedrooms: Number.isFinite(mergedCriteria.bedrooms) ? mergedCriteria.bedrooms : (memory.bedrooms || null),
          minArea: Number.isFinite(mergedCriteria.minArea) ? mergedCriteria.minArea : (memory.minArea || null),
          hasPool: typeof mergedCriteria.hasPool === 'boolean' ? mergedCriteria.hasPool : (typeof memory.hasPool === 'boolean' ? memory.hasPool : null),
          lastResults: Array.isArray(properties) ? properties.slice(0, 30).map(p => p.id) : []
        });
      } catch (error) {
        console.error('[aiAssistantBot] Smart search error:', error);
        if (typeof stopTyping === 'function') stopTyping();
        // Фоллбек на старую логику
        const criteria = analyzeUserRequest(message.text);
        const properties = await searchProperties(criteria);
        const summary = summarizeResultsText(properties, message.text, detectedLanguage);
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

// HTTPS Function: Webhook для мульти-ботов (per-bot), с проверкой секретного токена
const aiTenantTelegramWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const botId = (req.query && req.query.botId) || null;
    const providedSecret = req.get('x-telegram-bot-api-secret-token') || req.get('X-Telegram-Bot-Api-Secret-Token') || '';
    if (!botId) return res.status(400).send('Missing botId');

    // Загружаем бота и проверяем секрет
    const botDoc = await getDb().collection('bots').doc(String(botId)).get();
    if (!botDoc.exists) return res.status(404).send('Bot not found');
    const bot = botDoc.data();
    if (!bot.isActive) return res.status(403).send('Bot inactive');
    if (!bot.secretToken || providedSecret !== bot.secretToken) return res.status(403).send('Invalid secret token');
    const tokenOverride = bot.telegramBotToken;
    if (!tokenOverride) return res.status(500).send('Bot token missing');

    const update = req.body;
    // Callback queries
    if (update && update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data || '';
      try {
        if (data.startsWith('neighbors_yes_')) {
          const jsonData = data.replace('neighbors_yes_', '');
          const parsed = JSON.parse(jsonData);
          const { districts, criteria } = parsed;
          const properties = await searchProperties({ ...criteria, districts });
          const detectedLanguage = detectLanguage(callbackQuery.message.text || 'ru');
          const summary = summarizeResultsText(properties, `поиск в районах: ${districts.join(', ')}`, detectedLanguage);
          await sendTelegramMessage(chatId, summary, null, tokenOverride);
        } else if (data === 'choose_lang_en' || data === 'choose_lang_ru' || data === 'choose_lang_id') {
          const lang = data.endsWith('_en') ? 'en' : data.endsWith('_ru') ? 'ru' : 'id';
          await writeConversation(chatId, { language: lang });
          let stopTyping = startTypingLoop(chatId, tokenOverride);
          const reply = await composeSmalltalkReply('Start', lang);
          if (typeof stopTyping === 'function') stopTyping();
          await sendTelegramMessage(chatId, reply, null, tokenOverride);
        } else if (data === 'neighbors_no') {
          await sendTelegramMessage(chatId, 'Попробуйте уточнить запрос или выбрать другой район', null, tokenOverride);
        }
      } catch (e) {
        console.error('[aiTenantBot] Callback error:', e);
        await sendTelegramMessage(chatId, 'Произошла ошибка при обработке запроса', null, tokenOverride);
      }
      return res.status(200).send('OK');
    }

    const message = update && update.message;
    if (!message || !message.chat || !message.chat.id) {
      return res.status(200).send('OK');
    }
    const chatId = message.chat.id;
    const voice = message.voice || null;
    let text = message.text || '';

    // /start → выбор языка (tenant)
    if (typeof text === 'string' && text.trim().toLowerCase().startsWith('/start')) {
      const keyboard = {
        inline_keyboard: [
          [{ text: 'English', callback_data: 'choose_lang_en' }],
          [{ text: 'Русский', callback_data: 'choose_lang_ru' }],
          [{ text: 'Bahasa', callback_data: 'choose_lang_id' }]
        ]
      };
      await sendTelegramMessage(chatId, 'Please choose language / Выберите язык / Pilih bahasa:', keyboard, tokenOverride);
      return res.status(200).send('OK');
    }

    // Голос → транскрибуем
    if (voice && voice.file_id) {
      try {
        let stopTyping = startTypingLoop(chatId, tokenOverride);
        const transcript = await transcribeTelegramVoice(voice.file_id);
        if (typeof stopTyping === 'function') stopTyping();
        if (transcript && transcript.trim().length > 0) {
          text = transcript.trim();
        } else {
          await sendTelegramMessage(chatId, 'Не удалось распознать голос. Повторите, пожалуйста.', null, tokenOverride);
          return res.status(200).send('OK');
        }
      } catch (e) {
        console.error('[aiTenantBot] Voice error:', e);
        await sendTelegramMessage(chatId, 'Ошибка распознавания голоса. Попробуйте ещё раз.', null, tokenOverride);
        return res.status(200).send('OK');
      }
    }

    if (typeof text === 'string' && text.trim().length > 0) {
      let stopTyping = startTypingLoop(chatId, tokenOverride);
      const memory = await readConversation(chatId);
      const preferredLang = (memory && memory.language) || null;
      const detectedLanguage = /[а-яё]/i.test(text) ? 'ru' : (detectLanguage(text) || preferredLang || 'ru');
      const t = botTranslations[detectedLanguage] || botTranslations.ru;
      let intent = await classifyIntentWithLLM(text);
      if (!intent) intent = detectUserIntent(text);
      if (intent && intent !== 'search') {
        if (typeof stopTyping === 'function') stopTyping();
        const reply = await composeSmalltalkReply(text, detectedLanguage);
        await sendTelegramMessage(chatId, reply, null, tokenOverride);
        await writeConversation(chatId, { lastSmalltalk: text });
        return res.status(200).send('OK');
      }
      
      try {
        const aiCriteria = await analyzeRequestWithAI(text, detectedLanguage);
        let searchResult;
        const coastalDistricts = ['Seminyak','Canggu','Pererenan','Kuta','Legian','Uluwatu','Jimbaran','Sanur','Nusa Dua','Bingin','Dreamland','Balangan'];
        const bukitDistricts = ['Uluwatu','Ungasan','Jimbaran','Nusa Dua','Pecatu','Bingin','Dreamland','Balangan'];
        
        if (aiCriteria.districts && aiCriteria.districts.length > 0) {
          let properties = await searchProperties(aiCriteria);
          if (properties.length === 0) {
            const lower = text.toLowerCase();
            if (/(море|пляж|берег|beach)/i.test(lower)) properties = await searchProperties({ ...aiCriteria, districts: coastalDistricts });
            else if (/(букит|bukit)/i.test(lower)) properties = await searchProperties({ ...aiCriteria, districts: bukitDistricts });
          }
          searchResult = { properties, message: aiCriteria._aiReasoning || null, type: 'ai_search' };
        } else {
          searchResult = await smartSearchProperties(text, detectedLanguage);
        }
        
        if (searchResult.type === 'suggest_neighbors') {
          const keyboard = { inline_keyboard: [[
            { text: t.confirmNeighbors, callback_data: `neighbors_yes_${JSON.stringify({ districts: searchResult.suggestedDistricts, criteria: searchResult.originalCriteria })}` },
            { text: t.declineNeighbors, callback_data: 'neighbors_no' }
          ]] };
          if (typeof stopTyping === 'function') stopTyping();
          await sendTelegramMessage(chatId, searchResult.message, keyboard, tokenOverride);
          return res.status(200).send('OK');
        }
        
        let properties = searchResult.properties;
        const lower = text.toLowerCase();
        const isAbstract = /(море|пляж|берег|тихо|спокойно|семья|семейн|серф|nightlife|lux|люкс|букит|coast|beach|quiet|family|surf)/i.test(lower);
        if (isAbstract || properties.length < 15) {
          try {
            const wide = await loadCandidatesHybrid(text, aiCriteria, 2000);
            const strat = await loadCandidatesViaQdrantStratified(text, coastalDistricts, 10) || [];
            const mergedWide = Array.isArray(wide) ? wide.concat(strat) : strat;
            console.log('[diag:tenant] wide size:', Array.isArray(wide) ? wide.length : 'null', 'strat size:', strat.length, 'merged size:', mergedWide.length, 'districts:', districtsHistogram(mergedWide));
            const narrowed = prefilterCandidatesByStrategy(mergedWide, aiCriteria);
            console.log('[diag:tenant] narrowed size:', narrowed.length, 'districts:', districtsHistogram(narrowed));
            let restrictTo = null;
            if (/(букит|bukit)/i.test(lower)) restrictTo = bukitDistricts; else if (/(море|пляж|берег|coast|beach)/i.test(lower)) restrictTo = coastalDistricts; else if (Array.isArray(aiCriteria.districts) && aiCriteria.districts.length > 0) restrictTo = aiCriteria.districts;
            let finalPool = narrowed;
            if (restrictTo) {
              const set = new Set(restrictTo.map(d => canonicalDistrictKey(d)));
              finalPool = narrowed.filter(p => set.has(canonicalDistrictKey(p.district)));
            }
            const aiPick = await selectWithAIEnhanced(text, finalPool.slice(0, 2000));
            console.log('[diag:tenant] finalPool size:', finalPool.length, 'districts:', districtsHistogram(finalPool), 'aiPick size:', aiPick && aiPick.properties ? aiPick.properties.length : 0);
            if (aiPick && aiPick.properties && aiPick.properties.length > 0) {
              properties = aiPick.properties;
              if (!searchResult.message && aiPick.reason) searchResult.message = aiPick.reason;
            }
          } catch (e) { console.error('[aiTenantBot] Enhanced select error:', e); }
        }
        
        // Человекоподобный ответ + сводка
        const conversational = await composeConversationalReply(text, detectedLanguage, aiCriteria, properties);
        let responseText = conversational + '\n\n';
        if (properties.length > 0) responseText += summarizeResultsText(properties, text, detectedLanguage);
        else responseText += t.noResults + '\n\n' + t.yourQuery + '\n"' + text + '"';
        
        if (typeof stopTyping === 'function') stopTyping();
        if (properties.length > 0) {
          const propertyIds = properties.map(p => p.id).join(',');
          const webAppUrl = `${process.env.PUBLIC_GALLERY_BASE_URL || 'https://it-agent.pro'}/?selection=${encodeURIComponent(propertyIds)}`;
          const keyboard = { inline_keyboard: [[ { text: t.openSelection, web_app: { url: webAppUrl } } ]] };
          await sendTelegramMessage(chatId, responseText, keyboard, tokenOverride);
        } else {
          await sendTelegramMessage(chatId, responseText, null, tokenOverride);
        }
      } catch (error) {
        console.error('[aiTenantBot] webhook error:', error);
        if (typeof stopTyping === 'function') stopTyping();
        const detectedLanguage = detectLanguage(text || '');
        const criteria = analyzeUserRequest(text || '');
        const properties = await searchProperties(criteria);
        const summary = summarizeResultsText(properties, text || '', detectedLanguage);
        await sendTelegramMessage(chatId, summary, null, tokenOverride);
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('[aiTenantBot] webhook fatal:', err);
    return res.status(200).send('OK');
  }
});

module.exports = {
  aiAssistantTelegramWebhook,
  aiAssistantSetWebhook,
  aiTenantTelegramWebhook,
};


