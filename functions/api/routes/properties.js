const express = require('express');
const admin = require('firebase-admin');
const { authenticateApiKey, checkUserAccess, securityChecks, logApiRequest } = require('../middleware/auth');

const router = express.Router();

// Применяем middleware ко всем маршрутам
router.use(authenticateApiKey);
router.use(checkUserAccess);
router.use(securityChecks);

// GET /v1/properties - Получение списка объектов
router.get('/', async (req, res) => {
  const { userRole, userId } = req;
  
  try {
    let propertiesQuery;
    
    if (userRole === 'admin') {
      // Админ видит все объекты
      propertiesQuery = admin.firestore()
        .collection('properties')
        .orderBy('createdAt', 'desc');
    } 
    else if (userRole === 'agent' || userRole === 'premium agent') {
      // Агенты видят объекты, которые они добавили
      propertiesQuery = admin.firestore()
        .collection('properties')
        .where('agentId', '==', userId)
        .orderBy('createdAt', 'desc');
    }
    else if (userRole === 'застройщик' || userRole === 'премиум застройщик') {
      // Застройщики видят объекты своих комплексов
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const developerId = userDoc.data()?.developerId;
      
      if (!developerId) {
        return res.status(403).json({ error: 'Developer ID not found' });
      }
      
      propertiesQuery = admin.firestore()
        .collection('properties')
        .where('developerId', '==', developerId)
        .orderBy('createdAt', 'desc');
    }
    else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Применяем фильтры из запроса
    const { complexId, propertyType, priceMin, priceMax, limit = 20, page = 1 } = req.query;
    
    if (complexId) {
      propertiesQuery = propertiesQuery.where('complexId', '==', complexId);
    }
    
    if (propertyType) {
      propertiesQuery = propertiesQuery.where('propertyType', '==', propertyType);
    }
    
    if (priceMin) {
      propertiesQuery = propertiesQuery.where('price', '>=', parseInt(priceMin));
    }
    
    if (priceMax) {
      propertiesQuery = propertiesQuery.where('price', '<=', parseInt(priceMax));
    }
    
    // Выполняем запрос с пагинацией
    const snapshot = await propertiesQuery
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit))
      .get();
    
    const properties = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        price: data.price,
        propertyType: data.propertyType,
        complexId: data.complexId,
        complexName: data.complexName,
        developerId: data.developerId,
        developerName: data.developerName,
        agentId: data.agentId,
        agentName: data.agentName,
        images: data.images || [],
        features: data.features || [],
        location: data.location,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
      };
    });
    
    // Получаем общее количество для пагинации
    const totalSnapshot = await propertiesQuery.get();
    const total = totalSnapshot.size;
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      '/properties', 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      data: properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// GET /v1/properties/:id - Получение конкретного объекта
router.get('/:id', async (req, res) => {
  const { userRole, userId } = req;
  const { id } = req.params;
  
  try {
    const propertyDoc = await admin.firestore()
      .collection('properties')
      .doc(id)
      .get();
    
    if (!propertyDoc.exists) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    const propertyData = propertyDoc.data();
    
    // Проверяем права доступа к конкретному объекту
    let hasAccess = false;
    
    if (userRole === 'admin') {
      hasAccess = true;
    } else if (userRole === 'agent' || userRole === 'premium agent') {
      hasAccess = propertyData.agentId === userId;
    } else if (userRole === 'застройщик' || userRole === 'премиум застройщик') {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const developerId = userDoc.data()?.developerId;
      hasAccess = propertyData.developerId === developerId;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this property' });
    }
    
    const property = {
      id: propertyDoc.id,
      title: propertyData.title,
      description: propertyData.description,
      price: propertyData.price,
      propertyType: propertyData.propertyType,
      complexId: propertyData.complexId,
      complexName: propertyData.complexName,
      developerId: propertyData.developerId,
      developerName: propertyData.developerName,
      agentId: propertyData.agentId,
      agentName: propertyData.agentName,
      images: propertyData.images || [],
      features: propertyData.features || [],
      location: propertyData.location,
      createdAt: propertyData.createdAt ? propertyData.createdAt.toDate().toISOString() : null,
      updatedAt: propertyData.updatedAt ? propertyData.updatedAt.toDate().toISOString() : null
    };
    
    // Логируем запрос
    await logApiRequest(
      req.apiKeyId, 
      req.userId, 
      `/properties/${id}`, 
      'GET', 
      200, 
      Date.now() - req.startTime,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ data: property });
    
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

module.exports = router; 