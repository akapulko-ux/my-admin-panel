const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const speech = require("@google-cloud/speech");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Инициализируем admin SDK
admin.initializeApp();

// Клиент для распознавания речи
const speechClient = new speech.SpeechClient();
const gcs = new Storage();

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
    await admin.auth().setCustomUserClaims(userId, { role: role });
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

// Функция обновления custom claims при изменении роли пользователя (gen 2)
exports.updateUserRoleClaims = onDocumentUpdated("users/{userId}", async (event) => {
  const newData = event.data.after.data();
  const previousData = event.data.before.data();
  const userId = event.params.userId;

  if (newData.role !== previousData.role) {
    try {
      await admin.auth().setCustomUserClaims(userId, { role: newData.role });
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