const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { authenticateApiKey, checkUserAccess, securityChecks, logApiRequest } = require('../middleware/auth');

const router = express.Router();

// Применяем middleware ко всем маршрутам
router.use(authenticateApiKey);
router.use(checkUserAccess);
router.use(securityChecks);

// GET /v1/webhooks - Получение списка webhook подписок
router.get('/', async (req, res) => {
  const { userId } = req;
  
  try {
    const webhooksSnapshot = await admin.firestore()
      .collection('webhookSubscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();
    
    const webhooks = webhooksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        url: data.url,
        events: data.events,
        isActive: data.isActive,
        lastDelivery: data.lastDelivery ? data.lastDelivery.toDate().toISOString() : null,
        failureCount: data.failureCount || 0,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null
      };
    });
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      '/webhooks', 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ data: webhooks });
    
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// POST /v1/webhooks - Создание новой webhook подписки
router.post('/', async (req, res) => {
  const { userId } = req;
  const { url, events } = req.body;
  
  // Валидация
  if (!url || !events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'URL and events array are required' });
  }
  
  // Проверяем URL
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
  
  // Проверяем поддерживаемые события
  const supportedEvents = [
    'fixation.created',
    'fixation.updated',
    'fixation.status_changed',
    'fixation.expired',
    'fixation.rejected'
  ];
  
  const invalidEvents = events.filter(event => !supportedEvents.includes(event));
  if (invalidEvents.length > 0) {
    return res.status(400).json({ 
      error: 'Invalid events', 
      invalidEvents,
      supportedEvents 
    });
  }
  
  try {
    // Генерируем секрет для подписи webhook
    const secret = crypto.randomBytes(32).toString('hex');
    
    const webhookData = {
      userId: userId,
      url: url,
      events: events,
      isActive: true,
      secret: secret,
      lastDelivery: null,
      failureCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await admin.firestore()
      .collection('webhookSubscriptions')
      .add(webhookData);
    
    const webhook = {
      id: docRef.id,
      url: webhookData.url,
      events: webhookData.events,
      isActive: webhookData.isActive,
      secret: webhookData.secret, // Возвращаем секрет только при создании
      createdAt: new Date().toISOString()
    };
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      '/webhooks', 
      'POST', 
      201, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.status(201).json({ data: webhook });
    
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// GET /v1/webhooks/:id - Получение конкретной webhook подписки
router.get('/:id', async (req, res) => {
  const { userId } = req;
  const { id } = req.params;
  
  try {
    const webhookDoc = await admin.firestore()
      .collection('webhookSubscriptions')
      .doc(id)
      .get();
    
    if (!webhookDoc.exists) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const webhookData = webhookDoc.data();
    
    // Проверяем, что webhook принадлежит пользователю
    if (webhookData.userId !== userId) {
      return res.status(403).json({ error: 'Access denied to this webhook' });
    }
    
    const webhook = {
      id: webhookDoc.id,
      url: webhookData.url,
      events: webhookData.events,
      isActive: webhookData.isActive,
      lastDelivery: webhookData.lastDelivery ? webhookData.lastDelivery.toDate().toISOString() : null,
      failureCount: webhookData.failureCount || 0,
      createdAt: webhookData.createdAt ? webhookData.createdAt.toDate().toISOString() : null
    };
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      `/webhooks/${id}`, 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ data: webhook });
    
  } catch (error) {
    console.error('Error fetching webhook:', error);
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

// PUT /v1/webhooks/:id - Обновление webhook подписки
router.put('/:id', async (req, res) => {
  const { userId } = req;
  const { id } = req.params;
  const { url, events, isActive } = req.body;
  
  try {
    const webhookDoc = await admin.firestore()
      .collection('webhookSubscriptions')
      .doc(id)
      .get();
    
    if (!webhookDoc.exists) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const webhookData = webhookDoc.data();
    
    // Проверяем, что webhook принадлежит пользователю
    if (webhookData.userId !== userId) {
      return res.status(403).json({ error: 'Access denied to this webhook' });
    }
    
    const updateData = {};
    
    if (url !== undefined) {
      try {
        new URL(url);
        updateData.url = url;
      } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    }
    
    if (events !== undefined) {
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: 'Events must be an array' });
      }
      
      const supportedEvents = [
        'fixation.created',
        'fixation.updated',
        'fixation.status_changed',
        'fixation.expired',
        'fixation.rejected'
      ];
      
      const invalidEvents = events.filter(event => !supportedEvents.includes(event));
      if (invalidEvents.length > 0) {
        return res.status(400).json({ 
          error: 'Invalid events', 
          invalidEvents,
          supportedEvents 
        });
      }
      
      updateData.events = events;
    }
    
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await admin.firestore()
      .collection('webhookSubscriptions')
      .doc(id)
      .update(updateData);
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      `/webhooks/${id}`, 
      'PUT', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ data: { id, ...updateData } });
    
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// DELETE /v1/webhooks/:id - Удаление webhook подписки
router.delete('/:id', async (req, res) => {
  const { userId } = req;
  const { id } = req.params;
  
  try {
    const webhookDoc = await admin.firestore()
      .collection('webhookSubscriptions')
      .doc(id)
      .get();
    
    if (!webhookDoc.exists) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const webhookData = webhookDoc.data();
    
    // Проверяем, что webhook принадлежит пользователю
    if (webhookData.userId !== userId) {
      return res.status(403).json({ error: 'Access denied to this webhook' });
    }
    
    await admin.firestore()
      .collection('webhookSubscriptions')
      .doc(id)
      .delete();
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      `/webhooks/${id}`, 
      'DELETE', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ message: 'Webhook deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// POST /v1/webhooks/:id/test - Тестирование webhook
router.post('/:id/test', async (req, res) => {
  const { userId } = req;
  const { id } = req.params;
  
  try {
    const webhookDoc = await admin.firestore()
      .collection('webhookSubscriptions')
      .doc(id)
      .get();
    
    if (!webhookDoc.exists) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const webhookData = webhookDoc.data();
    
    // Проверяем, что webhook принадлежит пользователю
    if (webhookData.userId !== userId) {
      return res.status(403).json({ error: 'Access denied to this webhook' });
    }
    
    // Отправляем тестовый webhook
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from IT Agent API',
        webhookId: id
      }
    };
    
    const signature = crypto
      .createHmac('sha256', webhookData.secret)
      .update(JSON.stringify(testPayload))
      .digest('hex');
    
    const response = await fetch(webhookData.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'User-Agent': 'IT-Agent-API/1.0'
      },
      body: JSON.stringify(testPayload)
    });
    
    const success = response.ok;
    
    // Обновляем статистику
    await admin.firestore()
      .collection('webhookSubscriptions')
      .doc(id)
      .update({
        lastDelivery: admin.firestore.FieldValue.serverTimestamp(),
        failureCount: success ? 0 : (webhookData.failureCount || 0) + 1
      });
    
    // Логируем webhook доставку
    await admin.firestore().collection('webhookLogs').add({
      subscriptionId: id,
      event: 'webhook.test',
      url: webhookData.url,
      statusCode: response.status,
      success: success,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      `/webhooks/${id}/test`, 
      'POST', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ 
      data: { 
        success, 
        statusCode: response.status,
        message: success ? 'Test webhook sent successfully' : 'Test webhook failed'
      } 
    });
    
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

module.exports = router; 