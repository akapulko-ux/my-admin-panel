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

async function checkDevelopers() {
  try {
    const db = admin.firestore();
    
    console.log('🏗️ Проверка застройщиков в базе данных...\n');
    
    // Получаем всех застройщиков
    const developersSnapshot = await db.collection('developers').get();
    
    console.log(`📊 Найдено ${developersSnapshot.size} застройщиков:\n`);
    
    developersSnapshot.forEach((doc, index) => {
      const developerData = doc.data();
      console.log(`🏗️ Застройщик ${index + 1} (ID: ${doc.id}):`);
      console.log(`   📝 Название: ${developerData.name || 'не указано'}`);
      console.log(`   📧 Email: ${developerData.email || 'не указан'}`);
      console.log(`   📞 Телефон: ${developerData.phone || 'не указан'}`);
      console.log(`   🌐 Сайт: ${developerData.website || 'не указан'}`);
      console.log(`   📅 Дата создания: ${developerData.createdAt ? new Date(developerData.createdAt.toDate()).toLocaleString() : 'не указана'}`);
      console.log('');
    });
    
    // Проверяем, есть ли застройщики
    if (developersSnapshot.size === 0) {
      console.log('⚠️  ВНИМАНИЕ! В базе данных нет застройщиков!');
      console.log('   Нужно создать застройщиков перед привязкой комплексов.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке застройщиков:', error);
  }
}

async function checkUsersWithDeveloperRole() {
  try {
    const db = admin.firestore();
    
    console.log('👥 Проверка пользователей с ролью "застройщик"...\n');
    
    // Получаем пользователей с ролью застройщик
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'застройщик')
      .get();
    
    console.log(`📊 Найдено ${usersSnapshot.size} пользователей с ролью "застройщик":\n`);
    
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
      console.log(`⚠️  ВНИМАНИЕ! Найдено ${usersWithoutDeveloperId.length} пользователей с ролью "застройщик" БЕЗ developerId:`);
      usersWithoutDeveloperId.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. Email: ${data.email}, ID: ${doc.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке пользователей:', error);
  }
}

async function runDiagnostic() {
  console.log('🚀 Диагностика застройщиков и пользователей...\n');
  
  try {
    await checkDevelopers();
    await checkUsersWithDeveloperRole();
    
    console.log('\n📋 Выводы:');
    console.log('1. Нужно создать застройщиков в коллекции "developers"');
    console.log('2. Нужно привязать комплексы к застройщикам (добавить developerId)');
    console.log('3. Нужно убедиться, что пользователи с ролью "застройщик" имеют developerId');
    console.log('4. Только после этого фиксации смогут получать developerId и отправляться в бота');
    
  } catch (error) {
    console.error('❌ Ошибка выполнения диагностики:', error);
  }
}

// Запускаем диагностику
runDiagnostic().then(() => {
  console.log('\n🎉 Диагностика завершена');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Ошибка выполнения диагностики:', error);
  process.exit(1);
}); 