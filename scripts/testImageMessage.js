const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Определяем путь к файлу ключа
const serviceAccountPath = path.join(__dirname, '../firebase-service-account-key.json');

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.log('Service account file not found, using default credentials');
    admin.initializeApp();
  }
}

async function addTestImageMessage() {
  try {
    const db = admin.firestore();
    
    console.log('🧪 Добавление тестового сообщения с изображением в чат фиксации...\n');
    
    // Тестовые данные
    const testAgentId = 'test-agent-id';
    const testChatId = 'fix-test-chat-id';
    
    // Создаем тестовую фиксацию, если она не существует
    const fixationRef = db.collection('clientFixations').doc('test-fixation-id');
    const fixationDoc = await fixationRef.get();
    
    if (!fixationDoc.exists) {
      console.log('📝 Создаем тестовую фиксацию...');
      await fixationRef.set({
        dateTime: admin.firestore.Timestamp.now(),
        agentId: testAgentId,
        agentName: 'Тестовый Агент',
        clientName: 'Иван Петров',
        clientPhone: '+7 900 555-12-34',
        developerName: 'BFD',
        complexName: 'SERENITY VILLAS',
        propertyId: 'test-property-id',
        propertyType: 'Вилла',
        status: 'На согласовании',
        chatId: testChatId,
        district: 'Kab. Badung',
        price: '500000',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Тестовая фиксация создана');
    } else {
      console.log('✅ Тестовая фиксация уже существует');
    }
    
    // Создаем чат, если он не существует
    const chatRef = db.collection('agents').doc(testAgentId).collection('chats').doc(testChatId);
    const chatDoc = await chatRef.get();
    
    if (!chatDoc.exists) {
      console.log('📝 Создаем тестовый чат...');
      await chatRef.set({
        chatName: 'Тестовый чат фиксации',
        chatType: 'fixation',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        lastMessage: '',
        timestamp: admin.firestore.Timestamp.now()
      });
      console.log('✅ Тестовый чат создан');
    } else {
      console.log('✅ Тестовый чат уже существует');
    }
    
    // Тестовое изображение (используем реальные URL из Cloudinary)
    const testImageURL = 'https://res.cloudinary.com/dwulwgihw/image/upload/v1703123456/test-image.jpg';
    const testThumbnailURL = 'https://res.cloudinary.com/dwulwgihw/image/upload/c_thumb,w_150,h_150/v1703123456/test-image.jpg';
    
    // Формируем mediaURL в формате "thumbURL||fullURL" как в iOS приложении
    const mediaURL = `${testThumbnailURL}||${testImageURL}`;
    
    // Создаем тестовое сообщение с изображением
    const testImageMessage = {
      text: 'Тестовое изображение из iOS приложения',
      senderId: 'test-ios-user',
      senderName: 'iOS User',
      senderRole: 'client',
      mediaURL: mediaURL,
      mediaType: 'image',
      timestamp: admin.firestore.Timestamp.now(),
      isFromCurrentUser: false
    };
    
    console.log('📝 Данные тестового сообщения:');
    console.log('   👤 Отправитель:', testImageMessage.senderName);
    console.log('   📸 Тип медиа:', testImageMessage.mediaType);
    console.log('   🔗 URL миниатюры:', testThumbnailURL);
    console.log('   🔗 Полный URL:', testImageURL);
    console.log('   📝 Текст:', testImageMessage.text);
    
    // Добавляем сообщение в чат
    const messagesRef = db.collection('agents').doc(testAgentId).collection('chats').doc(testChatId).collection('messages');
    const docRef = await messagesRef.add(testImageMessage);
    
    console.log(`\n✅ Тестовое сообщение с изображением успешно добавлено!`);
    console.log(`   📄 ID сообщения: ${docRef.id}`);
    console.log(`   📍 Путь: agents/${testAgentId}/chats/${testChatId}/messages/${docRef.id}`);
    
    // Обновляем последнее сообщение в чате
    await chatRef.update({
      lastMessage: testImageMessage.text,
      timestamp: admin.firestore.Timestamp.now()
    });
    
    console.log(`\n✅ Последнее сообщение в чате обновлено`);
    
    // Добавляем еще одно текстовое сообщение для разнообразия
    const textMessage = {
      text: 'Это обычное текстовое сообщение для сравнения',
      senderId: 'test-ios-user',
      senderName: 'iOS User',
      senderRole: 'client',
      timestamp: admin.firestore.Timestamp.now(),
      isFromCurrentUser: false
    };
    
    const textDocRef = await messagesRef.add(textMessage);
    console.log(`\n✅ Текстовое сообщение добавлено: ${textDocRef.id}`);
    
    console.log('\n🎉 Тестирование завершено!');
    console.log('📱 Теперь вы можете открыть веб-приложение и проверить:');
    console.log('   1. Перейти в раздел "Фиксации клиентов"');
    console.log('   2. Найти фиксацию "Иван Петров"');
    console.log('   3. Нажать "Чат с агентом"');
    console.log('   4. Проверить отображение изображения в чате');
    console.log('   5. Нажать на изображение для полноэкранного просмотра');
    
  } catch (error) {
    console.error('❌ Ошибка при добавлении тестового сообщения:', error);
  }
}

// Запускаем тест
addTestImageMessage(); 