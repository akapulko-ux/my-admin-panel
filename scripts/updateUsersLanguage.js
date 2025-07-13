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

async function updateUsersLanguage() {
  try {
    const db = admin.firestore();
    
    // Получаем всех пользователей из Firestore
    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.get();
    
    console.log(`Найдено ${snapshot.size} пользователей в Firestore`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Обновляем пользователей батчами
    const batch = db.batch();
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Проверяем, есть ли уже поле language
      if (!userData.language) {
        // Добавляем поле language с значением по умолчанию 'ru'
        batch.update(doc.ref, {
          language: 'ru',
          languageUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
        console.log(`Обновляется пользователь ${userData.email || doc.id} - добавлено поле language: 'ru'`);
      } else {
        skippedCount++;
        console.log(`Пользователь ${userData.email || doc.id} уже имеет поле language: ${userData.language}`);
      }
    });
    
    // Выполняем обновление
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ Обновлено ${updatedCount} пользователей`);
    } else {
      console.log('ℹ️ Нет пользователей для обновления');
    }
    
    console.log(`📊 Статистика:`);
    console.log(`  - Обновлено: ${updatedCount}`);
    console.log(`  - Пропущено: ${skippedCount}`);
    console.log(`  - Всего: ${snapshot.size}`);
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении пользователей:', error);
  }
}

// Запускаем скрипт
updateUsersLanguage().then(() => {
  console.log('🎉 Скрипт обновления языка пользователей завершен');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Ошибка выполнения скрипта:', error);
  process.exit(1);
}); 