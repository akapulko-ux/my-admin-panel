const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Lazy init
if (!admin.apps.length) {
  admin.initializeApp();
}

function getToken() {
  // Используем переменную окружения, если задана; иначе — токен, переданный пользователем
  return process.env.BALI_SUPERVISION_BOT_TOKEN || '8424126127:AAGsb5ia4eo7yXcj9EcAvGDPNgVj9KfIYGY';
}

const BOT_USERNAME = 'bali_supervision_bot';
const MANAGER_USERNAME = 'ivan_tsyrulnikov';

const cfgRef = admin.firestore().collection('baliSupervisionBot').doc('config');
const mapsRef = admin.firestore().collection('baliSupervisionBot').doc('maps').collection('byForwardId');

async function sendMessage(chatId, text, replyMarkup) {
  const token = getToken();
  const payload = { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const data = await resp.json();
  if (!resp.ok || !data.ok) throw new Error(data.description || 'Telegram API error');
  return data.result; // contains message_id
}

async function forwardToManager(managerChatId, from, text) {
  const userLink = from.username ? `https://t.me/${from.username}` : null;
  const header = [
    `🆕 Новое обращение`,
    `От: <b>${(from.first_name || '') + ' ' + (from.last_name || '')}</b> ${from.username ? `( @${from.username} )` : ''}`,
    `Chat ID: <code>${from.id}</code>`,
    userLink ? `Профиль: ${userLink}` : null,
  ].filter(Boolean).join('\n');
  const body = text ? (`\nСообщение:\n${text}`) : '';
  const res = await sendMessage(managerChatId, `${header}${body}`);
  // map forwarded manager message id -> original user chat id
  await mapsRef.doc(String(res.message_id)).set({ userChatId: String(from.id), createdAt: admin.firestore.FieldValue.serverTimestamp() });
  return res;
}

exports.baliSupervisionTelegramWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  if (!getToken()) return res.status(500).send('Bot token is not configured');
  try {
    const update = req.body || {};
    const msg = update.message || update.edited_message || null;
    if (!msg) return res.status(200).send('OK');

    const chatId = msg.chat && msg.chat.id;
    const from = msg.from || {};
    const text = msg.text || '';

    // Получаем конфиг (менеджерский чат)
    const cfgSnap = await cfgRef.get();
    const cfg = cfgSnap.exists ? (cfgSnap.data() || {}) : {};
    const managerChatId = cfg.managerChatId ? Number(cfg.managerChatId) : null;

    // Менеджер присылает /start -> сохраняем chatId
    const isManager = (from.username || '').toLowerCase() === MANAGER_USERNAME.toLowerCase();
    if (isManager && typeof text === 'string' && text.trim().toLowerCase().startsWith('/start')) {
      await cfgRef.set({ managerChatId: String(chatId), managerUsername: MANAGER_USERNAME, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      await sendMessage(chatId, '✅ Бот подключен. Теперь все обращения пользователей будут пересылаться сюда. Отвечайте, используя ответ на сообщении (Reply).');
      return res.status(200).send('OK');
    }

    // Пользователь /start -> приветствие
    if (typeof text === 'string' && text.trim().toLowerCase().startsWith('/start')) {
      const welcome = [
        'Здравствуйте! Это бот BALI SUPERVISION.\n',
        'Мы оказываем услуги технического надзора и приемки объектов на Бали: контроль качества и сроков работ, фото/видео фиксация, еженедельные отчёты, приемка готовых объектов.\n',
        'Опишите, пожалуйста, ваш запрос — объект, стадия (готов/строится), задачи и сроки. Менеджер ответит вам здесь в ближайшее время.'
      ].join('\n');
      await sendMessage(chatId, welcome);
      // если менеджер известен — уведомим его о новом старте
      if (managerChatId) {
        await forwardToManager(managerChatId, from, '[Нажал /start]');
      }
      return res.status(200).send('OK');
    }

    // Обычные сообщения пользователя → менеджеру
    if (!isManager) {
      if (!managerChatId) {
        await sendMessage(chatId, 'Благодарим! Менеджер скоро подключит бота и ответит вам.');
        return res.status(200).send('OK');
      }
      await forwardToManager(managerChatId, from, text || '[сообщение без текста]');
      await sendMessage(chatId, '✅ Ваше сообщение отправлено менеджеру. Ожидайте ответа здесь.');
      return res.status(200).send('OK');
    }

    // Ответ менеджера на пересланное ботом сообщение (reply) → пользователю
    if (isManager && msg.reply_to_message && msg.reply_to_message.message_id) {
      const mapSnap = await mapsRef.doc(String(msg.reply_to_message.message_id)).get();
      const mapping = mapSnap.exists ? mapSnap.data() : null;
      if (mapping && mapping.userChatId) {
        await sendMessage(Number(mapping.userChatId), text || '');
        return res.status(200).send('OK');
      }
      // если нет маппинга — попросим менеджера переслать с реплаем
      await sendMessage(chatId, 'Не удалось определить получателя. Ответьте, используя Reply на сообщении пользователя.');
      return res.status(200).send('OK');
    }

    return res.status(200).send('OK');
  } catch (e) {
    console.error('[baliSupervisionBot] webhook error:', e);
    return res.status(200).send('OK');
  }
});

// Callable: установить вебхук
exports.baliSupervisionSetWebhook = functions.https.onCall(async (data, context) => {
  const url = (data && (data.url || (data.data && data.data.url))) || null;
  const token = getToken();
  if (!url) throw new functions.https.HttpsError('invalid-argument', 'Укажите url');
  if (!token) throw new functions.https.HttpsError('failed-precondition', 'Нет токена бота');
  const resp = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url })
  });
  const result = await resp.json();
  if (!resp.ok) throw new functions.https.HttpsError('internal', result.description || 'Telegram API error');
  return { success: true, result };
});


