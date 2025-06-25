const admin = require('firebase-admin');

// Путь к вашему файлу сервисного аккаунта
const serviceAccountPath = './bali-estate-1130f-firebase-adminsdk-fbsvc-15f3730e4e.json';

// User UID и новый пароль
const targetUid = '7fsG9ofvm2NtBj4mXgHtm9GnKqw1';
const newPassword = 'Admin123!@#';

// Инициализация Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

async function resetPassword() {
  try {
    // Сбрасываем пароль
    await admin.auth().updateUser(targetUid, {
      password: newPassword,
    });

    console.log(`Пароль успешно сброшен для пользователя с UID: ${targetUid}`);
    console.log('Новый пароль:', newPassword);

  } catch (error) {
    console.error('Ошибка при сбросе пароля:', error);
  }
}

resetPassword(); 