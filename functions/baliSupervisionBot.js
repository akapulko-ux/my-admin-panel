const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Lazy init
if (!admin.apps.length) { admin.initializeApp(); }

function getDb() { return admin.firestore(); }

async function ensureBotDoc(botId, data) {
  try {
    const ref = getDb().collection('bots').doc(String(botId));
    await ref.set({ botId: String(botId), isActive: true, updatedAt: admin.firestore.FieldValue.serverTimestamp(), ...(data || {}) }, { merge: true });
  } catch (_) {}
}

async function logBotMessage(botId, chatId, payload) {
  try {
    const db = getDb();
    const convRef = db.collection('bots').doc(String(botId)).collection('conversations').doc(String(chatId));
    const now = admin.firestore.FieldValue.serverTimestamp();
    await convRef.set({
      botId: String(botId),
      chatId: String(chatId),
      lastAt: now,
      lastMessage: (payload && payload.text) || null,
      lastDirection: payload && payload.direction || null
    }, { merge: true });
    await convRef.collection('messages').add({ ...payload, botId: String(botId), chatId: String(chatId), timestamp: now });
  } catch (_) {}
}

function getToken() {
  // Используем переменную окружения
  return process.env.BALI_SUPERVISION_BOT_TOKEN;
}

const BOT_USERNAME = 'bali_supervision_bot';
const MANAGER_USERNAME = 'ivan_tsyrulnikov';

// Lazy initialization of Firestore references
function getCfgRef() {
  return admin.firestore().collection('baliSupervisionBot').doc('config');
}

function getMapsRef() {
  return admin.firestore().collection('baliSupervisionBot').doc('maps').collection('byForwardId');
}

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
  const replyKeyboard = {
    inline_keyboard: [[
      { text: 'Ответить', callback_data: `reply:${from.id}` }
    ]]
  };
  const res = await sendMessage(managerChatId, `${header}${body}`, replyKeyboard);
  // map forwarded manager message id -> original user chat id
  await getMapsRef().doc(String(res.message_id)).set({ userChatId: String(from.id), createdAt: admin.firestore.FieldValue.serverTimestamp() });
  return res;
}

