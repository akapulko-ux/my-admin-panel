const admin = require('firebase-admin');
const crypto = require('crypto');

// Функция для отправки webhook уведомлений
const sendWebhook = async (event, data) => {
  try {
    console.log(`🔔 Отправка webhook для события: ${event}`);
    
    // Получаем все активные webhook подписки для этого события
    const subscriptionsSnapshot = await admin.firestore()
      .collection('webhookSubscriptions')
      .where('events', 'array-contains', event)
      .where('isActive', '==', true)
      .get();
    
    console.log(`📡 Найдено ${subscriptionsSnapshot.size} активных webhook подписок`);
    
    const deliveryPromises = [];
    
    for (const subscription of subscriptionsSnapshot.docs) {
      const subData = subscription.data();
      
      deliveryPromises.push(
        deliverWebhook(subscription.id, subData, event, data)
      );
    }
    
    // Выполняем все доставки параллельно
    const results = await Promise.allSettled(deliveryPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    
    console.log(`✅ Webhook доставка завершена: ${successful} успешно, ${failed} неудачно`);
    
    return { successful, failed, total: results.length };
    
  } catch (error) {
    console.error('❌ Ошибка при отправке webhook:', error);
    throw error;
  }
};

// Функция для доставки конкретного webhook
const deliverWebhook = async (subscriptionId, subscriptionData, event, data) => {
  try {
    const payload = {
      event: event,
      timestamp: new Date().toISOString(),
      data: data
    };
    
    // Подписываем payload
    const signature = crypto
      .createHmac('sha256', subscriptionData.secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    console.log(`📤 Отправка webhook на ${subscriptionData.url}`);
    
    const response = await fetch(subscriptionData.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'User-Agent': 'IT-Agent-API/1.0'
      },
      body: JSON.stringify(payload),
      timeout: 10000 // 10 секунд таймаут
    });
    
    const success = response.ok;
    const statusCode = response.status;
    
    console.log(`📥 Ответ от webhook: ${statusCode} ${success ? '✅' : '❌'}`);
    
    // Обновляем статистику webhook
    await admin.firestore()
      .collection('webhookSubscriptions')
      .doc(subscriptionId)
      .update({
        lastDelivery: admin.firestore.FieldValue.serverTimestamp(),
        failureCount: success ? 0 : (subscriptionData.failureCount || 0) + 1
      });
    
    // Логируем webhook доставку
    await admin.firestore().collection('webhookLogs').add({
      subscriptionId: subscriptionId,
      event: event,
      url: subscriptionData.url,
      statusCode: statusCode,
      success: success,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      payload: payload
    });
    
    return { success, statusCode, subscriptionId };
    
  } catch (error) {
    console.error(`❌ Ошибка доставки webhook ${subscriptionId}:`, error);
    
    // Обновляем счетчик ошибок
    await admin.firestore()
      .collection('webhookSubscriptions')
      .doc(subscriptionId)
      .update({
        failureCount: (subscriptionData.failureCount || 0) + 1
      });
    
    // Логируем ошибку
    await admin.firestore().collection('webhookLogs').add({
      subscriptionId: subscriptionId,
      event: event,
      url: subscriptionData.url,
      statusCode: 0,
      success: false,
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: false, error: error.message, subscriptionId };
  }
};

// Функция для отправки webhook при создании фиксации
const sendFixationCreatedWebhook = async (fixationData) => {
  const webhookData = {
    fixationId: fixationData.id,
    clientName: fixationData.clientName,
    clientPhone: fixationData.clientPhone,
    agentName: fixationData.agentName,
    complexName: fixationData.complexName,
    developerName: fixationData.developerName,
    propertyType: fixationData.propertyType,
    status: fixationData.status,
    dateTime: fixationData.dateTime ? fixationData.dateTime.toDate().toISOString() : null
  };
  
  return await sendWebhook('fixation.created', webhookData);
};

// Функция для отправки webhook при обновлении фиксации
const sendFixationUpdatedWebhook = async (fixationData, previousData) => {
  const webhookData = {
    fixationId: fixationData.id,
    clientName: fixationData.clientName,
    clientPhone: fixationData.clientPhone,
    agentName: fixationData.agentName,
    complexName: fixationData.complexName,
    developerName: fixationData.developerName,
    propertyType: fixationData.propertyType,
    status: fixationData.status,
    previousStatus: previousData.status,
    dateTime: fixationData.dateTime ? fixationData.dateTime.toDate().toISOString() : null,
    validUntil: fixationData.validUntil ? fixationData.validUntil.toDate().toISOString() : null,
    rejectComment: fixationData.rejectComment,
    rejectedAt: fixationData.rejectedAt ? fixationData.rejectedAt.toDate().toISOString() : null,
    rejectedBy: fixationData.rejectedBy
  };
  
  return await sendWebhook('fixation.updated', webhookData);
};

// Функция для отправки webhook при изменении статуса фиксации
const sendFixationStatusChangedWebhook = async (fixationData, previousStatus) => {
  const webhookData = {
    fixationId: fixationData.id,
    clientName: fixationData.clientName,
    clientPhone: fixationData.clientPhone,
    agentName: fixationData.agentName,
    complexName: fixationData.complexName,
    developerName: fixationData.developerName,
    propertyType: fixationData.propertyType,
    status: fixationData.status,
    previousStatus: previousStatus,
    dateTime: fixationData.dateTime ? fixationData.dateTime.toDate().toISOString() : null,
    validUntil: fixationData.validUntil ? fixationData.validUntil.toDate().toISOString() : null,
    rejectComment: fixationData.rejectComment,
    rejectedAt: fixationData.rejectedAt ? fixationData.rejectedAt.toDate().toISOString() : null,
    rejectedBy: fixationData.rejectedBy
  };
  
  return await sendWebhook('fixation.status_changed', webhookData);
};

// Функция для отправки webhook при истечении срока фиксации
const sendFixationExpiredWebhook = async (fixationData) => {
  const webhookData = {
    fixationId: fixationData.id,
    clientName: fixationData.clientName,
    clientPhone: fixationData.clientPhone,
    agentName: fixationData.agentName,
    complexName: fixationData.complexName,
    developerName: fixationData.developerName,
    propertyType: fixationData.propertyType,
    status: fixationData.status,
    dateTime: fixationData.dateTime ? fixationData.dateTime.toDate().toISOString() : null,
    validUntil: fixationData.validUntil ? fixationData.validUntil.toDate().toISOString() : null
  };
  
  return await sendWebhook('fixation.expired', webhookData);
};

// Функция для отправки webhook при отклонении фиксации
const sendFixationRejectedWebhook = async (fixationData) => {
  const webhookData = {
    fixationId: fixationData.id,
    clientName: fixationData.clientName,
    clientPhone: fixationData.clientPhone,
    agentName: fixationData.agentName,
    complexName: fixationData.complexName,
    developerName: fixationData.developerName,
    propertyType: fixationData.propertyType,
    status: fixationData.status,
    dateTime: fixationData.dateTime ? fixationData.dateTime.toDate().toISOString() : null,
    rejectComment: fixationData.rejectComment,
    rejectedAt: fixationData.rejectedAt ? fixationData.rejectedAt.toDate().toISOString() : null,
    rejectedBy: fixationData.rejectedBy
  };
  
  return await sendWebhook('fixation.rejected', webhookData);
};

module.exports = {
  sendWebhook,
  sendFixationCreatedWebhook,
  sendFixationUpdatedWebhook,
  sendFixationStatusChangedWebhook,
  sendFixationExpiredWebhook,
  sendFixationRejectedWebhook
}; 