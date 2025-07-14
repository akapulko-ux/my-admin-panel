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

async function createRealFixation() {
  try {
    const db = admin.firestore();
    
    console.log('🧪 Создание тестовой фиксации (имитация реального приложения)...\n');
    
    // Создаем фиксацию как это делает iOS приложение (БЕЗ developerId)
    const realFixation = {
      dateTime: admin.firestore.Timestamp.now(),
      agentId: 'test-agent-id',
      agentName: 'Тестовый Агент',
      clientName: 'Иван Петров',
      clientPhone: '+7 900 555-12-34',
      developerName: 'BFD', // Название застройщика (без ID)
      complexName: 'SERENITY VILLAS',
      propertyId: 'test-property-id',
      propertyType: 'Вилла',
      status: 'На согласовании',
      chatId: 'fix-test-chat-id',
      district: 'Kab. Badung',
      price: '500000',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('📝 Данные фиксации (как в реальном приложении):');
    console.log('   👤 Клиент:', realFixation.clientName);
    console.log('   📞 Телефон:', realFixation.clientPhone);
    console.log('   🏗️ Застройщик:', realFixation.developerName);
    console.log('   🏢 Комплекс:', realFixation.complexName);
    console.log('   🔑 Developer ID:', realFixation.developerId || 'НЕ УКАЗАН (как в реальном приложении)');
    console.log('');
    
    // Добавляем фиксацию в коллекцию
    const docRef = await db.collection('clientFixations').add(realFixation);
    
    console.log(`✅ Тестовая фиксация создана с ID: ${docRef.id}`);
    console.log('🔄 Функция notifyNewFixation должна автоматически:');
    console.log('   1. Определить developerId по названию застройщика');
    console.log('   2. Обновить фиксацию с developerId');
    console.log('   3. Отправить уведомления застройщикам');
    console.log('');
    console.log('📋 Проверьте логи Firebase Functions для диагностики');
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Ошибка при создании тестовой фиксации:', error);
    throw error;
  }
}

async function checkFixationAfterCreation(fixationId) {
  try {
    const db = admin.firestore();
    
    console.log('\n🔍 Проверка фиксации после создания...');
    
    // Ждем немного, чтобы функция успела обработать фиксацию
    console.log('⏳ Ждем 5 секунд для обработки...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Получаем обновленную фиксацию
    const fixationDoc = await db.collection('clientFixations').doc(fixationId).get();
    
    if (fixationDoc.exists) {
      const fixationData = fixationDoc.data();
      console.log('📊 Результат обработки:');
      console.log('   🔑 Developer ID:', fixationData.developerId || 'НЕ УСТАНОВЛЕН');
      console.log('   🏗️ Застройщик:', fixationData.developerName);
      console.log('   📅 Обновлено:', fixationData.updatedAt ? new Date(fixationData.updatedAt.toDate()).toLocaleString() : 'НЕ ОБНОВЛЯЛОСЬ');
      
      if (fixationData.developerId) {
        console.log('✅ SUCCESS: developerId успешно определен и установлен!');
      } else {
        console.log('❌ FAILED: developerId не был определен');
      }
    } else {
      console.log('❌ Фиксация не найдена');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке фиксации:', error);
  }
}

async function runTest() {
  console.log('🚀 Тест автоматического определения developerId...\n');
  
  try {
    // Создаем тестовую фиксацию
    const fixationId = await createRealFixation();
    
    // Проверяем результат
    await checkFixationAfterCreation(fixationId);
    
    console.log('\n📋 Следующие шаги:');
    console.log('1. Откройте Firebase Console → Functions → Logs');
    console.log('2. Найдите логи функции notifyNewFixation');
    console.log('3. Проверьте сообщения об определении developerId');
    console.log('4. Убедитесь, что застройщик получает уведомление в бота');
    
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