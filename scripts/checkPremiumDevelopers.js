const admin = require('firebase-admin');

// Путь к вашему файлу сервисного аккаунта
const serviceAccountPath = '../bali-estate-1130f-firebase-adminsdk-fbsvc-15f3730e4e.json';

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function checkPremiumDevelopers() {
  try {
    const db = admin.firestore();
    
    console.log('👥 Проверка пользователей с ролью "премиум застройщик"...\n');
    
    // Получаем пользователей с ролью премиум застройщик
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'премиум застройщик')
      .get();
    
    console.log(`📊 Найдено ${usersSnapshot.size} пользователей с ролью "премиум застройщик":\n`);
    
    usersSnapshot.forEach((doc, index) => {
      const userData = doc.data();
      console.log(`👤 Пользователь ${index + 1} (ID: ${doc.id}):`);
      console.log(`   📧 Email: ${userData.email || 'не указан'}`);
      console.log(`   🏗️ Developer ID: ${userData.developerId || 'НЕ УКАЗАН!'}`);
      console.log(`   📱 Telegram Chat ID: ${userData.telegramChatId || 'не подключен'}`);
      console.log(`   📅 Дата создания: ${userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleString() : 'не указана'}`);
      console.log('');
    });
    
    // Проверяем, есть ли пользователи без developerId
    const usersWithoutDeveloperId = usersSnapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.developerId;
    });
    
    if (usersWithoutDeveloperId.length > 0) {
      console.log(`⚠️  ВНИМАНИЕ! Найдено ${usersWithoutDeveloperId.length} пользователей с ролью "премиум застройщик" БЕЗ developerId:`);
      usersWithoutDeveloperId.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. Email: ${data.email}, ID: ${doc.id}`);
      });
      
      console.log('\n🔧 Для исправления:');
      console.log('1. Зайдите в раздел "Управление пользователями" в веб-приложении');
      console.log('2. Найдите пользователя с ролью "премиум застройщик"');
      console.log('3. В поле "Застройщик" выберите соответствующего застройщика');
      console.log('4. Сохраните изменения');
    } else {
      console.log('✅ Все пользователи с ролью "премиум застройщик" имеют назначенного застройщика');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке пользователей:', error);
  }
}

async function checkDevelopers() {
  try {
    const db = admin.firestore();
    
    console.log('🏗️ Проверка застройщиков в коллекции "developers"...\n');
    
    const developersSnapshot = await db.collection('developers').get();
    
    console.log(`📊 Найдено ${developersSnapshot.size} застройщиков:\n`);
    
    developersSnapshot.forEach((doc, index) => {
      const developerData = doc.data();
      console.log(`🏗️ Застройщик ${index + 1} (ID: ${doc.id}):`);
      console.log(`   📝 Название: ${developerData.name || 'не указано'}`);
      console.log(`   📧 Email: ${developerData.email || 'не указан'}`);
      console.log(`   📱 Telegram: ${developerData.telegram || 'не указан'}`);
      console.log(`   📅 Дата создания: ${developerData.createdAt ? new Date(developerData.createdAt.toDate()).toLocaleString() : 'не указана'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Ошибка при проверке застройщиков:', error);
  }
}

async function runDiagnostic() {
  console.log('🚀 Диагностика премиум застройщиков...\n');
  
  try {
    await checkDevelopers();
    await checkPremiumDevelopers();
    
    console.log('\n📋 Выводы:');
    console.log('1. Проверьте, что в коллекции "developers" есть застройщики');
    console.log('2. Убедитесь, что пользователи с ролью "премиум застройщик" имеют developerId');
    console.log('3. Только после этого функция отправки уведомлений будет работать корректно');
    
  } catch (error) {
    console.error('❌ Ошибка выполнения диагностики:', error);
  }
}

// Запускаем диагностику
runDiagnostic().then(() => {
  console.log('\n✅ Диагностика завершена');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Ошибка:', error);
  process.exit(1);
}); 