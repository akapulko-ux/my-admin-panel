const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const speech = require("@google-cloud/speech");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Telegram Bot Token
const BOT_TOKEN = "8168450032:AAHjSVJn8VqcBEsgK_NtbfgqxGeXW0buaUM";

// Инициализируем admin SDK
admin.initializeApp();

// Клиент для распознавания речи
const speechClient = new speech.SpeechClient();
const gcs = new Storage();

// Определение ролей и их алиасов
const ROLES = {
  admin: ['admin', 'administrator', 'администратор'],
  moderator: ['moderator', 'модератор', 'mod'],
  premium_agent: ['premium_agent', 'premium agent', 'премиум агент', 'премиум-агент', 'premium'],
  agent: ['agent', 'агент'],
  user: ['user', 'пользователь', ''],
  застройщик: ['застройщик']
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
    if (role === 'застройщик' && newData.developerId) {
      claims.developerId = newData.developerId;
    }
    
    await admin.auth().setCustomUserClaims(userId, claims);
    console.log(`Custom claims установлены для нового пользователя ${userId} с ролью ${role}`);
    
    // Обновляем документ с информацией о времени установки claims
    await event.data.ref.update({
      lastRoleUpdate: admin.firestore.FieldValue.serverTimestamp()
    });
    
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
      (newData.role === 'застройщик' && newData.developerId !== previousData.developerId)) {
    try {
      const claims = { role: newData.role };
      
      // Если роль - застройщик и указан developerId, добавляем его в claims
      if (newData.role === 'застройщик' && newData.developerId) {
        claims.developerId = newData.developerId;
      }
      
      await admin.auth().setCustomUserClaims(userId, claims);
      console.log(`Роль пользователя ${userId} обновлена на ${newData.role}`);
      
      await event.data.after.ref.update({
        lastRoleUpdate: admin.firestore.FieldValue.serverTimestamp()
      });
      
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

// Функция для уведомления пользователей о новых фиксациях
exports.notifyNewFixation = onDocumentCreated("clientFixations/{fixationId}", async (event) => {
  const fixationData = event.data.data();
  
  try {
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
      
      // Проверяем права доступа пользователя к фиксации
      let hasAccess = false;
      
      if (userRole === 'admin') {
        hasAccess = true; // Админ видит все
      } else if (userRole === 'модератор') {
        hasAccess = true; // Модератор видит все
      } else if (userRole === 'застройщик') {
        // Застройщик видит только свои объекты
        if (fixationData.developerId && userData.developerId === fixationData.developerId) {
          hasAccess = true;
        }
      }
      
      if (hasAccess) {
        // Формируем подробное сообщение
        const message = `🏠 <b>Новая фиксация клиента</b>\n\n` +
          `👤 <b>Клиент:</b> ${fixationData.clientName || 'Не указан'}\n` +
          `📞 <b>Телефон:</b> ${fixationData.clientPhone || 'Не указан'}\n` +
          `👨‍💼 <b>Агент:</b> ${fixationData.agentName || 'Не указан'}\n` +
          `🏘️ <b>Комплекс:</b> ${fixationData.complexName || 'Не указан'}\n` +
          `🏗️ <b>Застройщик:</b> ${fixationData.developerName || 'Не указан'}\n` +
          `🏡 <b>Тип недвижимости:</b> ${fixationData.propertyType || 'Не указан'}\n` +
          `⏰ <b>Время:</b> ${new Date(fixationData.dateTime?.seconds * 1000 || Date.now()).toLocaleString('ru-RU')}\n\n` +
          `📱 Перейдите в админ-панель для обработки фиксации.`;
        
        notifications.push({
          chatId: telegramChatId,
          message: message,
          role: userRole,
          developerId: userData.developerId
        });
      }
    }
    
    // Отправляем уведомления асинхронно
    const sendPromises = notifications.map(async (notification) => {
      try {
        // Отправляем уведомление через Telegram Bot API
        await sendTelegramMessage(notification.chatId, notification.message);
        
        // Сохраняем запись об успешной отправке
        await admin.firestore().collection('telegramNotifications').add({
          ...notification,
          fixationId: event.params.fixationId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          sent: true,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Уведомление отправлено пользователю с ролью ${notification.role}`);
        return { success: true, role: notification.role };
      } catch (error) {
        console.error(`Ошибка отправки уведомления пользователю с ролью ${notification.role}:`, error);
        
        // Сохраняем запись о неудачной отправке
        await admin.firestore().collection('telegramNotifications').add({
          ...notification,
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
    
    console.log(`Отправлено ${successCount} уведомлений, ошибок: ${failureCount} для фиксации ${event.params.fixationId}`);
    
    return { success: true, sent: successCount, failed: failureCount, total: notifications.length };
  } catch (error) {
    console.error('Ошибка при планировании уведомлений:', error);
    return { success: false, error: error.message };
  }
});

// Функция для отправки сообщений через Telegram Bot API
const sendTelegramMessage = async (chatId, text) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
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
            
            // Автоматически подключаем пользователя
            await userDoc.ref.update({
              telegramChatId: chatId.toString(),
              telegramConnected: true,
              telegramConnectedAt: admin.firestore.FieldValue.serverTimestamp(),
              telegramVerificationCode: admin.firestore.FieldValue.delete() // Удаляем код после использования
            });
            
            const responseMessage = `✅ Подключение успешно завершено!\n\n` +
              `Теперь вы будете получать уведомления о новых фиксациях клиентов в соответствии с вашей ролью: <b>${userData.role || 'agent'}</b>\n\n` +
              `Вы можете закрыть это окно и вернуться в админ-панель.`;
            
            await sendTelegramMessage(chatId, responseMessage);
            
          } else {
            const errorMessage = `❌ Код верификации не найден или уже использован.\n\n` +
              `Получите новый код в админ-панели в разделе "Настройки".`;
            
            await sendTelegramMessage(chatId, errorMessage);
          }
        } else {
          // Отправляем справку если команда /start без параметров
          const helpMessage = `👋 Добро пожаловать в IT Agent Admin Bot!\n\n` +
            `🔗 <b>Автоматическое подключение:</b>\n` +
            `1. Перейдите в раздел "Настройки" в админ-панели\n` +
            `2. Нажмите "Подключить телеграм"\n` +
            `3. Нажмите кнопку "Подключить через Telegram"\n` +
            `4. Вы автоматически попадете сюда и подключение завершится\n\n` +
            `📱 <b>Ручное подключение:</b>\n` +
            `Отправьте команду: <code>/start ВАШ_КОД_ВЕРИФИКАЦИИ</code>\n\n` +
            `После подключения вы будете получать уведомления о новых фиксациях клиентов в соответствии с вашей ролью.`;
          
          await sendTelegramMessage(chatId, helpMessage);
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка в webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});