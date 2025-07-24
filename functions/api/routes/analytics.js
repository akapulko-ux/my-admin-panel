const express = require('express');
const admin = require('firebase-admin');
const { authenticateApiKey, checkUserAccess, securityChecks, logApiRequest } = require('../middleware/auth');

const router = express.Router();

// Применяем middleware ко всем маршрутам
router.use(authenticateApiKey);
router.use(checkUserAccess);
router.use(securityChecks);

// GET /v1/analytics/usage - Получение статистики использования API
router.get('/usage', async (req, res) => {
  const { userId } = req;
  const { startDate, endDate } = req.query;
  
  try {
    let logsQuery = admin.firestore()
      .collection('apiLogs')
      .where('userId', '==', userId);
    
    // Применяем фильтры по дате
    if (startDate) {
      logsQuery = logsQuery.where('timestamp', '>=', new Date(startDate));
    }
    
    if (endDate) {
      logsQuery = logsQuery.where('timestamp', '<=', new Date(endDate));
    }
    
    const logsSnapshot = await logsQuery.get();
    
    const analytics = {
      totalRequests: logsSnapshot.size,
      requestsByEndpoint: {},
      requestsByMethod: {},
      requestsByStatus: {},
      requestsByDate: {},
      averageResponseTime: 0,
      successRate: 0
    };
    
    let totalResponseTime = 0;
    let successfulRequests = 0;
    
    logsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Статистика по эндпоинтам
      const endpoint = data.endpoint || 'unknown';
      analytics.requestsByEndpoint[endpoint] = (analytics.requestsByEndpoint[endpoint] || 0) + 1;
      
      // Статистика по методам
      const method = data.method || 'unknown';
      analytics.requestsByMethod[method] = (analytics.requestsByMethod[method] || 0) + 1;
      
      // Статистика по статусам
      const status = data.statusCode || 'unknown';
      analytics.requestsByStatus[status] = (analytics.requestsByStatus[status] || 0) + 1;
      
      // Статистика по датам
      if (data.timestamp) {
        const date = data.timestamp.toDate().toISOString().substring(0, 10); // YYYY-MM-DD
        analytics.requestsByDate[date] = (analytics.requestsByDate[date] || 0) + 1;
      }
      
      // Время ответа
      if (data.responseTime) {
        totalResponseTime += data.responseTime;
      }
      
      // Успешные запросы
      if (data.statusCode >= 200 && data.statusCode < 300) {
        successfulRequests++;
      }
    });
    
    // Вычисляем средние значения
    if (logsSnapshot.size > 0) {
      analytics.averageResponseTime = Math.round(totalResponseTime / logsSnapshot.size);
      analytics.successRate = Math.round((successfulRequests / logsSnapshot.size) * 100);
    }
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      '/analytics/usage', 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ data: analytics });
    
  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    res.status(500).json({ error: 'Failed to fetch usage analytics' });
  }
});

// GET /v1/analytics/api-keys - Получение статистики API ключей
router.get('/api-keys', async (req, res) => {
  const { userId } = req;
  
  try {
    const apiKeysSnapshot = await admin.firestore()
      .collection('apiKeys')
      .where('userId', '==', userId)
      .get();
    
    const apiKeysAnalytics = {
      totalKeys: apiKeysSnapshot.size,
      activeKeys: 0,
      inactiveKeys: 0,
      keysByUsage: {
        low: 0,    // 0-100 запросов
        medium: 0, // 101-1000 запросов
        high: 0    // 1000+ запросов
      },
      totalUsage: 0,
      averageUsage: 0
    };
    
    apiKeysSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.isActive) {
        apiKeysAnalytics.activeKeys++;
      } else {
        apiKeysAnalytics.inactiveKeys++;
      }
      
      const usage = data.usageCount || 0;
      apiKeysAnalytics.totalUsage += usage;
      
      if (usage <= 100) {
        apiKeysAnalytics.keysByUsage.low++;
      } else if (usage <= 1000) {
        apiKeysAnalytics.keysByUsage.medium++;
      } else {
        apiKeysAnalytics.keysByUsage.high++;
      }
    });
    
    if (apiKeysSnapshot.size > 0) {
      apiKeysAnalytics.averageUsage = Math.round(apiKeysAnalytics.totalUsage / apiKeysSnapshot.size);
    }
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      '/analytics/api-keys', 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ data: apiKeysAnalytics });
    
  } catch (error) {
    console.error('Error fetching API keys analytics:', error);
    res.status(500).json({ error: 'Failed to fetch API keys analytics' });
  }
});

// GET /v1/analytics/webhooks - Получение статистики webhook
router.get('/webhooks', async (req, res) => {
  const { userId } = req;
  
  try {
    const webhooksSnapshot = await admin.firestore()
      .collection('webhookSubscriptions')
      .where('userId', '==', userId)
      .get();
    
    const webhookAnalytics = {
      totalWebhooks: webhooksSnapshot.size,
      activeWebhooks: 0,
      inactiveWebhooks: 0,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageFailureRate: 0
    };
    
    for (const doc of webhooksSnapshot.docs) {
      const data = doc.data();
      
      if (data.isActive) {
        webhookAnalytics.activeWebhooks++;
      } else {
        webhookAnalytics.inactiveWebhooks++;
      }
      
      // Получаем логи доставки для этого webhook
      const logsSnapshot = await admin.firestore()
        .collection('webhookLogs')
        .where('subscriptionId', '==', doc.id)
        .get();
      
      logsSnapshot.docs.forEach(logDoc => {
        const logData = logDoc.data();
        webhookAnalytics.totalDeliveries++;
        
        if (logData.success) {
          webhookAnalytics.successfulDeliveries++;
        } else {
          webhookAnalytics.failedDeliveries++;
        }
      });
    }
    
    if (webhookAnalytics.totalDeliveries > 0) {
      webhookAnalytics.averageFailureRate = Math.round(
        (webhookAnalytics.failedDeliveries / webhookAnalytics.totalDeliveries) * 100
      );
    }
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      '/analytics/webhooks', 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ data: webhookAnalytics });
    
  } catch (error) {
    console.error('Error fetching webhook analytics:', error);
    res.status(500).json({ error: 'Failed to fetch webhook analytics' });
  }
});

module.exports = router; 