const admin = require('firebase-admin');

// Путь к вашему файлу сервисного аккаунта
const serviceAccountPath = './bali-estate-1130f-firebase-adminsdk-fbsvc-15f3730e4e.json';

// User UID пользователя akapulko@inbox.ru
const targetUid = '7fsG9ofvm2NtBj4mXgHtm9GnKqw1';

// Инициализация Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

async function setAdminCustomClaim() {
  try {
    // Устанавливаем custom claim { role: 'admin' } для указанного UID
    await admin.auth().setCustomUserClaims(targetUid, { role: 'admin' });

    console.log(`Custom claim { role: 'admin' } успешно установлен для пользователя с UID: ${targetUid}`);
    console.log('Напомните пользователю выйти из системы и снова войти для обновления токена.');

  } catch (error) {
    console.error('Ошибка при установке custom claim:', error);
  }
}

setAdminCustomClaim(); 