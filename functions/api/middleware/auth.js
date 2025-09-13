const admin = require('firebase-admin');

const authenticateApiKey = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const apiKey = req.headers['x-api-key'];

  try {
    // 1) Приоритет: Firebase ID Token (Bearer)
    if (bearer && bearer.split('.').length === 3) {
      try {
        const decoded = await admin.auth().verifyIdToken(bearer);
        const uid = decoded.uid;
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) return res.status(401).json({ error: 'User not found' });
        const userData = userDoc.data();
        if (userData.role === 'closed') return res.status(403).json({ error: 'Account is blocked' });
        req.user = userData;
        req.userId = uid;
        req.userRole = userData.role;
        // Без apiKeyId (пропускаем лимиты ниже)
        return next();
      } catch (e) {
        // Падать не будем — попробуем API key ниже
        console.warn('Bearer verification failed, fallback to apiKey');
      }
    }

    // 2) Fallback: x-api-key
    if (!apiKey) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const apiKeyDoc = await admin.firestore()
      .collection('apiKeys')
      .where('key', '==', apiKey)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (apiKeyDoc.empty) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const keyData = apiKeyDoc.docs[0].data();
    if (keyData.expiresAt && new Date() > keyData.expiresAt.toDate()) {
      return res.status(401).json({ error: 'API key expired' });
    }

    req.apiKey = keyData;
    req.apiKeyId = apiKeyDoc.docs[0].id;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

const checkUserAccess = async (req, res, next) => {
  const { apiKey, apiKeyId } = req;
  
  try {
    // Если пользователь уже установлен (Bearer), пропускаем загрузку по apiKey
    if (!req.user) {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(apiKey.userId)
        .get();
      if (!userDoc.exists()) return res.status(401).json({ error: 'User not found' });
      const userData = userDoc.data();
      if (userData.role === 'closed') return res.status(403).json({ error: 'Account is blocked' });
      req.user = userData;
      req.userRole = userData.role;
      req.userId = apiKey.userId;
    }
    
    // Устанавливаем tenantId
    const role = req.userRole;
    let tenantId = req.user?.tenantId || null;
    if (!tenantId) {
      if (role === 'admin') tenantId = 'admin';
      else if (['premium agent', 'премиум застройщик'].includes(role)) tenantId = req.userId;
      else tenantId = req.userId;
    }
    req.tenantId = tenantId;

    // Проверяем права доступа к запрашиваемому ресурсу
    const hasAccess = await checkResourceAccess(req.userRole, req.userId, req.path, req.method);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  } catch (error) {
    console.error('Access control error:', error);
    return res.status(500).json({ error: 'Access control failed' });
  }
};

const checkResourceAccess = async (userRole, userId, path, method) => {
  // Админ имеет доступ ко всему
  if (userRole === 'admin') {
    return true;
  }
  
  // Проверяем доступ к фиксациям
  if (path.startsWith('/fixations') || path.includes('/fixations')) {
    if (['agent', 'premium agent', 'застройщик', 'премиум застройщик'].includes(userRole)) {
      return true; // Дополнительная фильтрация будет в запросе
    }
  }
  
  // Проверяем доступ к объектам
  if (path.startsWith('/properties') || path.includes('/properties')) {
    if (['agent', 'premium agent', 'застройщик', 'премиум застройщик'].includes(userRole)) {
      return true;
    }
  }
  
  // Проверяем доступ к комплексам
  if (path.startsWith('/complexes') || path.includes('/complexes')) {
    if (['agent', 'premium agent', 'застройщик', 'премиум застройщик'].includes(userRole)) {
      return true;
    }
  }
  
  // Проверяем доступ к webhook
  if (path.startsWith('/webhooks') || path.includes('/webhooks')) {
    if (['agent', 'premium agent', 'застройщик', 'премиум застройщик'].includes(userRole)) {
      return true;
    }
  }
  
  return false;
};

const securityChecks = async (req, res, next) => {
  const { apiKey, userRole } = req;
  
  // Для Bearer‑аутентификации (без apiKeyId) не применяем лимиты
  if (req.apiKeyId) {
    const usageCount = apiKey.usageCount || 0;
    const maxUsage = getMaxUsageByRole(userRole);
    if (usageCount >= maxUsage) {
      return res.status(429).json({ error: 'Usage limit exceeded' });
    }
    try {
      await admin.firestore()
        .collection('apiKeys')
        .doc(req.apiKeyId)
        .update({
          usageCount: usageCount + 1,
          lastUsed: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      console.error('Error updating usage count:', error);
    }
  }
  
  next();
};

const getMaxUsageByRole = (role) => {
  const limits = {
    'admin': 10000,
    'premium agent': 5000,
    'премиум застройщик': 5000,
    'agent': 1000,
    'застройщик': 1000,
    'default': 100
  };
  
  return limits[role] || limits.default;
};

const logApiRequest = async (apiKeyId, userId, endpoint, method, statusCode, responseTime, ipAddress, userAgent) => {
  try {
    await admin.firestore().collection('apiLogs').add({
      apiKeyId,
      userId,
      endpoint,
      method,
      statusCode,
      responseTime,
      ipAddress,
      userAgent,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging API request:', error);
  }
};

module.exports = {
  authenticateApiKey,
  checkUserAccess,
  securityChecks,
  logApiRequest
}; 