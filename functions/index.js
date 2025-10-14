const functions = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const speech = require("@google-cloud/speech");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const os = require("os");
const fs = require("fs");
const telegramTranslations = require("./telegramTranslations");
const { sendFixationCreatedWebhook, sendFixationStatusChangedWebhook, sendFixationExpiredWebhook, sendFixationRejectedWebhook } = require("./webhookService");
// Новый AI Assistant Telegram Bot (изолированный)
const { aiAssistantTelegramWebhook, aiAssistantSetWebhook, aiTenantTelegramWebhook, forwardAdminBotMessage, sendBotMessage } = require('./aiAssistantBot');
const { baliSupervisionTelegramWebhook, baliSupervisionSetWebhook, getSupervisionBotToken } = require('./baliSupervisionBot');

// Telegram Bot Token
const BOT_TOKEN = "8168450032:AAHjSVJn8VqcBEsgK_NtbfgqxGeXW0buaUM";

// Инициализируем admin SDK (без повторной инициализации)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Функция для получения языка пользователя
function getUserLanguage(userData) {
  const userLanguage = userData.language || 'ru'; // По умолчанию русский
  return ['ru', 'en', 'id'].includes(userLanguage) ? userLanguage : 'ru';
}

// Функция для получения локализованных переводов
function getTelegramTranslations(language) {
  return telegramTranslations[language] || telegramTranslations.ru;
}

// Функция для установки кнопки меню Web App
const setupWebAppMenuButton = async () => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: 'Админ-панель',
          web_app: {
            url: 'https://it-agent.pro/'
          }
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Web App menu button установлена успешно');
    } else {
      console.error('❌ Ошибка установки Web App menu button:', result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Ошибка при установке Web App menu button:', error);
    throw error;
  }
};

// Важно: не выполняем сетевые запросы на уровне модуля, чтобы не ломать старт контейнера Cloud Run
// Предоставляем явную функцию для ручной установки кнопки меню Web App
exports.installTelegramWebAppMenuButton = functions.https.onCall(async () => {
  try {
    const result = await setupWebAppMenuButton();
    return { success: true, result };
  } catch (e) {
    console.error('installTelegramWebAppMenuButton error:', e);
    throw new functions.https.HttpsError('internal', e.message || 'Unknown error');
  }
});

// Клиент для распознавания речи
const speechClient = new speech.SpeechClient();
const gcs = new Storage();

// Определение ролей и их алиасов
const ROLES = {
  admin: ['admin', 'administrator', 'администратор'],
  moderator: ['moderator', 'mod'],
  premium_agent: ['premium_agent', 'premium agent', 'премиум агент', 'премиум-агент', 'premium'],
  agent: ['agent', 'агент'],
  user: ['user', 'пользователь', ''],
  застройщик: ['застройщик', 'премиум застройщик'],
  closed: ['closed', 'закрытый аккаунт', 'закрытый', 'заблокированный']
};

// Функция для нормализации роли
function normalizeRole(role) {
  if (!role) return 'user';
  
  const normalizedRole = role.toLowerCase().trim();
  
  // Ищем соответствие в алиасах
  for (const [roleKey, aliases] of Object.entries(ROLES)) {
    if (aliases.includes(normalizedRole)) {
      return roleKey;
    }
  }
  
  console.warn(`Неизвестная роль "${role}" будет заменена на "user"`);
  return 'user';
}

// Функция транскрипции голосового сообщения
exports.transcribeVoiceMessage = functions.https.onCall(async (data, context) => {
  console.log("Received data:", data);
  const { agentId, clientTelegramId, messageId, audioURL, languageCode } = data.data || data;
  
  if (!agentId || !clientTelegramId || !messageId || !audioURL) {
    throw new functions.https.HttpsError("invalid-argument", "Отсутствуют обязательные параметры");
  }
  
  // Извлекаем путь из URL
  const bucket = admin.storage().bucket();
  const decodedURL = decodeURIComponent(audioURL);
  const matches = decodedURL.match(/\/o\/(.+)\?alt=media/);
  if (!matches) {
    throw new functions.https.HttpsError("invalid-argument", "Некорректный audioURL");
  }
  
  const filePath = matches[1];
  const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
  
  await bucket.file(filePath).download({ destination: tempFilePath });
  
  const audio = {
    content: fs.readFileSync(tempFilePath).toString("base64"),
  };
  
  const config = {
    encoding: "LINEAR16",           // Аудио записывается в формате LINEAR16 (.wav)
    sampleRateHertz: 16000,         // Частота дискретизации 16000 Гц
    languageCode: languageCode || "ru-RU",
    alternativeLanguageCodes: ["en-US", "fr-FR", "de-DE", "zh-CN", "id-ID"]
  };
  
  const request = { audio, config };
  const [response] = await speechClient.recognize(request);
  
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join("\n");
  
  await admin.firestore()
    .collection("agents").doc(agentId)
    .collection("chats").doc(clientTelegramId)
    .collection("messages").doc(messageId)
    .update({ transcription });
  
  return { transcription };
});

//
// Новая функция многоязычного перевода текста.
// Принимает входной текст и массив целевых языков, автоматически определяет исходный язык
// и переводит текст на каждый из указанных языков (например, ["en", "ru", "id", "fr", "de", "zh"]).
//
exports.multiTranslate = functions.https.onCall(async (data, context) => {
  // Извлекаем параметры из data.data (если они есть) или напрямую из data
  const requestData = data.data || data;
  const text = requestData.text;
  const targetLanguages = requestData.targetLanguages;
  
  if (!text || !targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "Необходимо передать текст и непустой массив целевых языков.");
  }
  
  try {
    // Инициализируем клиент Google Cloud Translate API
    const { Translate } = require('@google-cloud/translate').v2;
    const translateClient = new Translate();
    
    // Автоматическое определение языка исходного текста
    const [detection] = await translateClient.detect(text);
    const sourceLanguage = detection.language;
    
    let translations = {};
    // Переводим текст на каждый целевой язык
    for (let lang of targetLanguages) {
      let [translatedText] = await translateClient.translate(text, { from: sourceLanguage, to: lang });
      translations[lang] = translatedText;
    }
    
    return { sourceLanguage, translations };
  } catch (error) {
    console.error("Ошибка перевода:", error);
    throw new functions.https.HttpsError("unknown", error.message, error);
  }
});

