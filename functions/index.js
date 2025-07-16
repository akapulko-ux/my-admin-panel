const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const speech = require("@google-cloud/speech");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const os = require("os");
const fs = require("fs");
const telegramTranslations = require("./telegramTranslations");

// Telegram Bot Token
const BOT_TOKEN = "8168450032:AAHjSVJn8VqcBEsgK_NtbfgqxGeXW0buaUM";

// Инициализируем admin SDK
admin.initializeApp();

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

// Вызываем установку меню при инициализации
setupWebAppMenuButton();

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
  застройщик: ['застройщик'],
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
      } else if (userRole === 'модератор') {
        hasAccess = true; // Модератор видит все
        accessReason = 'Модератор имеет доступ ко всем фиксациям';
      } else if (userRole === 'застройщик') {
        // Застройщик видит только свои объекты
        const userDeveloperId = userData.developerId;
        const fixationDeveloperId = fixationData.developerId;
        
        // Проверяем различные варианты совпадения
        const developerIdsMatch = 
          (userDeveloperId && fixationDeveloperId && userDeveloperId === fixationDeveloperId) ||
          (userDeveloperId && fixationDeveloperId && userDeveloperId.toString() === fixationDeveloperId.toString());
        
        if (developerIdsMatch) {
          hasAccess = true;
          accessReason = 'Застройщик имеет доступ к своим объектам';
        } else {
          accessReason = `Застройщик не имеет доступа: developerId не совпадают (пользователь: ${userDeveloperId}, фиксация: ${fixationDeveloperId})`;
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