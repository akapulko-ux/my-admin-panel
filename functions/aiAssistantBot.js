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

// Токен бота читаем из окружения лениво, чтобы не зависеть от порядка загрузки .env при деплое
function getBotToken() {
  return process.env.AI_ASSISTANT_TELEGRAM_BOT_TOKEN;
}

if (!getBotToken()) {
  console.warn('[aiAssistantBot] Не задан токен бота (AI_ASSISTANT_TELEGRAM_BOT_TOKEN). Добавьте его в functions/.env');
}

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

  // Берём разумный лимит, чтобы дальше дорезать локально
  const snap = await query.limit(50).get();
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

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
    if (criteria.district) {
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

function formatMoneyUSD(n) {
  const val = typeof n === 'number' ? n : Number(n) || 0;
  return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
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

function summarizeResultsText(properties, original) {
  if (properties.length === 0) {
    return `По вашему запросу не нашлось точных совпадений. Уточните район, бюджет, тип или особенности — и я подберу варианты.\n\nВаш запрос: \n"${original}"`;
  }
  const districts = [...new Set(properties.map(p => p.district).filter(Boolean))].join(', ');
  const types = [...new Set(properties.map(p => p.type).filter(Boolean))].join(', ');
  const avg = Math.round(properties.reduce((s, p) => s + (typeof p.price === 'number' ? p.price : Number(p.price) || 0), 0) / properties.length);
  return `Нашёл ${properties.length} подходящ${properties.length === 1 ? 'ий' : 'их'} объект(а).\n\n` +
         `Типы: ${types || '—'}\n` +
         `Районы: ${districts || '—'}\n` +
         `Средняя цена: ${formatMoneyUSD(avg)}\n\n` +
         `См. карточки ниже ⤵️`;
}

function buildPropertyCaption(p) {
  const price = formatMoneyUSD(p.price);
  const district = p.district || '';
  const type = p.type || p.propertyType || '';
  const bedroomsNum = parseInt(p.bedrooms, 10);
  const areaNum = typeof p.area === 'number' ? p.area : Number(p.area) || undefined;
  const status = p.status || '';
  const parts = [];
  parts.push(`<b>${type}</b> ${district ? 'в ' + district : ''} — <b>${price}</b>`);
  const line2 = [
    Number.isFinite(bedroomsNum) ? `${bedroomsNum} сп` : null,
    Number.isFinite(areaNum) ? `${Math.round(areaNum)} м²` : null,
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

  // images: массив строк или объектов
  if (Array.isArray(property.images)) {
    property.images.forEach(pushUrl);
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
          const bucket = admin.storage().bucket(bucketName);
          const [signed] = await bucket.file(filePath).getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
          if (signed) return signed;
        }
      } catch (_) {}
      continue;
    }

    // Нормализация Firebase Storage ссылок: добавляем alt=media
    if (/firebasestorage\.googleapis\.com\/v0\/b\//i.test(url) && !/alt=media/i.test(url)) {
      url += (url.includes('?') ? '&' : '?') + 'alt=media';
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
        const bucket = bucketMatch ? admin.storage().bucket(bucketMatch[1]) : admin.storage().bucket();
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
    const message = update && update.message;
    if (!message || !message.chat || !message.chat.id) {
      return res.status(200).send('OK');
    }

    const chatId = message.chat.id;
    const text = message.text || '';

    // Обрабатываем только текстовые запросы
    if (typeof text === 'string' && text.trim().length > 0) {
      let picked = null;
      try {
        // Сначала строгий фильтр по Firestore
        const criteria = analyzeUserRequest(text);
        const baseList = await searchProperties(criteria);
        // Затем ранжируем ИИ по кандидатам (если есть)
        picked = await selectWithAI(text, baseList);
        // Если ИИ вернул пусто, используем строго отфильтрованный baseList
        if (!picked || !picked.properties || picked.properties.length === 0) {
          picked = { properties: baseList, text: null };
        }
      } catch (e) {
        console.error('[aiAssistantBot] AI selection error:', e);
      }

      let properties = [];
      let introText = null;
      if (picked && picked.properties && picked.properties.length) {
        properties = picked.properties;
        introText = picked.text;
      } else {
        // Фоллбек — показываем детерминированный список
        const criteria = analyzeUserRequest(text);
        properties = await searchProperties(criteria);
      }

      // Отключаем любой AI-текст в шапке: только факты из БД
      const summary = summarizeResultsText(properties, text);
      await sendTelegramMessage(chatId, summary);

      for (const p of properties) {
        const caption = buildPropertyCaption(p);
        const img = await getImageUrl(p);
        try {
          if (img) await sendTelegramPhoto(chatId, img, caption);
          else await sendTelegramMessage(chatId, caption);
        } catch (e) {
          console.error('[aiAssistantBot] send card error, fallback to text:', e?.message || e);
          await sendTelegramMessage(chatId, caption);
        }
      }

      // Кнопка "Открыть подборку" (мини‑приложение со списком объектов, доступно публично)
      const webAppUrl = `${process.env.PUBLIC_GALLERY_BASE_URL || 'https://it-agent.pro'}/q/index.html`;
      const openSelectionKeyboard = {
        inline_keyboard: [[
          { text: 'Открыть подборку', web_app: { url: webAppUrl } }
        ]]
      };
      await sendTelegramMessage(chatId, 'Открыть подборку', openSelectionKeyboard);
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