// Функция для автоматического создания custom claims при создании документа пользователя
exports.createUserRoleClaims = onDocumentCreated("users/{userId}", async (event) => {
  const newData = event.data.data();
  const userId = event.params.userId;

  try {
    // Устанавливаем custom claims на основе роли в Firestore
    const role = newData.role || 'agent';
    const claims = { role: role };
    
    // Если роль - застройщик и указан developerId, добавляем его в claims
    if (['застройщик', 'премиум застройщик'].includes(role) && newData.developerId) {
      claims.developerId = newData.developerId;
    }
    
    await admin.auth().setCustomUserClaims(userId, claims);
    console.log(`Custom claims установлены для нового пользователя ${userId} с ролью ${role}`);
    
    // Обновляем документ с информацией о времени установки claims
    await event.data.ref.update({
      lastRoleUpdate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Отправляем уведомление всем подключенным администраторам о новой регистрации
    try {
      const adminsSnap = await admin.firestore()
        .collection('users')
        .where('role', '==', 'admin')
        .where('telegramConnected', '==', true)
        .get();

      if (adminsSnap.empty) {
        console.warn('[notifyUserRegistration] Нет админов, подключенных к Telegram');
      } else {
        const lines = [];
        lines.push('🆕 Новая регистрация пользователя');
        lines.push('');
        lines.push(`👤 Имя: ${newData.name || newData.displayName || newData.fullName || '-'}`);
        lines.push(`🆔 UID: ${userId}`);
        lines.push(`📧 Email: ${newData.email || '-'}`);
        lines.push(`📞 Телефон: ${newData.phone || newData.phoneNumber || '-'}`);
        lines.push(`🧩 Роль: ${newData.role || 'agent'}`);
        if (newData.developerId) lines.push(`🏗️ Developer ID: ${newData.developerId}`);
        if (newData.developerName) lines.push(`🏗️ Застройщик: ${newData.developerName}`);
        if (newData.telegramChatId) lines.push(`💬 Telegram: ${newData.telegramChatId}`);
        if (newData.language || newData.lang) lines.push(`🌐 Язык: ${newData.language || newData.lang}`);
        if (newData.registrationSource) lines.push(`🗺 Источник регистрации: ${newData.registrationSource}`);
        if (newData.createdAt) {
          const createdAtMs = newData.createdAt._seconds ? newData.createdAt._seconds * 1000 : Date.now();
          lines.push(`🕒 Создан: ${new Date(createdAtMs).toLocaleString('ru-RU')}`);
        }
        const message = lines.join('\n');

        const sendTasks = [];
        adminsSnap.forEach((doc) => {
          const chatId = doc.data()?.telegramChatId;
          if (!chatId) return;
          sendTasks.push(sendTelegramMessage(chatId, message));
        });

        const results = await Promise.allSettled(sendTasks);
        const ok = results.filter(r => r.status === 'fulfilled').length;
        const fail = results.length - ok;
        console.log(`[notifyUserRegistration] Отправлено: ${ok}, ошибок: ${fail}`);
      }
    } catch (e) {
      console.error('[notifyUserRegistration] error:', e);
    }

    return { success: true, message: `Custom claims установлены для роли ${role}` };
  } catch (error) {
    console.error('Ошибка при установке custom claims для нового пользователя:', error);
    throw new Error('Ошибка при установке custom claims для нового пользователя');
  }
});

// Функция обновления custom claims при изменении роли пользователя
exports.updateUserRoleClaims = onDocumentUpdated("users/{userId}", async (event) => {
  const newData = event.data.after.data();
  const previousData = event.data.before.data();
  const userId = event.params.userId;

  // Проверяем изменение роли или developerId
  if (newData.role !== previousData.role || 
      (['застройщик', 'премиум застройщик'].includes(newData.role) && newData.developerId !== previousData.developerId)) {
    try {
      const claims = { role: newData.role };
      
      // Если роль - застройщик и указан developerId, добавляем его в claims
      if (['застройщик', 'премиум застройщик'].includes(newData.role) && newData.developerId) {
        claims.developerId = newData.developerId;
      }
      
      await admin.auth().setCustomUserClaims(userId, claims);
      console.log(`Роль пользователя ${userId} обновлена на ${newData.role}`);
      
      await event.data.after.ref.update({
        lastRoleUpdate: admin.firestore.FieldValue.serverTimestamp()
      });

      // СИНХРОНИЗАЦИЯ ПУБЛИЧНОЙ МАПЫ ССЫЛКИ: publicSharedLinks/{token}
      try {
        const token = newData.premiumPublicLinkToken || null;
        if (token) {
          const mapRef = admin.firestore().collection('publicSharedLinks').doc(String(token));
          const ownerName = newData.displayName || newData.name || newData.email || '';
          const roleText = String(newData.role || '').toLowerCase();
          const isPremiumAgent = ['premium agent','премиум агент','premium_agent','премиум-агент','premium'].includes(roleText);
          const isPremiumDeveloper = ['premium developer','премиум застройщик','premium_developer','премиум-застройщик'].includes(roleText);
          const enabled = isPremiumAgent || isPremiumDeveloper;
          const stableRole = isPremiumAgent ? 'premium agent' : (isPremiumDeveloper ? 'premium developer' : (newData.role || ''));

          // Определяем имя застройщика для премиум застройщика
          let developerId = null;
          let developerName = null;
          if (isPremiumDeveloper) {
            try {
              developerId = newData.developerId || null;
              if (developerId) {
                const devSnap = await admin.firestore().collection('developers').doc(String(developerId)).get();
                if (devSnap.exists) {
                  developerName = devSnap.data()?.name || null;
                  console.log('[publicSharedLinks] developer resolved', { userId, developerId, developerName });
                } else {
                  console.log('[publicSharedLinks] developer not found for', developerId);
                }
              } else {
                console.log('[publicSharedLinks] no developerId on user', { userId });
              }
            } catch (e) {
              console.error('[publicSharedLinks] developer lookup error:', e);
            }
          }

          const payload = {
            ownerId: userId,
            ownerName,
            role: stableRole,
            phone: newData.phone || null,
            phoneCode: newData.phoneCode || null,
            enabled,
            developerId: developerId || null,
            developerName: developerName || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          await mapRef.set(payload, { merge: true });
          console.log('[publicSharedLinks] updated for token:', token, 'enabled:', enabled, 'role:', stableRole, 'developerName:', developerName);
        }
      } catch (e) {
        console.error('[publicSharedLinks] sync error:', e);
      }
      
      return { success: true, message: `Роль обновлена на ${newData.role}` };
    } catch (error) {
      console.error('Ошибка при обновлении роли:', error);
      throw new Error('Ошибка при обновлении роли пользователя');
    }
  }
});

// Функция для отправки уведомлений через Telegram Bot
exports.sendTelegramNotification = functions.https.onCall(async (data, context) => {
  const { chatId, message, role, developerId } = data.data || data;
  
  if (!chatId || !message) {
    throw new functions.https.HttpsError("invalid-argument", "Отсутствуют обязательные параметры chatId или message");
  }

  console.log(`Отправка уведомления в чат ${chatId}: ${message}`);
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Ошибка Telegram API:', result);
      throw new Error(`Telegram API Error: ${result.description || 'Unknown error'}`);
    }
    
    console.log('Уведомление успешно отправлено:', result);
    return { success: true, message: "Уведомление отправлено" };
  } catch (error) {
    console.error('Ошибка при отправке уведомления:', error);
    throw new functions.https.HttpsError("unknown", "Ошибка при отправке уведомления: " + error.message);
  }
});

// Сообщение администратору о нажатии кнопки "Подписаться" в публичной галерее
exports.notifySubscriptionInterest = functions.https.onCall(async (data, context) => {
  try {
    const payload = (data && (data.data || data)) || {};
    const uid = context?.auth?.uid || String(payload.uid || '');
    if (!uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Требуется аутентификация');
    }

    // Загружаем пользователя
    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Профиль пользователя не найден');
    }
    const u = userSnap.data() || {};
    console.log('[notifySubscriptionInterest] from uid:', uid, 'email:', u.email || context?.auth?.token?.email || null);

    // Ищем админов, подключенных к Telegram
    const adminsSnap = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .where('telegramConnected', '==', true)
      .get();

    if (adminsSnap.empty) {
      console.warn('[notifySubscriptionInterest] Нет админов, подключенных к Telegram');
      return { success: false, reason: 'no_admins' };
    }

    // Формируем сообщение c максимально полной информацией из БД
    const lines = [];
    lines.push('🧾 Заявка на подписку ($199 / мес.)');
    lines.push('');
    lines.push(`👤 Пользователь: ${u.name || u.displayName || u.fullName || '-'} (${uid})`);
    lines.push(`📧 Email: ${u.email || context.auth.token.email || '-'}`);
    lines.push(`📞 Телефон: ${u.phone || u.phoneNumber || '-'}`);
    lines.push(`🧩 Роль: ${u.role || '-'}`);
    if (u.developerId) lines.push(`🏗️ Developer ID: ${u.developerId}`);
    if (u.telegramChatId) lines.push(`💬 Telegram: ${u.telegramChatId}`);
    if (u.lang || u.language) lines.push(`🌐 Язык: ${u.lang || u.language}`);
    if (u.createdAt) lines.push(`🕒 Создан: ${new Date((u.createdAt._seconds ? u.createdAt._seconds * 1000 : Date.now())).toLocaleString('ru-RU')}`);
    const message = lines.join('\n');

    // Отправляем каждому администратору
    const promises = [];
    adminsSnap.forEach(doc => {
      const adminData = doc.data();
      const chatId = adminData?.telegramChatId;
      if (!chatId) return;
      promises.push(fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
      }).then(r => r.json()).catch(e => ({ error: e?.message || String(e) })));
    });

    const results = await Promise.all(promises);
    console.log('[notifySubscriptionInterest] results:', results);
    return { success: true };
  } catch (e) {
    console.error('[notifySubscriptionInterest] error:', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'Unknown error');
  }
});

