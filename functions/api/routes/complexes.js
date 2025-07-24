const express = require('express');
const admin = require('firebase-admin');
const { authenticateApiKey, checkUserAccess, securityChecks, logApiRequest } = require('../middleware/auth');

const router = express.Router();

// Применяем middleware ко всем маршрутам
router.use(authenticateApiKey);
router.use(checkUserAccess);
router.use(securityChecks);

// GET /v1/complexes - Получение списка комплексов
router.get('/', async (req, res) => {
  const { userRole, userId } = req;
  
  try {
    let complexesQuery;
    
    if (userRole === 'admin') {
      // Админ видит все комплексы
      complexesQuery = admin.firestore()
        .collection('complexes')
        .orderBy('createdAt', 'desc');
    } 
    else if (userRole === 'agent' || userRole === 'premium agent') {
      // Агенты видят все комплексы (для выбора при добавлении объектов)
      complexesQuery = admin.firestore()
        .collection('complexes')
        .orderBy('createdAt', 'desc');
    }
    else if (userRole === 'застройщик' || userRole === 'премиум застройщик') {
      // Застройщики видят только свои комплексы
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const developerId = userDoc.data()?.developerId;
      
      if (!developerId) {
        return res.status(403).json({ error: 'Developer ID not found' });
      }
      
      complexesQuery = admin.firestore()
        .collection('complexes')
        .where('developerId', '==', developerId)
        .orderBy('createdAt', 'desc');
    }
    else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Применяем фильтры из запроса
    const { developerId, limit = 20, page = 1 } = req.query;
    
    if (developerId && userRole === 'admin') {
      complexesQuery = complexesQuery.where('developerId', '==', developerId);
    }
    
    // Выполняем запрос с пагинацией
    const snapshot = await complexesQuery
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit))
      .get();
    
    const complexes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        developerId: data.developerId,
        developerName: data.developerName,
        location: data.location,
        images: data.images || [],
        features: data.features || [],
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
      };
    });
    
    // Получаем общее количество для пагинации
    const totalSnapshot = await complexesQuery.get();
    const total = totalSnapshot.size;
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      '/complexes', 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      data: complexes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching complexes:', error);
    res.status(500).json({ error: 'Failed to fetch complexes' });
  }
});

// GET /v1/complexes/:id - Получение конкретного комплекса
router.get('/:id', async (req, res) => {
  const { userRole, userId } = req;
  const { id } = req.params;
  
  try {
    const complexDoc = await admin.firestore()
      .collection('complexes')
      .doc(id)
      .get();
    
    if (!complexDoc.exists) {
      return res.status(404).json({ error: 'Complex not found' });
    }
    
    const complexData = complexDoc.data();
    
    // Проверяем права доступа к конкретному комплексу
    let hasAccess = false;
    
    if (userRole === 'admin') {
      hasAccess = true;
    } else if (userRole === 'agent' || userRole === 'premium agent') {
      hasAccess = true; // Агенты могут видеть все комплексы
    } else if (userRole === 'застройщик' || userRole === 'премиум застройщик') {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const developerId = userDoc.data()?.developerId;
      hasAccess = complexData.developerId === developerId;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this complex' });
    }
    
    const complex = {
      id: complexDoc.id,
      name: complexData.name,
      description: complexData.description,
      developerId: complexData.developerId,
      developerName: complexData.developerName,
      location: complexData.location,
      images: complexData.images || [],
      features: complexData.features || [],
      createdAt: complexData.createdAt ? complexData.createdAt.toDate().toISOString() : null,
      updatedAt: complexData.updatedAt ? complexData.updatedAt.toDate().toISOString() : null
    };
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      `/complexes/${id}`, 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ data: complex });
    
  } catch (error) {
    console.error('Error fetching complex:', error);
    res.status(500).json({ error: 'Failed to fetch complex' });
  }
});

module.exports = router; 