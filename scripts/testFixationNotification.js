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

async function createTestFixation() {
  try {
    const db = admin.firestore();
    
    console.log('🧪 Создание тестовой фиксации...');
    
    // Создаем тестовую фиксацию
    const testFixation = {
      clientName: 'Тестовый Клиент',
      clientPhone: '+7 900 123-45-67',
      agentName: 'Тестовый Агент',
      complexName: 'Тестовый Комплекс',
      developerName: 'Тестовый Застройщик',
      developerId: 'PVBQmL8Ui1wQh7NXPE4y', // ID застройщика из users.json
      propertyType: 'Апарт-вилла',
      dateTime: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isTest: true
    };
    
    console.log('📝 Данные тестовой фиксации:', testFixation);
    
    // Добавляем фиксацию в коллекцию
    const docRef = await db.collection('clientFixations').add(testFixation);
    
    console.log(`✅ Тестовая фиксация создана с ID: ${docRef.id}`);
    console.log('🔄 Функция notifyNewFixation должна автоматически сработать...');
    console.log('📋 Проверьте логи Firebase Functions для диагностики');
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Ошибка при создании тестовой фиксации:', error);
    throw error;
  }
}

async function createSecondTestFixation() {
  try {
    const db = admin.firestore();
    
    console.log('🧪 Создание второй тестовой фиксации для другого застройщика...');
    
    // Создаем тестовую фиксацию для второго застройщика
    const testFixation = {
      clientName: 'Второй Тестовый Клиент',
      clientPhone: '+7 900 987-65-43',
      agentName: 'Второй Тестовый Агент',
      complexName: 'Второй Тестовый Комплекс',
      developerName: 'Второй Тестовый Застройщик',
      developerId: 'aXbLsYLqZyYFUwUq6vV8', // ID второго застройщика
      propertyType: 'Вилла',
      dateTime: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isTest: true
    };
    
    console.log('📝 Данные второй тестовой фиксации:', testFixation);
    
    // Добавляем фиксацию в коллекцию
    const docRef = await db.collection('clientFixations').add(testFixation);
    
    console.log(`✅ Вторая тестовая фиксация создана с ID: ${docRef.id}`);
    console.log('🔄 Функция notifyNewFixation должна автоматически сработать...');
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Ошибка при создании второй тестовой фиксации:', error);
    throw error;
  }
}

async function checkUsersWithTelegram() {
  try {
    const db = admin.firestore();
    
    console.log('👥 Проверка пользователей с подключенным Telegram...');
    
    const usersSnapshot = await db.collection('users')
      .where('telegramChatId', '!=', null)
      .get();
    
    console.log(`📊 Найдено ${usersSnapshot.size} пользователей с Telegram:`);
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`   👤 ${userData.email || doc.id}`);
      console.log(`      Роль: ${userData.role}`);
      console.log(`      Telegram Chat ID: ${userData.telegramChatId}`);
      console.log(`      Developer ID: ${userData.developerId || 'не указан'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Ошибка при проверке пользователей:', error);
  }
}

async function runTest() {
  console.log('🚀 Запуск теста уведомлений о фиксациях...\n');
  
  try {
    // Проверяем пользователей с Telegram
    await checkUsersWithTelegram();
    console.log('');
    
    // Создаем тестовую фиксацию для первого застройщика
    const fixationId1 = await createTestFixation();
    
    console.log('\n⏳ Ждем 3 секунды перед созданием второй фиксации...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Создаем тестовую фиксацию для второго застройщика
    const fixationId2 = await createSecondTestFixation();
    
    console.log('\n📋 Следующие шаги для диагностики:');
    console.log('1. Откройте Firebase Console → Functions → Logs');
    console.log('2. Найдите логи функции notifyNewFixation');
    console.log('3. Проверьте отладочные сообщения о проверке доступа');
    console.log('4. Убедитесь, что уведомления отправляются застройщикам');
    console.log(`5. Проверьте фиксации: ${fixationId1} и ${fixationId2}`);
    
  } catch (error) {
    console.error('❌ Ошибка выполнения теста:', error);
  }
}

// Запускаем тест
runTest().then(() => {
  console.log('\n🎉 Тест завершен');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Ошибка выполнения теста:', error);
  process.exit(1);
}); 