// Функция для уведомления пользователей о новых фиксациях
exports.notifyNewFixation = onDocumentCreated("clientFixations/{fixationId}", async (event) => {
  const fixationData = event.data.data();
  
  try {
    // Если у фиксации нет developerId, пытаемся его определить
    if (!fixationData.developerId && fixationData.developerName) {
      console.log(`🔍 Определение developerId для застройщика: ${fixationData.developerName}`);
      
      try {
        // Ищем застройщика по названию
        const developersSnapshot = await admin.firestore()
          .collection("developers")
          .where("name", "==", fixationData.developerName)
          .limit(1)
          .get();
        
        if (!developersSnapshot.empty) {
          const developerDoc = developersSnapshot.docs[0];
          const developerId = developerDoc.id;
          
          console.log(`✅ Найден developerId: ${developerId} для застройщика: ${fixationData.developerName}`);
          
          // Обновляем фиксацию, добавляя developerId
          await admin.firestore()
            .collection("clientFixations")
            .doc(event.params.fixationId)
            .update({
              developerId: developerId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          
          console.log(`✅ Фиксация обновлена с developerId: ${developerId}`);
          
          // Обновляем данные фиксации для дальнейшей обработки
          fixationData.developerId = developerId;
        } else {
          console.log(`⚠️  Застройщик не найден: ${fixationData.developerName}`);
        }
      } catch (error) {
        console.error(`❌ Ошибка при определении developerId: ${error.message}`);
      }
    }

    // Отправляем webhook уведомление о создании фиксации
    try {
      const webhookData = {
        id: event.params.fixationId,
        ...fixationData
      };
      await sendFixationCreatedWebhook(webhookData);
      console.log(`🔔 Webhook уведомление о создании фиксации отправлено`);
    } catch (webhookError) {
      console.error(`❌ Ошибка отправки webhook: ${webhookError.message}`);
    }

    // Получаем всех пользователей с подключенным телеграмом
    const usersSnapshot = await admin.firestore()
      .collection("users")
      .where("telegramChatId", "!=", null)
      .get();
    
    const notifications = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userRole = userData.role;
      const telegramChatId = userData.telegramChatId;
      
      console.log(`🔍 Проверка пользователя: ${userData.email || userDoc.id}`);
      console.log(`   Роль: ${userRole}`);
      console.log(`   Telegram Chat ID: ${telegramChatId}`);
      console.log(`   Developer ID пользователя: ${userData.developerId}`);
      console.log(`   Developer ID фиксации: ${fixationData.developerId}`);
      
      // Проверяем права доступа пользователя к фиксации
      let hasAccess = false;
      let accessReason = '';
      
      if (userRole === 'admin') {
        hasAccess = true; // Админ видит все
        accessReason = 'Админ имеет доступ ко всем фиксациям';
      } else if (userRole === 'moderator') {
        hasAccess = true; // Модератор видит все
        accessReason = 'Модератор имеет доступ ко всем фиксациям';
      } else if (['застройщик', 'премиум застройщик'].includes(userRole)) {
        // Застройщик и премиум застройщик видят только свои объекты
        const userDeveloperId = userData.developerId;
        const fixationDeveloperId = fixationData.developerId;
        
        // Проверяем различные варианты совпадения
        const developerIdsMatch = 
          (userDeveloperId && fixationDeveloperId && userDeveloperId === fixationDeveloperId) ||
          (userDeveloperId && fixationDeveloperId && userDeveloperId.toString() === fixationDeveloperId.toString());
        
        if (developerIdsMatch) {
          hasAccess = true;
          accessReason = `${userRole} имеет доступ к своим объектам`;
        } else {
          accessReason = `${userRole} не имеет доступа: developerId не совпадают (пользователь: ${userDeveloperId}, фиксация: ${fixationDeveloperId})`;
        }
      } else {
        accessReason = `Роль ${userRole} не имеет доступа к фиксациям`;
      }
      
      console.log(`   Доступ: ${hasAccess ? '✅' : '❌'} - ${accessReason}`);
      
      if (hasAccess) {
        // Получаем язык пользователя и соответствующие переводы
        const userLanguage = getUserLanguage(userData);
        const t = getTelegramTranslations(userLanguage);
        
        // Формируем подробное сообщение на языке пользователя
        const message = `${t.newFixationTitle}\n\n` +
          `${t.clientLabel} ${fixationData.clientName || t.notSpecified}\n` +
          `${t.phoneLabel} ${fixationData.clientPhone || t.notSpecified}\n` +
          `${t.agentLabel} ${fixationData.agentName || t.notSpecified}\n` +
          `${t.complexLabel} ${fixationData.complexName || t.notSpecified}\n` +
          `${t.developerLabel} ${fixationData.developerName || t.notSpecified}\n` +
          `${t.propertyTypeLabel} ${fixationData.propertyType || t.notSpecified}\n` +
          `${t.timeLabel} ${new Date(fixationData.dateTime?.seconds * 1000 || Date.now()).toLocaleString(userLanguage === 'ru' ? 'ru-RU' : userLanguage === 'en' ? 'en-US' : 'id-ID')}\n\n` +
          `${t.adminPanelText}`;

        // Создаем inline клавиатуру с Web App кнопкой
        const inlineKeyboard = {
          inline_keyboard: [[
            {
              text: t.adminPanelButton,
              web_app: {
                url: 'https://it-agent.pro/'
              }
            }
          ]]
        };
        
        notifications.push({
          chatId: telegramChatId,
          message: message,
          replyMarkup: inlineKeyboard,
          role: userRole,
          developerId: userData.developerId,
          language: userLanguage
        });
      }
    }
    
    // Отправляем уведомления асинхронно
    const sendPromises = notifications.map(async (notification) => {
      try {
        // Отправляем уведомление через Telegram Bot API
        await sendTelegramMessage(notification.chatId, notification.message, notification.replyMarkup);
        
        // Сохраняем запись об успешной отправке (без replyMarkup для экономии места)
        const notificationData = { ...notification };
        delete notificationData.replyMarkup; // Убираем из сохранения
        
        await admin.firestore().collection('telegramNotifications').add({
          ...notificationData,
          fixationId: event.params.fixationId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          sent: true,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Уведомление отправлено пользователю с ролью ${notification.role}`);
        return { success: true, role: notification.role };
      } catch (error) {
        console.error(`Ошибка отправки уведомления пользователю с ролью ${notification.role}:`, error);
        
        // Сохраняем запись о неудачной отправке (без replyMarkup)
        const notificationData = { ...notification };
        delete notificationData.replyMarkup;
        
        await admin.firestore().collection('telegramNotifications').add({
          ...notificationData,
          fixationId: event.params.fixationId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          sent: false,
          error: error.message
        });
        
        return { success: false, role: notification.role, error: error.message };
      }
    });
    
    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`📊 Итоговая статистика для фиксации ${event.params.fixationId}:`);
    console.log(`   ✅ Успешно отправлено: ${successCount}`);
    console.log(`   ❌ Ошибок: ${failureCount}`);
    console.log(`   📝 Всего уведомлений: ${notifications.length}`);
    console.log(`   👥 Всего пользователей с Telegram: ${usersSnapshot.docs.length}`);
    
    return { success: true, sent: successCount, failed: failureCount, total: notifications.length };
  } catch (error) {
    console.error('Ошибка при планировании уведомлений:', error);
    return { success: false, error: error.message };
  }
});

// Функция для отслеживания изменений статуса фиксаций
exports.trackFixationStatusChanges = onDocumentUpdated("clientFixations/{fixationId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  
  try {
    // Проверяем, изменился ли статус
    if (beforeData.status !== afterData.status) {
      console.log(`🔄 Изменение статуса фиксации ${event.params.fixationId}: ${beforeData.status} → ${afterData.status}`);
      
      const webhookData = {
        id: event.params.fixationId,
        ...afterData
      };
      
      // Отправляем webhook уведомление об изменении статуса
      await sendFixationStatusChangedWebhook(webhookData, beforeData.status);
      
      // Отправляем специфичные webhook в зависимости от нового статуса
      if (afterData.status === 'Срок истек' || afterData.status === 'Expired' || afterData.status === 'Kedaluwarsa') {
        await sendFixationExpiredWebhook(webhookData);
      } else if (afterData.status === 'Отклонен' || afterData.status === 'Rejected' || afterData.status === 'Ditolak') {
        await sendFixationRejectedWebhook(webhookData);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка при отслеживании изменений статуса:', error);
    return { success: false, error: error.message };
  }
});

// Функция для отправки сообщений через Telegram Bot API
const sendTelegramMessage = async (chatId, text, replyMarkup = null) => {
  try {
    const messageData = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    // Добавляем inline клавиатуру если она предоставлена
    if (replyMarkup) {
      messageData.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Ошибка Telegram API:', result);
      throw new Error(`Telegram API Error: ${result.description || 'Unknown error'}`);
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    throw error;
  }
};

// Уведомление о новой заявке клиента (clientLeads)
exports.notifyNewClientLead = onDocumentCreated("clientLeads/{leadId}", async (event) => {
  try {
    const leadId = event.params.leadId;
    const lead = event.data.data() || {};
    console.log(`[notifyNewClientLead] leadId=${leadId}`, lead);

    const db = admin.firestore();
    const recipients = new Map(); // userId -> { chatId, language }

    // Если указан агент напрямую
    if (lead.agentId) {
      try {
        const agentSnap = await db.collection('users').doc(String(lead.agentId)).get();
        if (agentSnap.exists) {
          const agent = agentSnap.data() || {};
          if (agent.telegramConnected && agent.telegramChatId) {
            recipients.set(agentSnap.id, { chatId: agent.telegramChatId, language: getUserLanguage(agent) });
          }
        }
      } catch (e) {
        console.error('[notifyNewClientLead] load agent failed', e);
      }
    }

    // Если указан объект — уведомляем его создателя
    let propertyData = null;
    if (lead.propertyId) {
      try {
        const propSnap = await db.collection('properties').doc(String(lead.propertyId)).get();
        if (propSnap.exists) {
          propertyData = propSnap.data() || {};
          const ownerId = propertyData.createdBy;
          if (ownerId) {
            const ownerSnap = await db.collection('users').doc(String(ownerId)).get();
            if (ownerSnap.exists) {
              const owner = ownerSnap.data() || {};
              if (owner.telegramConnected && owner.telegramChatId) {
                recipients.set(ownerSnap.id, { chatId: owner.telegramChatId, language: getUserLanguage(owner) });
              }
            }
          }
        }
      } catch (e) {
        console.error('[notifyNewClientLead] load property failed', e);
      }
    }

    if (recipients.size === 0) {
      console.log('[notifyNewClientLead] no recipients with connected Telegram');
      return { success: true, recipients: 0 };
    }

    // Формируем сообщение
    const propertyName = propertyData?.propertyName || propertyData?.name || propertyData?.title || propertyData?.complexName || '';
    const lines = [];
    lines.push('🧾 Новая заявка клиента');
    if (lead.name) lines.push(`👤 Клиент: ${lead.name}`);
    if (lead.phone) lines.push(`📞 Телефон: ${lead.phone}`);
    if (lead.messenger) lines.push(`💬 Мессенджер: ${lead.messenger}`);
    if (propertyName || lead.propertyId) {
      const pLine = propertyName ? `🏠 Объект: ${propertyName}` : '🏠 Объект: —';
      lines.push(pLine + (lead.propertyId ? ` (ID: ${lead.propertyId})` : ''));
    }
    if (lead.createdAt) {
      try {
        const tsMs = lead.createdAt._seconds ? lead.createdAt._seconds * 1000 : Date.now();
        lines.push(`⏰ Время: ${new Date(tsMs).toLocaleString('ru-RU')}`);
      } catch {}
    }
    lines.push('');
    lines.push('📱 Перейдите в админ‑панель для обработки заявки:');
    const message = lines.join('\n');

    const replyMarkup = {
      inline_keyboard: [[{ text: 'Открыть админ‑панель', url: 'https://it-agent.pro/' }]]
    };

    // Отправляем всем получателям
    const results = [];
    for (const [userId, info] of recipients.entries()) {
      try {
        await sendTelegramMessage(info.chatId, message, replyMarkup);
        results.push({ userId, sent: true });
      } catch (e) {
        console.error(`[notifyNewClientLead] send failed to ${userId}`, e);
        results.push({ userId, sent: false, error: e?.message || String(e) });
      }
    }

    console.log('[notifyNewClientLead] results:', results);
    return { success: true, recipients: recipients.size };
  } catch (error) {
    console.error('[notifyNewClientLead] error:', error);
    return { success: false, error: error.message };
  }
});

// API Function (Gen2) with required Robokassa secrets
const apiApp = require('./api');
exports.api = onRequest({
  serviceAccount: 'bali-estate-1130f@appspot.gserviceaccount.com',
  secrets: [
    'ROBO_MERCHANT_LOGIN',
    'ROBO_PASSWORD1',
    'ROBO_PASSWORD2',
    'ROBO_TEST_PASSWORD1',
    'ROBO_TEST_PASSWORD2',
    'ONE_TIME_PRICE_RUB'
  ]
}, apiApp);

// Multi-tenant Telegram webhook
exports.aiTenantTelegramWebhook = aiTenantTelegramWebhook;
exports.baliSupervisionTelegramWebhook = baliSupervisionTelegramWebhook;
exports.baliSupervisionSetWebhook = baliSupervisionSetWebhook;

// Callable: первичная индексация properties в Qdrant
exports.indexPropertiesEmbeddings = functions.https.onCall(async (data, context) => {
  const { getEmbedding } = require('./utils/embeddings');
  const { ensureCollection, upsertPoints } = require('./utils/qdrant');
  const db = admin.firestore();
  const dim = Number(process.env.EMBEDDING_DIM || 1536);
  await ensureCollection(dim);
  const batchSize = Number(data?.batchSize || 200);
  let lastDoc = null;
  let indexed = 0;
  while (true) {
    let q = db.collection('properties').orderBy('__name__').limit(batchSize);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;
    const points = [];
    const { uuidFromString } = require('./utils/id');
    for (const doc of snap.docs) {
      const p = doc.data();
      const text = [
        p.type || '', p.district || '', p.status || '',
        `price:${p.price || ''}`, `bedrooms:${p.bedrooms || ''}`, `area:${p.area || ''}`,
        (p.description || '').toString().slice(0, 500)
      ].join(' | ');
      const vec = await getEmbedding(text);
      const qId = uuidFromString(doc.id);
      points.push({ id: qId, vector: vec, payload: { docId: doc.id, district: p.district || null, type: p.type || null } });
    }
    await upsertPoints(points);
    indexed += points.length;
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < batchSize) break;
  }
  return { indexed };
});

// HTTP trigger для индексации (для админа; защитим секретом)
exports.indexPropertiesEmbeddingsHttp = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const secret = req.get('x-index-secret') || req.query.secret || '';
  if (!process.env.INDEX_SECRET || secret !== process.env.INDEX_SECRET) return res.status(403).send('Forbidden');
  try {
    const { getEmbedding } = require('./utils/embeddings');
    const { ensureCollection, upsertPoints } = require('./utils/qdrant');
    const { uuidFromString } = require('./utils/id');
    const dim = Number(process.env.EMBEDDING_DIM || 1536);
    await ensureCollection(dim);
    const db = admin.firestore();
    const batchSize = Number((req.body && req.body.batchSize) || req.query.batchSize || 50);
    const startAfterId = (req.body && req.body.startAfter) || req.query.startAfter || null;
    let q = db.collection('properties').orderBy('__name__').limit(batchSize);
    if (startAfterId) {
      const startDoc = await db.collection('properties').doc(startAfterId).get();
      if (startDoc.exists) q = q.startAfter(startDoc);
    }
    const snap = await q.get();
    if (snap.empty) return res.json({ indexed: 0, nextPageToken: null });
    const points = [];
    for (const doc of snap.docs) {
      const p = doc.data();
      const text = [
        p.type || '', p.district || '', p.status || '',
        `price:${p.price || ''}`, `bedrooms:${p.bedrooms || ''}`, `area:${p.area || ''}`,
        (p.description || '').toString().slice(0, 500)
      ].join(' | ');
      const vec = await getEmbedding(text);
      const qId = uuidFromString(doc.id);
      points.push({ id: qId, vector: vec, payload: { docId: doc.id, district: p.district || null, type: p.type || null } });
    }
    await upsertPoints(points);
    console.log('[diag:indexProps] batch indexed:', points.length);
    const lastDoc = snap.docs[snap.docs.length - 1];
    const nextPageToken = lastDoc ? lastDoc.id : null;
    res.json({ indexed: points.length, nextPageToken });
  } catch (e) {
    console.error('indexPropertiesEmbeddingsHttp error:', e);
    res.status(500).json({ error: e.message });
  }
});

// HTTP: Индексация БЗ в Qdrant (коллекция knowledge_kb)
exports.indexKnowledgeEmbeddingsHttp = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const secret = req.get('x-index-secret') || req.query.secret || '';
  const expected = process.env.INDEX_SECRET || 'super-index-secret';
  if (secret !== expected) return res.status(403).send('Forbidden');
  try {
    const { getEmbedding } = require('./utils/embeddings');
    const { ensureCollectionFor, upsertPointsTo } = require('./utils/qdrant');
    const { uuidFromString } = require('./utils/id');
    const dim = Number(process.env.EMBEDDING_DIM || 1536);
    const KB_COLLECTION = process.env.QDRANT_KB_COLLECTION || 'knowledge_kb';
    await ensureCollectionFor(KB_COLLECTION, dim, ['tenantId', 'locale', 'tags']);
    const db = admin.firestore();
    const batchSize = Number((req.body && req.body.batchSize) || req.query.batchSize || 100);
    const startAfterId = (req.body && req.body.startAfter) || req.query.startAfter || null;
    // Без where/complex orderBy, чтобы не требовались индексы и не ловить ошибки Firestore
    let q = db.collection('knowledge_docs').orderBy('__name__').limit(batchSize);
    if (startAfterId) {
      const startDoc = await db.collection('knowledge_docs').doc(startAfterId).get();
      if (startDoc.exists) q = q.startAfter(startDoc);
    }
    const snap = await q.get();
    if (snap.empty) return res.json({ indexed: 0, nextPageToken: null });
    const points = [];
    for (const doc of snap.docs) {
      const meta = doc.data();
      // Пропускаем деактивированные/архивные документы
      if (meta?.active === false || meta?.status === 'archived') continue;
      // читаем сырой контент (поддокумент raw/content)
      let content = '';
      try {
        const raw = await db.collection('knowledge_docs').doc(doc.id).collection('raw').doc('content').get();
        content = (raw.exists && raw.data()?.content) || '';
      } catch (_) {}
      const baseText = [meta.title || '', content || ''].join('\n').trim();
      if (!baseText) continue;
      // разрезаем на чанки 400-600 символов
      const chunks = [];
      const chunkSize = Number(process.env.KB_CHUNK_SIZE || 500);
      for (let i = 0; i < baseText.length; i += chunkSize) {
        chunks.push(baseText.slice(i, i + chunkSize));
      }
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const vec = await getEmbedding(chunk);
        const pid = uuidFromString(`${doc.id}#${i}`);
        points.push({
          id: pid,
          vector: vec,
          payload: {
            docId: doc.id,
            tenantId: meta.tenantId || null,
            locale: meta.locale || null,
            tags: Array.isArray(meta.tags) ? meta.tags : [],
            title: meta.title || '',
            idx: i
          }
        });
      }
    }
    if (points.length > 0) await upsertPointsTo(KB_COLLECTION, points);
    const lastDoc = snap.docs[snap.docs.length - 1];
    const nextPageToken = lastDoc ? lastDoc.id : null;
    res.json({ indexed: points.length, nextPageToken });
  } catch (e) {
    console.error('indexKnowledgeEmbeddingsHttp error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== APP STATISTICS ====================
// Документ с метриками: system/appStatistics
// Структура: {
//   totals: { totalUsers, activeUsers, appLogins, searches, views, favorites },
//   startDate: Timestamp,           // дата начала роста
//   lastIncrementDate: string,      // 'YYYY-MM-DD' последнего применения роста
// }

const APP_STATS_DOC_PATH = 'system/appStatistics';
const APP_STATS_DEFAULTS = {
  totalUsers: 171,
  activeUsers: 104,
  appLogins: 687,
  searches: 193,
  views: 1157,
  favorites: 54,
};

function toYMD(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Callable: Инициализация метрик (только админ/модератор)
exports.initAppStatistics = functions.https.onCall(async (data, context) => {
  const uid = context?.auth?.uid || null;
  const tokenRole = context?.auth?.token?.role || null;
  if (!uid || !['admin', 'moderator'].includes(tokenRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Недостаточно прав');
  }

  const db = admin.firestore();
  const ref = db.doc(APP_STATS_DOC_PATH);
  const snap = await ref.get();

  const now = new Date();
  now.setUTCHours(0,0,0,0);
  const todayYmd = toYMD(now);

  const payload = {
    totals: {
      totalUsers: Number(data?.totalUsers ?? APP_STATS_DEFAULTS.totalUsers),
      activeUsers: Number(data?.activeUsers ?? APP_STATS_DEFAULTS.activeUsers),
      appLogins: Number(data?.appLogins ?? APP_STATS_DEFAULTS.appLogins),
      searches: Number(data?.searches ?? APP_STATS_DEFAULTS.searches),
      views: Number(data?.views ?? APP_STATS_DEFAULTS.views),
      favorites: Number(data?.favorites ?? APP_STATS_DEFAULTS.favorites),
    },
    startDate: admin.firestore.Timestamp.fromDate(now),
    lastIncrementDate: todayYmd,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: uid,
  };

  if (!snap.exists) {
    await ref.set(payload);
  } else {
    await ref.update(payload);
  }

  return { success: true };
});

// Pub/Sub расписание: ежедневный рост на 2% (UTC 00:10)
exports.incrementAppStatisticsDaily = onSchedule({ schedule: '10 0 * * *', timeZone: 'UTC' }, async () => {
    const db = admin.firestore();
    const ref = db.doc(APP_STATS_DOC_PATH);
    const snap = await ref.get();

    const now = new Date();
    now.setUTCHours(0,0,0,0);
    const todayYmd = toYMD(now);

    if (!snap.exists) {
      // Если документ не существует — создаём с дефолтами и считаем, что первый рост будет завтра
      await ref.set({
        totals: APP_STATS_DEFAULTS,
        startDate: admin.firestore.Timestamp.fromDate(now),
        lastIncrementDate: todayYmd,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('App statistics initialized');
      return null;
    }

    const data = snap.data() || {};
    if (data.lastIncrementDate === todayYmd) {
      console.log('Already incremented today');
      return null;
    }

    const src = data.totals || APP_STATS_DEFAULTS;
    // Умножаем на 1.02 и округляем
    const next = Object.fromEntries(
      Object.entries(src).map(([k, v]) => [k, Math.round(Number(v || 0) * 1.02)])
    );

    await ref.update({
      totals: next,
      lastIncrementDate: todayYmd,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('App statistics incremented by 2%');
    return null;
  });

// Функция для обработки webhook от Telegram Bot
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const update = req.body;
    
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      
      // Обрабатываем команду /start с кодом верификации
      if (text && text.startsWith('/start ')) {
        const verificationCode = text.split(' ')[1];
        
        if (verificationCode) {
          // Ищем пользователя с таким кодом верификации
          const usersSnapshot = await admin.firestore()
            .collection("users")
            .where("telegramVerificationCode", "==", verificationCode)
            .limit(1)
            .get();
          
          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            const userData = userDoc.data();
            
            console.log(`Верификация для пользователя ${userDoc.id}, Chat ID: ${chatId}`);
            
            // Получаем язык пользователя и соответствующие переводы
            const userLanguage = getUserLanguage(userData);
            const t = getTelegramTranslations(userLanguage);
            
            // Автоматически подключаем пользователя
            await userDoc.ref.update({
              telegramChatId: chatId.toString(),
              telegramConnected: true,
              telegramConnectedAt: admin.firestore.FieldValue.serverTimestamp(),
              telegramVerificationCode: admin.firestore.FieldValue.delete() // Удаляем код после использования
            });
            
            const responseMessage = `${t.connectionSuccess}\n\n` +
              `${t.connectionSuccessMessage.replace('{role}', userData.role || 'agent')}`;

            // Создаем inline клавиатуру с Web App кнопкой
            const inlineKeyboard = {
              inline_keyboard: [[
                {
                  text: t.adminPanelButton,
                  web_app: {
                    url: 'https://it-agent.pro/'
                  }
                }
              ]]
            };
            
            await sendTelegramMessage(chatId, responseMessage, inlineKeyboard);
            
          } else {
            // Используем русский язык по умолчанию для неизвестных пользователей
            const t = getTelegramTranslations('ru');
            const errorMessage = t.verificationCodeNotFound;
            
            await sendTelegramMessage(chatId, errorMessage);
          }
        } else {
          // Отправляем справку если команда /start без параметров
          // Используем русский язык по умолчанию для неизвестных пользователей
          const t = getTelegramTranslations('ru');
          const helpMessage = `${t.welcomeMessage}\n\n` +
            `${t.automaticConnection}\n` +
            `${t.automaticConnectionSteps}\n\n` +
            `${t.manualConnection}\n` +
            `${t.manualConnectionInstruction}\n\n` +
            `${t.finalMessage}`;

          // Создаем inline клавиатуру с Web App кнопкой
          const inlineKeyboard = {
            inline_keyboard: [[
              {
                text: t.adminPanelButton,
                web_app: {
                  url: 'https://it-agent.pro/'
                }
              }
            ]]
          };
          
          await sendTelegramMessage(chatId, helpMessage, inlineKeyboard);
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка в webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Новый бот ИИ ассистента (отдельный webhook и callable)
exports.aiAssistantTelegramWebhook = aiAssistantTelegramWebhook;
exports.aiAssistantSetWebhook = aiAssistantSetWebhook;
exports.forwardAdminBotMessage = forwardAdminBotMessage;
exports.sendBotMessage = sendBotMessage;

// Пробрасываем доступ к токену технадзора для общих функций
exports.getSupervisionBotToken = getSupervisionBotToken;

// MARK: - Developer Push Notifications

// Функция для отправки пуш-уведомлений от премиум застройщиков
exports.sendDeveloperNotification = functions.https.onCall(async (data, context) => {
  try {
    // Диагностика контекста авторизации
    console.log('🔍 Auth context debug:', {
      contextExists: !!context,
      authExists: !!context?.auth,
      authUid: context?.auth?.uid,
      authToken: context?.auth?.token ? 'TOKEN_EXISTS' : 'NO_TOKEN',
      rawData: data
    });

    // Временное решение: извлекаем UID из rawData если context.auth пустой
    let userId;
    if (context.auth && context.auth.uid) {
      userId = context.auth.uid;
      console.log('✅ Using context.auth.uid:', userId);
    } else if (data.rawRequest?.auth?.uid) {
      userId = data.rawRequest.auth.uid;
      console.log('✅ Using rawRequest.auth.uid:', userId);
    } else if (data.auth?.uid) {
      userId = data.auth.uid;
      console.log('✅ Using data.auth.uid:', userId);
    } else {
      console.error('❌ No user ID found in any auth source');
      throw new functions.https.HttpsError('unauthenticated', 'Пользователь не авторизован');
    }

    // Исправлено: данные приходят в data.data
    const { title, body, targetAudience, role: targetRole } = data.data || data;

    // Валидация входных данных
    if (!title || !body) {
      throw new functions.https.HttpsError('invalid-argument', 'Заголовок и текст сообщения обязательны');
    }

    if (title.length > 100) {
      throw new functions.https.HttpsError('invalid-argument', 'Заголовок не должен превышать 100 символов');
    }

    if (body.length > 500) {
      throw new functions.https.HttpsError('invalid-argument', 'Текст сообщения не должен превышать 500 символов');
    }

    // Получаем данные отправителя
    const senderDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!senderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Пользователь не найден');
    }

    const senderData = senderDoc.data();
    const senderRole = senderData.role;
    const senderDeveloperId = senderData.developerId;

    // Проверяем права: премиум застройщики и администраторы могут отправлять уведомления
    if (senderRole !== 'премиум застройщик' && senderRole !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Только премиум застройщики и администраторы могут отправлять уведомления');
    }

    // Проверяем developerId только для премиум застройщиков
    if (senderRole === 'премиум застройщик' && !senderDeveloperId) {
      throw new functions.https.HttpsError('permission-denied', 'У пользователя не указан ID застройщика');
    }

    // Проверяем лимиты отправки (не более 10 уведомлений в день)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sentTodaySnapshot = await admin.firestore()
      .collection('developerNotifications')
      .where('senderId', '==', userId)
      .where('createdAt', '>=', today)
      .where('createdAt', '<', tomorrow)
      .get();

    if (sentTodaySnapshot.size >= 10) {
      throw new functions.https.HttpsError('resource-exhausted', 'Превышен лимит отправки уведомлений (10 в день)');
    }

    // Проверяем частоту отправки (не более 1 уведомления в 5 минут)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentNotificationsSnapshot = await admin.firestore()
      .collection('developerNotifications')
      .where('senderId', '==', userId)
      .where('createdAt', '>=', fiveMinutesAgo)
      .get();

    if (recentNotificationsSnapshot.size > 0) {
      throw new functions.https.HttpsError('resource-exhausted', 'Слишком частая отправка. Подождите 5 минут между отправками.');
    }

    // Базовая фильтрация контента на спам
    const spamKeywords = ['кредит', 'займ', 'бесплатно', 'срочно', 'успей', 'акция заканчивается', 'только сегодня'];
    const lowerTitle = title.toLowerCase();
    const lowerBody = body.toLowerCase();
    
    const containsSpam = spamKeywords.some(keyword => 
      lowerTitle.includes(keyword) || lowerBody.includes(keyword)
    );

    if (containsSpam) {
      // Логируем подозрительный контент, но не блокируем полностью
      console.warn(`Potential spam content detected from user ${userId}: "${title}" - "${body}"`);
      
      // Можно добавить дополнительные ограничения для подозрительного контента
      await admin.firestore().collection('suspiciousNotifications').add({
        senderId: userId,
        senderEmail: senderData.email,
        title: title,
        body: body,
        detectedKeywords: spamKeywords.filter(keyword => 
          lowerTitle.includes(keyword) || lowerBody.includes(keyword)
        ),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: context.rawRequest?.ip || 'unknown'
      });
    }

    // Проверяем длину и качество контента
    if (title.length < 3) {
      throw new functions.https.HttpsError('invalid-argument', 'Заголовок слишком короткий (минимум 3 символа)');
    }

    if (body.length < 10) {
      throw new functions.https.HttpsError('invalid-argument', 'Текст сообщения слишком короткий (минимум 10 символов)');
    }

    // Проверяем на повторяющийся контент
    const duplicateSnapshot = await admin.firestore()
      .collection('developerNotifications')
      .where('senderId', '==', userId)
      .where('title', '==', title)
      .where('body', '==', body)
      .limit(1)
      .get();

    if (!duplicateSnapshot.empty) {
      throw new functions.https.HttpsError('already-exists', 'Уведомление с таким содержимым уже было отправлено');
    }

    // Получаем список FCM токенов пользователей iOS приложения
    let targetTokens = [];
    let targetUserIds = [];

    if (senderRole === 'admin' && targetAudience === 'role_specific' && targetRole) {
      // Для администратора: отправляем пользователям с определенной ролью
      console.log(`Admin sending notification to users with role: ${targetRole}`);
      
      // Получаем пользователей с указанной ролью
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('role', '==', targetRole)
        .get();

      const targetUserIds = usersSnapshot.docs.map(doc => doc.id);
      
      if (targetUserIds.length === 0) {
        throw new functions.https.HttpsError('failed-precondition', `Не найдено пользователей с ролью: ${targetRole}`);
      }

      // Получаем FCM токены для этих пользователей
      const tokensSnapshot = await admin.firestore()
        .collection('userTokens')
        .where('platform', '==', 'iOS')
        .where('userId', 'in', targetUserIds)
        .get();

      tokensSnapshot.forEach(doc => {
        const tokenData = doc.data();
        if (tokenData.fcmToken) {
          targetTokens.push(tokenData.fcmToken);
          targetUserIds.push(tokenData.userId);
        }
      });
    } else {
      // Для премиум застройщиков или администраторов: отправляем всем пользователям iOS приложения
      console.log('Sending notification to all iOS users');
      
      const tokensSnapshot = await admin.firestore()
        .collection('userTokens')
        .where('platform', '==', 'iOS')
        .get();

      tokensSnapshot.forEach(doc => {
        const tokenData = doc.data();
        if (tokenData.fcmToken) {
          targetTokens.push(tokenData.fcmToken);
          targetUserIds.push(tokenData.userId);
        }
      });
    }

    if (targetTokens.length === 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Не найдено получателей для отправки уведомления');
    }

    // Ограничиваем количество получателей (максимум 1000 за раз)
    if (targetTokens.length > 1000) {
      targetTokens = targetTokens.slice(0, 1000);
      targetUserIds = targetUserIds.slice(0, 1000);
    }

    // Формируем данные уведомления
    const notification = {
      title: title,
      body: body
    };

    const messageData = {
      type: 'developer_message',
      senderId: userId,
      senderName: senderData.name || senderData.email,
      ...(senderDeveloperId && { developerId: senderDeveloperId }),
      timestamp: Date.now().toString()
    };

    // Создаем сообщение для отправки
    const message = {
      notification: notification,
      data: messageData,
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            sound: 'default',
            badge: 1,
            'content-available': 1
          },
          type: 'developer_message',
          senderId: userId,
          senderName: senderData.name || senderData.email,
          ...(senderDeveloperId && { developerId: senderDeveloperId }),
          timestamp: Date.now().toString()
        }
      },
      tokens: targetTokens
    };

    // Отправляем уведомление
    const response = await admin.messaging().sendEachForMulticast(message);

    // Сохраняем информацию об отправке
    const notificationRecord = {
      senderId: userId,
      senderName: senderData.name || senderData.email,
      senderEmail: senderData.email,
      ...(senderDeveloperId && { developerId: senderDeveloperId }),
      title: title,
      body: body,
      targetAudience: targetAudience || 'all_users',
      targetRole: targetRole || null,
      targetTokensCount: targetTokens.length,
      targetUserIds: targetUserIds,
      successCount: response.successCount,
      failureCount: response.failureCount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      responses: response.responses.map(r => ({
        success: r.success,
        error: r.error ? r.error.message : null
      })),
      // Дополнительные данные для аудита
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
      contentLength: title.length + body.length,
      hasSpamKeywords: containsSpam
    };

    const docRef = await admin.firestore().collection('developerNotifications').add(notificationRecord);

    // Логируем действие в системный лог для аудита
    await admin.firestore().collection('auditLogs').add({
      action: 'send_notification',
      userId: userId,
      userEmail: senderData.email,
      userRole: senderRole,
      ...(senderDeveloperId && { developerId: senderDeveloperId }),
      details: {
        notificationId: docRef.id,
        title: title,
        targetAudience: targetAudience || 'all_users',
        targetRole: targetRole || null,
        targetCount: targetTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown'
    });

    console.log(`Developer notification sent: ${response.successCount}/${targetTokens.length} successful`);

    return {
      success: true,
      notificationId: docRef.id,
      targetCount: targetTokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      message: `Уведомление отправлено ${response.successCount} из ${targetTokens.length} получателей`
    };

  } catch (error) {
    console.error('Error sending developer notification:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Ошибка при отправке уведомления');
  }
});

// Функция для получения истории отправленных уведомлений
exports.getDeveloperNotificationHistory = functions.https.onCall(async (data, context) => {
  try {
    // Диагностика контекста авторизации
    console.log('🔍 History auth context debug:', {
      contextExists: !!context,
      authExists: !!context?.auth,
      authUid: context?.auth?.uid,
      authToken: context?.auth?.token ? 'TOKEN_EXISTS' : 'NO_TOKEN'
    });

    // Временное решение: извлекаем UID из rawData если context.auth пустой
    let userId;
    if (context.auth && context.auth.uid) {
      userId = context.auth.uid;
      console.log('✅ History using context.auth.uid:', userId);
    } else if (data.rawRequest?.auth?.uid) {
      userId = data.rawRequest.auth.uid;
      console.log('✅ History using rawRequest.auth.uid:', userId);
    } else if (data.auth?.uid) {
      userId = data.auth.uid;
      console.log('✅ History using data.auth.uid:', userId);
    } else {
      console.error('❌ No user ID found in history function');
      throw new functions.https.HttpsError('unauthenticated', 'Пользователь не авторизован');
    }
    const { limit = 20 } = data;

    // Получаем данные пользователя для проверки роли
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Пользователь не найден');
    }

    const userData = userDoc.data();
    if (userData.role !== 'премиум застройщик' && userData.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Доступ запрещен');
    }

    // Получаем историю уведомлений
    const historySnapshot = await admin.firestore()
      .collection('developerNotifications')
      .where('senderId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(Math.min(limit, 50))
      .get();

    const history = historySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        body: data.body,
        targetAudience: data.targetAudience,
        targetCount: data.targetTokensCount,
        successCount: data.successCount,
        failureCount: data.failureCount,
        createdAt: data.createdAt?.toDate?.() || null
      };
    });

    return {
      success: true,
      history: history
    };

  } catch (error) {
    console.error('Error getting notification history:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Ошибка при получении истории');
  }
});

// Функция для получения статистики уведомлений
exports.getDeveloperNotificationStats = functions.https.onCall(async (data, context) => {
  try {
    // Диагностика контекста авторизации
    console.log('🔍 Stats auth context debug:', {
      contextExists: !!context,
      authExists: !!context?.auth,
      authUid: context?.auth?.uid,
      authToken: context?.auth?.token ? 'TOKEN_EXISTS' : 'NO_TOKEN'
    });

    // Временное решение: извлекаем UID из rawData если context.auth пустой
    let userId;
    if (context.auth && context.auth.uid) {
      userId = context.auth.uid;
      console.log('✅ Stats using context.auth.uid:', userId);
    } else if (data.rawRequest?.auth?.uid) {
      userId = data.rawRequest.auth.uid;
      console.log('✅ Stats using rawRequest.auth.uid:', userId);
    } else if (data.auth?.uid) {
      userId = data.auth.uid;
      console.log('✅ Stats using data.auth.uid:', userId);
    } else {
      console.error('❌ No user ID found in stats function');
      throw new functions.https.HttpsError('unauthenticated', 'Пользователь не авторизован');
    }

    // Получаем данные пользователя для проверки роли
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Пользователь не найден');
    }

    const userData = userDoc.data();
    if (userData.role !== 'премиум застройщик' && userData.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Доступ запрещен');
    }

    // Получаем статистику за сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySnapshot = await admin.firestore()
      .collection('developerNotifications')
      .where('senderId', '==', userId)
      .where('createdAt', '>=', today)
      .where('createdAt', '<', tomorrow)
      .get();

    // Получаем общую статистику
    const totalSnapshot = await admin.firestore()
      .collection('developerNotifications')
      .where('senderId', '==', userId)
      .get();

    const todayStats = {
      sent: todaySnapshot.size,
      remaining: Math.max(0, 10 - todaySnapshot.size)
    };

    let totalSent = 0;
    let totalSuccess = 0;
    let totalFailure = 0;
    let lastSentDate = null;

    totalSnapshot.forEach(doc => {
      const data = doc.data();
      totalSent++;
      totalSuccess += data.successCount || 0;
      totalFailure += data.failureCount || 0;
      
      // Находим последнюю дату отправки
      if (data.createdAt && (!lastSentDate || data.createdAt > lastSentDate)) {
        lastSentDate = data.createdAt;
      }
    });

    console.log('🔍 Last sent date debug:', {
      lastSentDate: lastSentDate,
      lastSentDateType: typeof lastSentDate,
      lastSentToDate: lastSentDate ? lastSentDate.toDate() : null
    });

    return {
      success: true,
      stats: {
        today: todayStats,
        total: {
          sent: totalSent,
          successCount: totalSuccess,
          failureCount: totalFailure
        },
        lastSent: lastSentDate ? lastSentDate.toDate().toISOString() : null
      }
    };

  } catch (error) {
    console.error('Error getting notification stats:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Ошибка при получении статистики');
  }
});

// ==================== AI TRANSLATION FUNCTIONS ====================

// Импортируем OpenAI
let OpenAI;
let openai;

// Функция для инициализации OpenAI с секретом
function initializeOpenAI(apiKey) {
  try {
    const OpenAI = require('openai');
    return new OpenAI({
      apiKey: apiKey
    });
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error);
    return null;
  }
}

/**
 * Определяет язык текста с помощью ИИ
 * @param {string} text - текст для определения языка
 * @returns {Promise<string>} - код языка (например, 'ru', 'en', 'id')
 */
async function detectLanguage(text) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a language detection expert. Analyze the given text and respond with ONLY the ISO 639-1 language code (e.g., "ru" for Russian, "en" for English, "id" for Indonesian, "fr" for French, "de" for German, "es" for Spanish, "it" for Italian, "pt" for Portuguese, "zh" for Chinese, "ja" for Japanese, "ko" for Korean, "ar" for Arabic, "hi" for Hindi, "th" for Thai, "vi" for Vietnamese). Do not include any other text or explanation.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 10,
      temperature: 0
    });

    const detectedLanguage = response.choices[0]?.message?.content?.trim().toLowerCase();
    
    // Валидация кода языка
    const validLanguages = ['ru', 'en', 'id', 'fr', 'de', 'es', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'th', 'vi'];
    if (validLanguages.includes(detectedLanguage)) {
      return detectedLanguage;
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting language:', error);
    return null;
  }
}

/**
 * Переводит текст с помощью ИИ
 * @param {string} text - текст для перевода
 * @param {string} targetLanguage - целевой язык (код языка)
 * @param {string} sourceLanguage - исходный язык (код языка, опционально)
 * @returns {Promise<string>} - переведенный текст
 */
async function translateText(text, targetLanguage, sourceLanguage = null) {
  try {
    const languageNames = {
      'ru': 'Russian',
      'en': 'English',
      'id': 'Indonesian',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese'
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    const sourceLangName = sourceLanguage ? languageNames[sourceLanguage] || sourceLanguage : 'auto';

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given text from ${sourceLangName} to ${targetLangName}. Maintain the original meaning, tone, and formatting. If the text contains technical terms or proper nouns, translate them appropriately for the target language. Respond with ONLY the translated text, no explanations or additional text.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const translatedText = response.choices[0]?.message?.content?.trim();
    
    return translatedText || text;
  } catch (error) {
    console.error('Error translating text:', error);
    return text;
  }
}

/**
 * Автоматически переводит текст на целевой язык
 * @param {string} text - текст для перевода
 * @param {string} targetLanguage - целевой язык
 * @returns {Promise<string>} - переведенный текст
 */
async function autoTranslate(text, targetLanguage) {
  if (!text || !targetLanguage) {
    return text;
  }

  try {
    // Определяем язык оригинала
    const sourceLanguage = await detectLanguage(text);
    
    // Если язык не определен или совпадает с целевым, возвращаем оригинал
    if (!sourceLanguage || sourceLanguage === targetLanguage) {
      return text;
    }

    // Переводим текст
    const translatedText = await translateText(text, targetLanguage, sourceLanguage);
    
    return translatedText;
  } catch (error) {
    console.error('Error in auto-translation:', error);
    return text;
  }
}

/**
 * Автоматически переводит текст на целевой язык с переданным клиентом
 * @param {string} text - текст для перевода
 * @param {string} targetLanguage - целевой язык
 * @param {Object} openaiClient - клиент OpenAI
 * @returns {Promise<Object>} - объект с переведенным текстом и языком оригинала
 */
async function autoTranslateWithClient(text, targetLanguage, openaiClient) {
  if (!text || !targetLanguage || !openaiClient) {
    return { translatedText: text, sourceLanguage: 'unknown' };
  }

  try {
    // Определяем язык оригинала
    const sourceLanguage = await detectLanguageWithClient(text, openaiClient);
    
    // Если язык не определен или совпадает с целевым, возвращаем оригинал
    if (!sourceLanguage || sourceLanguage === targetLanguage) {
      return { translatedText: text, sourceLanguage: sourceLanguage || 'unknown' };
    }

    // Переводим текст
    const translatedText = await translateTextWithClient(text, targetLanguage, sourceLanguage, openaiClient);
    
    return { translatedText, sourceLanguage };
  } catch (error) {
    console.error('Error in auto-translation with client:', error);
    return { translatedText: text, sourceLanguage: 'unknown' };
  }
}

/**
 * Определяет язык текста с помощью ИИ (с переданным клиентом)
 * @param {string} text - текст для определения языка
 * @param {Object} openaiClient - клиент OpenAI
 * @returns {Promise<string>} - код языка (например, 'ru', 'en', 'id')
 */
async function detectLanguageWithClient(text, openaiClient) {
  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a language detection expert. Analyze the given text and respond with ONLY the ISO 639-1 language code (e.g., "ru" for Russian, "en" for English, "id" for Indonesian, "fr" for French, "de" for German, "es" for Spanish, "it" for Italian, "pt" for Portuguese, "zh" for Chinese, "ja" for Japanese, "ko" for Korean, "ar" for Arabic, "hi" for Hindi, "th" for Thai, "vi" for Vietnamese). Do not include any other text or explanation.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 10,
      temperature: 0
    });

    const detectedLanguage = response.choices[0]?.message?.content?.trim().toLowerCase();
    
    // Валидация кода языка
    const validLanguages = ['ru', 'en', 'id', 'fr', 'de', 'es', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'th', 'vi'];
    if (validLanguages.includes(detectedLanguage)) {
      return detectedLanguage;
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting language with client:', error);
    return null;
  }
}

/**
 * Переводит текст с помощью ИИ (с переданным клиентом)
 * @param {string} text - текст для перевода
 * @param {string} targetLanguage - целевой язык (код языка)
 * @param {string} sourceLanguage - исходный язык (код языка, опционально)
 * @param {Object} openaiClient - клиент OpenAI
 * @returns {Promise<string>} - переведенный текст
 */
async function translateTextWithClient(text, targetLanguage, sourceLanguage = null, openaiClient) {
  try {
    const languageNames = {
      'ru': 'Russian',
      'en': 'English',
      'id': 'Indonesian',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese'
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    const sourceLangName = sourceLanguage ? languageNames[sourceLanguage] || sourceLanguage : 'auto';

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given text from ${sourceLangName} to ${targetLangName}. Maintain the original meaning, tone, and formatting. If the text contains technical terms or proper nouns, translate them appropriately for the target language. Respond with ONLY the translated text, no explanations or additional text.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const translatedText = response.choices[0]?.message?.content?.trim();
    
    return translatedText || text;
  } catch (error) {
    console.error('Error translating text with client:', error);
    return text;
  }
}

// Firebase Function для перевода текста (Callable)
exports.translateText = functions.https.onCall(async (data, context) => {
  try {
    const { text, targetLanguage } = data;

    // Валидация входных данных
    if (!text || !targetLanguage) {
      throw new functions.https.HttpsError('invalid-argument', 'Text and targetLanguage are required');
    }

    // Проверяем, что targetLanguage является валидным
    const validLanguages = ['ru', 'en', 'id', 'fr', 'de', 'es', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'th', 'vi'];
    if (!validLanguages.includes(targetLanguage)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid targetLanguage');
    }

    console.log(`🔄 Starting translation: ${targetLanguage}, text length: ${text.length}`);

    // Инициализируем OpenAI с переменной окружения
    const openaiClient = initializeOpenAI(process.env.OPENAI_API_KEY);

    if (!openaiClient) {
      throw new functions.https.HttpsError('internal', 'OpenAI client not available');
    }

    // Выполняем автоматический перевод с новым клиентом
    const result = await autoTranslateWithClient(text, targetLanguage, openaiClient);

    console.log(`✅ Translation completed: ${targetLanguage}`);

    return {
      success: true,
      translatedText: result.translatedText,
      targetLanguage,
      sourceLanguage: result.sourceLanguage
    };

  } catch (error) {
    console.error('❌ Translation error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Ошибка при переводе текста');
  }
});

// Firebase Function для перевода текста (HTTP endpoint с CORS)
const cors = require('cors')({ origin: true });

exports.translateTextHttp = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Проверяем метод запроса
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { text, targetLanguage } = req.body;

      // Валидация входных данных
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Text and targetLanguage are required' });
      }

      // Проверяем, что targetLanguage является валидным
      const validLanguages = ['ru', 'en', 'id', 'fr', 'de', 'es', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'th', 'vi'];
      if (!validLanguages.includes(targetLanguage)) {
        return res.status(400).json({ error: 'Invalid targetLanguage' });
      }

      console.log(`🔄 Starting translation (HTTP): ${targetLanguage}, text length: ${text.length}`);

      // Инициализируем OpenAI с переменной окружения
      const openaiClient = initializeOpenAI(process.env.OPENAI_API_KEY);

      if (!openaiClient) {
        return res.status(500).json({ error: 'OpenAI client not available' });
      }

      // Выполняем автоматический перевод с новым клиентом
      const result = await autoTranslateWithClient(text, targetLanguage, openaiClient);

      console.log(`✅ Translation completed (HTTP): ${targetLanguage}`);

      return res.status(200).json({
        success: true,
        translatedText: result.translatedText,
        targetLanguage,
        sourceLanguage: result.sourceLanguage
      });

    } catch (error) {
      console.error('❌ Translation error (HTTP):', error);
      return res.status(500).json({ error: 'Ошибка при переводе текста' });
    }
  });
});