const express = require('express');
const admin = require('firebase-admin');
const { authenticateApiKey, checkUserAccess, securityChecks, logApiRequest } = require('../middleware/auth');
const fetch = global.fetch || require('node-fetch');

const router = express.Router();

// Middleware
router.use(authenticateApiKey);
router.use(checkUserAccess);
router.use(securityChecks);

// GET /v1/knowledge - список документов (фильтры по типу/языку/тегам/статусу)
router.get('/', async (req, res) => {
  const { userRole, userId, tenantId } = req;
  const { type, locale, tag, status, limit = 20, page = 1 } = req.query || {};
  try {
    let q = admin.firestore().collection('knowledge_docs').where('tenantId', '==', tenantId);
    if (type) q = q.where('type', '==', type);
    if (locale) q = q.where('locale', '==', locale);
    if (status) q = q.where('status', '==', status);
    // Избегаем требований к композитным индексам: без orderBy/offset, сортируем на стороне сервера в памяти
    const snap = await q.limit(parseInt(limit)).get();
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
    await logApiRequest(req.apiKeyId, req.userId, '/knowledge', 'GET', 200, Date.now() - req.startTime, req.ip, req.get('User-Agent'));
    res.json({ data: items });
  } catch (e) {
    console.error('knowledge:list error', e);
    res.status(500).json({ error: 'Failed to list knowledge docs' });
  }
});

// GET /v1/knowledge/:id - получить документ с контентом
router.get('/:id', async (req, res) => {
  const { tenantId } = req;
  const { id } = req.params;
  try {
    const ref = admin.firestore().collection('knowledge_docs').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Document not found' });
    const data = snap.data();
    if (data.tenantId !== tenantId) return res.status(403).json({ error: 'Access denied' });
    let content = '';
    try {
      const raw = await ref.collection('raw').doc('content').get();
      content = (raw.exists && raw.data()?.content) || '';
    } catch (_) {}
    await logApiRequest(req.apiKeyId, req.userId, `/knowledge/${id}`, 'GET', 200, Date.now() - req.startTime, req.ip, req.get('User-Agent'));
    res.json({ data: { id, ...data, content } });
  } catch (e) {
    console.error('knowledge:get error', e);
    res.status(500).json({ error: 'Failed to get knowledge doc' });
  }
});

// POST /v1/knowledge - создать документ (MVP: метаданные + текстовый контент)
router.post('/', async (req, res) => {
  const { userRole, userId, tenantId } = req;
  if (!['admin', 'premium agent', 'премиум застройщик'].includes(userRole)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const { title, type, locale = 'ru', tags = [], visibility = 'public', content = '', effective_from = null, expires_at = null } = req.body || {};
  if (!title || !type) return res.status(400).json({ error: 'title and type are required' });
  try {
    const now = admin.firestore.FieldValue.serverTimestamp();
    const doc = {
      title,
      type,
      locale,
      tags,
      visibility,
      ownerUserId: userId,
      tenantId,
      status: 'queued', // queued -> indexing -> ready | error
      version: 1,
      effective_from: effective_from ? admin.firestore.Timestamp.fromDate(new Date(effective_from)) : null,
      expires_at: expires_at ? admin.firestore.Timestamp.fromDate(new Date(expires_at)) : null,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await admin.firestore().collection('knowledge_docs').add(doc);
    // Сохраним сырой контент (простая модель MVP)
    await admin.firestore().collection('knowledge_docs').doc(ref.id).collection('raw').doc('content').set({ content });
    await logApiRequest(req.apiKeyId, req.userId, '/knowledge', 'POST', 200, Date.now() - req.startTime, req.ip, req.get('User-Agent'));
    res.json({ data: { id: ref.id, ...doc } });
  } catch (e) {
    console.error('knowledge:create error', e);
    res.status(500).json({ error: 'Failed to create knowledge doc' });
  }
});

// PATCH /v1/knowledge/:id - обновить метаданные/контент
router.patch('/:id', async (req, res) => {
  const { userRole, userId, tenantId } = req;
  const { id } = req.params;
  const { title, type, locale, tags, visibility, content, status, effective_from, expires_at } = req.body || {};
  try {
    const ref = admin.firestore().collection('knowledge_docs').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Document not found' });
    const data = snap.data();
    if (data.tenantId !== tenantId) return res.status(403).json({ error: 'Access denied' });
    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (title) updates.title = title;
    if (type) updates.type = type;
    if (locale) updates.locale = locale;
    if (Array.isArray(tags)) updates.tags = tags;
    if (visibility) updates.visibility = visibility;
    if (typeof status === 'string') updates.status = status;
    if (effective_from !== undefined) updates.effective_from = effective_from ? admin.firestore.Timestamp.fromDate(new Date(effective_from)) : null;
    if (expires_at !== undefined) updates.expires_at = expires_at ? admin.firestore.Timestamp.fromDate(new Date(expires_at)) : null;
    await ref.update(updates);
    if (typeof content === 'string') {
      await ref.collection('raw').doc('content').set({ content });
    }
    await logApiRequest(req.apiKeyId, req.userId, `/knowledge/${id}`, 'PATCH', 200, Date.now() - req.startTime, req.ip, req.get('User-Agent'));
    res.json({ success: true });
  } catch (e) {
    console.error('knowledge:update error', e);
    res.status(500).json({ error: 'Failed to update knowledge doc' });
  }
});

// DELETE /v1/knowledge/:id - деактивировать (soft delete)
router.delete('/:id', async (req, res) => {
  const { userRole, userId, tenantId } = req;
  const { id } = req.params;
  try {
    const ref = admin.firestore().collection('knowledge_docs').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Document not found' });
    const data = snap.data();
    if (data.tenantId !== tenantId) return res.status(403).json({ error: 'Access denied' });
    await ref.update({ status: 'archived', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    await logApiRequest(req.apiKeyId, req.userId, `/knowledge/${id}`, 'DELETE', 200, Date.now() - req.startTime, req.ip, req.get('User-Agent'));
    res.json({ success: true });
  } catch (e) {
    console.error('knowledge:delete error', e);
    res.status(500).json({ error: 'Failed to delete knowledge doc' });
  }
});

module.exports = router;

// UI-triggered RAG indexing endpoint (admin only)
router.post('/index', async (req, res) => {
  const { userRole } = req;
  if (userRole !== 'admin') return res.status(403).json({ error: 'Only admin can run indexing' });
  const { batchSize = 100, startAfter = null } = req.body || {};
  try {
    const url = process.env.KB_INDEX_HTTP_URL || process.env.KB_INDEX_HTTP_URL_OVERRIDE || 'https://indexknowledgeembeddingshttp-nsnqs3w4aq-uc.a.run.app';
    const secret = process.env.INDEX_SECRET || 'super-index-secret';
    const resp = await fetch(`${url}?batchSize=${encodeURIComponent(batchSize)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-index-secret': secret },
      body: JSON.stringify(startAfter ? { startAfter } : {})
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) return res.status(resp.status).json(json);
    res.json(json);
  } catch (e) {
    console.error('knowledge:index-http error', e);
    res.status(500).json({ error: e.message || 'Indexing failed' });
  }
});