exports.baliSupervisionTelegramWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  if (!getToken()) return res.status(500).send('Bot token is not configured');
  try {
    const update = req.body || {};
    await ensureBotDoc('supervision', { name: 'Bali Supervision Bot', slug: 'bali-supervision' });
    // Обработка callback-кнопок (Ответить / выбор услуги)
    if (update.callback_query && update.callback_query.data) {
      const data = update.callback_query.data;
      // Быстрый ответ менеджеру
      if (data.startsWith('reply:')) {
        const managerChatId = update.callback_query.message.chat.id;
        const userId = data.split(':')[1];
        const preset = `/reply ${userId} `;
        await sendMessage(managerChatId, `Ответ пользователю <code>${userId}</code>:\n${preset}`);
        return res.status(200).send('OK');
      }
      // Выбор услуги пользователем → отправляем описание
      if (data === 'svc:supervision' || data === 'svc:acceptance' || data === 'svc:build') {
        const chatId = update.callback_query.message.chat.id;
        let textOut = '';
        if (data === 'svc:supervision') {
          textOut = [
            'Технадзор — полный контроль качества и сроков работ:',
            '• Регулярные выезды инженера на объект',
            '• Контроль соответствия проекту и нормам',
            '• Контроль графика и плана работ',
            '• Фото/видеофиксация, еженедельные отчёты',
            '• Рекомендации по устранению нарушений',
            '',
            'Стоимость: $1500 / мес.',
            '',
            'Напишите здесь ваш запрос: объект, стадия (готов/строится), задачи и сроки — менеджер ответит вам в этом чате.'
          ].join('\n');
        } else if (data === 'svc:acceptance') {
          textOut = [
            'Приемка объекта — детальная инспекция перед передачей:',
            '• Чек‑лист 50+ пунктов (готовый или строящийся объект)',
            '• Проверка соответствия проектной документации',
            '• Проверка инженерных систем',
            '• Фото/видеофиксация замечаний для подрядчика и заказчика',
            '• Экспертное заключение',
            '',
            'Стоимость: $600',
            '',
            'Напишите адрес/описание объекта, желаемые сроки и контактные данные — менеджер свяжется с вами здесь.'
          ].join('\n');
        } else {
          textOut = [
            'Индивидуальное строительство — «под ключ» с прозрачным контролем:',
            '• Концепция, ТЗ и проект под бюджет',
            '• Детальная смета, оптимизация затрат',
            '• Согласования и юридическое сопровождение',
            '• Закупка материалов, контроль качества',
            '• Организация работ и ежедневный контроль',
            '• Регулярные отчёты, собственное IT‑решение для контроля',
            '',
            'Стоимость: от $2000 / м²',
            '',
            'Опишите объект/участок, задачи и сроки — менеджер свяжется с вами в этом чате.'
          ].join('\n');
        }
        await sendMessage(chatId, textOut);

        // Уведомим менеджера о выборе услуги
        try {
          const cfgSnap = await getCfgRef().get();
          const cfg = cfgSnap.exists ? (cfgSnap.data() || {}) : {};
          const managerChatId = cfg.managerChatId ? Number(cfg.managerChatId) : null;
          if (managerChatId) {
            const u = update.callback_query.from || {};
            const serviceName = data === 'svc:supervision' ? 'Технадзор' : data === 'svc:acceptance' ? 'Приемка объекта' : 'Индивидуальное строительство';
            const lines = [
              '🛎 Выбор услуги пользователем',
              `Услуга: <b>${serviceName}</b>`,
              `От: <b>${(u.first_name || '') + ' ' + (u.last_name || '')}</b> ${u.username ? `( @${u.username} )` : ''}`,
              `Chat ID: <code>${u.id}</code>`
            ].join('\n');
            await sendMessage(managerChatId, lines);
          }
        } catch (_) { /* ignore manager notify errors */ }
        return res.status(200).send('OK');
      }
    }
    const msg = update.message || update.edited_message || null;
    if (!msg) return res.status(200).send('OK');
    const chatId = msg.chat && msg.chat.id;
    const from = msg.from || {};
    const text = msg.text || '';
    const cfgSnap = await getCfgRef().get();
    const cfg = cfgSnap.exists ? (cfgSnap.data() || {}) : {};
    const managerChatId = cfg.managerChatId ? Number(cfg.managerChatId) : null;
    const isManager = (from.username || '').toLowerCase() === MANAGER_USERNAME.toLowerCase();
    if (isManager && typeof text === 'string' && text.trim().toLowerCase().startsWith('/start')) {
      await getCfgRef().set({ managerChatId: String(chatId), managerUsername: MANAGER_USERNAME, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      await sendMessage(chatId, '✅ Бот подключен. Теперь все обращения пользователей будут пересылаться сюда. Отвечайте, используя ответ на сообщении (Reply).');
      try { await logBotMessage('supervision', chatId, { direction: 'out', text: '✅ Бот подключен...' }); } catch (_) {}
      return res.status(200).send('OK');
    }
    // Текстовая команда для ответа: /reply <userId> <message>
    if (isManager && typeof text === 'string' && text.trim().toLowerCase().startsWith('/reply')) {
      const parts = text.split(' ');
      const userId = parts[1];
      const replyMsg = parts.slice(2).join(' ');
      if (userId && replyMsg) {
        await sendMessage(Number(userId), replyMsg);
        try { await logBotMessage('supervision', String(userId), { direction: 'out', text: replyMsg }); } catch (_) {}
        await sendMessage(chatId, '✅ Отправлено пользователю.');
      } else {
        await sendMessage(chatId, 'Формат: /reply <userId> <сообщение>');
      }
      return res.status(200).send('OK');
    }
    if (typeof text === 'string' && text.trim().toLowerCase().startsWith('/start')) {
      const welcome = [
        'Здравствуйте! Это BALI SUPERVISION.\n',
        'Мы оказываем услуги технического надзора и приемки объектов на Бали: контроль качества и сроков работ, фото/видео фиксация, еженедельные отчёты, приемка готовых объектов.\n',
        'Опишите, пожалуйста, ваш запрос — объект, стадия (готов/строится), задачи и сроки. Менеджер ответит вам здесь в ближайшее время.',
        '',
        'Выберете интересующую вас услугу.'
      ].join('\n');
      const keyboard = {
        inline_keyboard: [
          [{ text: 'Технадзор', callback_data: 'svc:supervision' }],
          [{ text: 'Приемка объекта', callback_data: 'svc:acceptance' }],
          [{ text: 'Индивидуальное строительство', callback_data: 'svc:build' }]
        ]
      };
      await sendMessage(chatId, welcome, keyboard);
      // Дополняем профиль беседы username/имя по возможности
      try {
        const token = getToken();
        const resp = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`);
        const json = await resp.json();
        if (resp.ok && json.ok && json.result) {
          const dn = [json.result.first_name, json.result.last_name].filter(Boolean).join(' ').trim() || (json.result.username ? `@${json.result.username}` : null);
          await admin.firestore().collection('bots').doc('supervision').collection('conversations').doc(String(chatId)).set({
            username: json.result.username || admin.firestore.FieldValue.delete(),
            firstName: json.result.first_name || admin.firestore.FieldValue.delete(),
            lastName: json.result.last_name || admin.firestore.FieldValue.delete(),
            displayName: dn || admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      } catch (_) {}
      try { await logBotMessage('supervision', chatId, { direction: 'out', text: welcome }); } catch (_) {}
      if (managerChatId) {
        await forwardToManager(managerChatId, from, '[Нажал /start]');
      }
      return res.status(200).send('OK');
    }
    if (!isManager) {
      if (!managerChatId) {
        await sendMessage(chatId, 'Благодарим! Менеджер скоро подключит бота и ответит вам.');
        return res.status(200).send('OK');
      }
      await forwardToManager(managerChatId, from, text || '[сообщение без текста]');
      try { await logBotMessage('supervision', chatId, { direction: 'in', text: text || '', userId: from.id, username: from.username || null }); } catch (_) {}
      return res.status(200).send('OK');
    }
    if (isManager && msg.reply_to_message && msg.reply_to_message.message_id) {
      const mapSnap = await getMapsRef().doc(String(msg.reply_to_message.message_id)).get();
      const mapping = mapSnap.exists ? mapSnap.data() : null;
      if (mapping && mapping.userChatId) {
        await sendMessage(Number(mapping.userChatId), text || '');
        try { await logBotMessage('supervision', String(mapping.userChatId), { direction: 'out', text: text || '' }); } catch (_) {}
        return res.status(200).send('OK');
      }
      await sendMessage(chatId, 'Не удалось определить получателя. Ответьте Reply или используйте команду /reply <userId> <сообщение>.');
      return res.status(200).send('OK');
    }
    return res.status(200).send('OK');
  } catch (e) {
    console.error('[baliSupervisionBot] webhook error:', e);
    return res.status(200).send('OK');
  }
});

// Callable: установить вебхук (ВРЕМЕННО ОТКЛЮЧЕНА ИЗ-ЗА ПРОБЛЕМ С ДЕПЛОЕМ)
// exports.baliSupervisionSetWebhook = functions.https.onCall(async (data, context) => {
//   try {
//     console.log('baliSupervisionSetWebhook called');
//     const url = (data && (data.url || (data.data && data.data.url))) || null;
//
//     // Получаем токен лениво
//     const token = functions.config().telegram?.supervision_bot_token ||
//                   process.env.BALI_SUPERVISION_BOT_TOKEN;
//
//     console.log('Token available:', !!token);
//
//     if (!url) throw new functions.https.HttpsError('invalid-argument', 'Укажите url');
//     if (!token) throw new functions.https.HttpsError('failed-precondition', 'Нет токена бота');
//
//     const resp = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
//       method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url })
//     });
//     const result = await resp.json();
//     if (!resp.ok) throw new functions.https.HttpsError('internal', result.description || 'Telegram API error');
//     return { success: true, result };
//   } catch (error) {
//     console.error('baliSupervisionSetWebhook error:', error);
//     throw error;
//   }
// });

// Экспорт токена для использования в других функциях (UI-отправка)
exports.getSupervisionBotToken = getToken;


