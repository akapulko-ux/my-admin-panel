const express = require('express');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const { authenticateApiKey, checkUserAccess, securityChecks, logApiRequest } = require('../middleware/auth');

const router = express.Router();

// Middleware
router.use(authenticateApiKey);
router.use(checkUserAccess);
router.use(securityChecks);

function slugify(text) {
  return (text || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'bot';
}

function generateSecretToken() {
  return uuidv4().replace(/-/g, '');
}

async function setWebhook(botToken, webhookUrl, secretToken) {
  const resp = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, secret_token: secretToken })
  });
  const data = await resp.json();
  if (!resp.ok || data.ok === false) {
    throw new Error(`setWebhook failed: ${JSON.stringify(data)}`);
  }
  return data;
}

async function setMenuButton(botToken, text, url) {
  const payload = {
    menu_button: { type: 'web_app', text, web_app: { url } },
  };
  const resp = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await resp.json();
  if (!resp.ok || data.ok === false) {
    throw new Error(`setChatMenuButton failed: ${JSON.stringify(data)}`);
  }
  return data;
}

// GET /v1/bots - список ботов текущего пользователя (admin видит всех)
router.get('/', async (req, res) => {
  const { userRole, userId } = req;
  try {
    let q = admin.firestore().collection('bots');
    if (userRole !== 'admin') {
      q = q.where('ownerUserId', '==', userId);
    }
    const snap = await q.orderBy('createdAt', 'desc').get();
    const bots = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    await logApiRequest(req.apiKeyId, req.userId, '/bots', 'GET', 200, Date.now() - req.startTime, req.ip, req.get('User-Agent'));
    res.json({ data: bots });
  } catch (e) {
    console.error('bots:list error', e);
    res.status(500).json({ error: 'Failed to list bots' });
  }
});

// POST /v1/bots - создать бота (premium roles only)
router.post('/', async (req, res) => {
  const { userRole, userId } = req;
  if (!['premium agent', 'премиум застройщик'].includes(userRole)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const { name, telegramBotToken, menuButtonText = 'Find a property with AI' } = req.body || {};
  if (!name || !telegramBotToken) {
    return res.status(400).json({ error: 'name and telegramBotToken are required' });
  }
  try {
    const botId = uuidv4();
    const slug = slugify(name);
    const secretToken = generateSecretToken();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const record = {
      botId,
      slug,
      name,
      telegramBotToken,
      ownerUserId: userId,
      roleScope: userRole,
      isActive: true,
      secretToken,
      menuButtonText,
      createdAt: now,
      updatedAt: now,
    };

    await admin.firestore().collection('bots').doc(botId).set(record);

    // Try to set webhook if TENANT_WEBHOOK_URL provided
    const tenantWebhookBase = process.env.TENANT_WEBHOOK_URL; // e.g., https://<function-url>/tenantTelegramWebhook
    let webhookResult = null;
    if (tenantWebhookBase) {
      const url = `${tenantWebhookBase}?botId=${encodeURIComponent(botId)}`;
      try { webhookResult = await setWebhook(telegramBotToken, url, secretToken); } catch (_) {}
    }

    await logApiRequest(req.apiKeyId, req.userId, '/bots', 'POST', 200, Date.now() - req.startTime, req.ip, req.get('User-Agent'));
    res.json({ data: { ...record, webhookSet: Boolean(webhookResult) } });
  } catch (e) {
    console.error('bots:create error', e);
    res.status(500).json({ error: 'Failed to create bot' });
  }
});

// PATCH /v1/bots/:botId - обновить бота (только владелец или admin)
router.patch('/:botId', async (req, res) => {
  const { userRole, userId } = req;
  const { botId } = req.params;
  const { isActive, menuButtonText } = req.body || {};
  try {
    const ref = admin.firestore().collection('bots').doc(botId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Bot not found' });
    const data = doc.data();
    if (userRole !== 'admin' && data.ownerUserId !== userId) return res.status(403).json({ error: 'Access denied' });

    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (typeof menuButtonText === 'string' && menuButtonText.trim()) updates.menuButtonText = menuButtonText.trim();
    await ref.update(updates);

    // Optionally update menu button
    try {
      if (menuButtonText) {
        const webAppUrl = process.env.PUBLIC_GALLERY_BASE_URL || 'https://it-agent.pro';
        await setMenuButton(data.telegramBotToken, menuButtonText, webAppUrl);
      }
    } catch (e) {
      console.warn('setMenuButton warning:', e.message);
    }

    await logApiRequest(req.apiKeyId, req.userId, `/bots/${botId}`, 'PATCH', 200, Date.now() - req.startTime, req.ip, req.get('User-Agent'));
    res.json({ success: true });
  } catch (e) {
    console.error('bots:update error', e);
    res.status(500).json({ error: 'Failed to update bot' });
  }
});

// DELETE /v1/bots/:botId - деактивировать/удалить (мягко деактивируем)
router.delete('/:botId', async (req, res) => {
  const { userRole, userId } = req;
  const { botId } = req.params;
  try {
    const ref = admin.firestore().collection('bots').doc(botId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Bot not found' });
    const data = doc.data();
    if (userRole !== 'admin' && data.ownerUserId !== userId) return res.status(403).json({ error: 'Access denied' });
    await ref.update({ isActive: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    await logApiRequest(req.apiKeyId, req.userId, `/bots/${botId}`, 'DELETE', 200, Date.now() - req.startTime, req.ip, req.get('User-Agent'));
    res.json({ success: true });
  } catch (e) {
    console.error('bots:delete error', e);
    res.status(500).json({ error: 'Failed to delete bot' });
  }
});

module.exports = router;


