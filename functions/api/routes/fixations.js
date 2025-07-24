const express = require('express');
const admin = require('firebase-admin');
const { authenticateApiKey, checkUserAccess, securityChecks, logApiRequest } = require('../middleware/auth');

const router = express.Router();

// Применяем middleware ко всем маршрутам
router.use(authenticateApiKey);
router.use(checkUserAccess);
router.use(securityChecks);

// GET /v1/fixations - Получение списка фиксаций
router.get('/', async (req, res) => {
  const { userRole, userId } = req;
  
  try {
    let fixationsQuery;
    
    if (userRole === 'admin') {
      // Админ видит все фиксации
      fixationsQuery = admin.firestore()
        .collection('clientFixations')
        .orderBy('dateTime', 'desc');
    } 
    else if (userRole === 'agent' || userRole === 'premium agent') {
      // Агенты видят только свои фиксации
      fixationsQuery = admin.firestore()
        .collection('clientFixations')
        .where('agentId', '==', userId)
        .orderBy('dateTime', 'desc');
    }
    else if (userRole === 'застройщик' || userRole === 'премиум застройщик') {
      // Застройщики видят фиксации своих объектов
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const developerId = userDoc.data()?.developerId;
      
      if (!developerId) {
        return res.status(403).json({ error: 'Developer ID not found' });
      }
      
      fixationsQuery = admin.firestore()
        .collection('clientFixations')
        .where('developerId', '==', developerId)
        .orderBy('dateTime', 'desc');
    }
    else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Применяем фильтры из запроса
    const { status, startDate, endDate, limit = 20, page = 1 } = req.query;
    
    if (status) {
      fixationsQuery = fixationsQuery.where('status', '==', status);
    }
    
    if (startDate) {
      fixationsQuery = fixationsQuery.where('dateTime', '>=', new Date(startDate));
    }
    
    if (endDate) {
      fixationsQuery = fixationsQuery.where('dateTime', '<=', new Date(endDate));
    }
    
    // Выполняем запрос с пагинацией
    const snapshot = await fixationsQuery
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit))
      .get();
    
    const fixations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        agentName: data.agentName,
        agentId: data.agentId,
        complexName: data.complexName,
        developerName: data.developerName,
        developerId: data.developerId,
        propertyType: data.propertyType,
        status: data.status,
        dateTime: data.dateTime ? data.dateTime.toDate().toISOString() : null,
        validUntil: data.validUntil ? data.validUntil.toDate().toISOString() : null,
        rejectComment: data.rejectComment,
        rejectedAt: data.rejectedAt ? data.rejectedAt.toDate().toISOString() : null,
        rejectedBy: data.rejectedBy,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
      };
    });
    
    // Получаем общее количество для пагинации
    const totalSnapshot = await fixationsQuery.get();
    const total = totalSnapshot.size;
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      '/fixations', 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      data: fixations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching fixations:', error);
    res.status(500).json({ error: 'Failed to fetch fixations' });
  }
});

// GET /v1/fixations/:id - Получение конкретной фиксации
router.get('/:id', async (req, res) => {
  const { userRole, userId } = req;
  const { id } = req.params;
  
  try {
    const fixationDoc = await admin.firestore()
      .collection('clientFixations')
      .doc(id)
      .get();
    
    if (!fixationDoc.exists) {
      return res.status(404).json({ error: 'Fixation not found' });
    }
    
    const fixationData = fixationDoc.data();
    
    // Проверяем права доступа к конкретной фиксации
    let hasAccess = false;
    
    if (userRole === 'admin') {
      hasAccess = true;
    } else if (userRole === 'agent' || userRole === 'premium agent') {
      hasAccess = fixationData.agentId === userId;
    } else if (userRole === 'застройщик' || userRole === 'премиум застройщик') {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const developerId = userDoc.data()?.developerId;
      hasAccess = fixationData.developerId === developerId;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this fixation' });
    }
    
    const fixation = {
      id: fixationDoc.id,
      clientName: fixationData.clientName,
      clientPhone: fixationData.clientPhone,
      agentName: fixationData.agentName,
      agentId: fixationData.agentId,
      complexName: fixationData.complexName,
      developerName: fixationData.developerName,
      developerId: fixationData.developerId,
      propertyType: fixationData.propertyType,
      status: fixationData.status,
      dateTime: fixationData.dateTime ? fixationData.dateTime.toDate().toISOString() : null,
      validUntil: fixationData.validUntil ? fixationData.validUntil.toDate().toISOString() : null,
      rejectComment: fixationData.rejectComment,
      rejectedAt: fixationData.rejectedAt ? fixationData.rejectedAt.toDate().toISOString() : null,
      rejectedBy: fixationData.rejectedBy,
      createdAt: fixationData.createdAt ? fixationData.createdAt.toDate().toISOString() : null,
      updatedAt: fixationData.updatedAt ? fixationData.updatedAt.toDate().toISOString() : null
    };
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      `/fixations/${id}`, 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ data: fixation });
    
  } catch (error) {
    console.error('Error fetching fixation:', error);
    res.status(500).json({ error: 'Failed to fetch fixation' });
  }
});

// GET /v1/fixations/stats - Получение статистики фиксаций
router.get('/stats', async (req, res) => {
  const { userRole, userId } = req;
  
  try {
    let fixationsQuery;
    
    if (userRole === 'admin') {
      fixationsQuery = admin.firestore().collection('clientFixations');
    } 
    else if (userRole === 'agent' || userRole === 'premium agent') {
      fixationsQuery = admin.firestore()
        .collection('clientFixations')
        .where('agentId', '==', userId);
    }
    else if (userRole === 'застройщик' || userRole === 'премиум застройщик') {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const developerId = userDoc.data()?.developerId;
      
      if (!developerId) {
        return res.status(403).json({ error: 'Developer ID not found' });
      }
      
      fixationsQuery = admin.firestore()
        .collection('clientFixations')
        .where('developerId', '==', developerId);
    }
    else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const snapshot = await fixationsQuery.get();
    
    const stats = {
      total: snapshot.size,
      byStatus: {},
      byMonth: {},
      byComplex: {}
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Статистика по статусам
      const status = data.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      
      // Статистика по месяцам
      if (data.dateTime) {
        const month = data.dateTime.toDate().toISOString().substring(0, 7); // YYYY-MM
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
      }
      
      // Статистика по комплексам
      const complex = data.complexName || 'unknown';
      stats.byComplex[complex] = (stats.byComplex[complex] || 0) + 1;
    });
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      '/fixations/stats', 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ data: stats });
    
  } catch (error) {
    console.error('Error fetching fixation stats:', error);
    res.status(500).json({ error: 'Failed to fetch fixation stats' });
  }
});

module.exports = router; 