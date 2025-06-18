const admin = require('firebase-admin');

// Путь к вашему файлу сервисного аккаунта
const serviceAccountPath = '../bali-estate-1130f-firebase-adminsdk-fbsvc-15f3730e4e.json';

// Инициализация Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

async function updateExistingUsers() {
  try {
    const db = admin.firestore();
    const auth = admin.auth();

    // Получаем всех пользователей из Firebase Auth
    const listUsersResult = await auth.listUsers();
    console.log(`Найдено ${listUsersResult.users.length} пользователей в Firebase Auth`);

    for (const userRecord of listUsersResult.users) {
      const uid = userRecord.uid;
      const email = userRecord.email;

      // Проверяем, существует ли документ пользователя в Firestore
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        // Создаем документ пользователя
        const userData = {
          email: email,
          role: 'agent',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          uid: uid,
          updatedByScript: true
        };

        await db.collection('users').doc(uid).set(userData);
        console.log(`✅ Создан документ для пользователя ${email} (${uid})`);

        // Устанавливаем custom claims
        await auth.setCustomUserClaims(uid, { role: 'agent' });
        console.log(`✅ Установлены custom claims для пользователя ${email} (${uid})`);
      } else {
        // Проверяем и обновляем custom claims, если они отсутствуют
        const userData = userDoc.data();
        const userRole = userData.role || 'agent';
        
        // Проверяем current custom claims
        const userRecord = await auth.getUser(uid);
        const currentClaims = userRecord.customClaims || {};
        
        if (!currentClaims.role || currentClaims.role !== userRole) {
          await auth.setCustomUserClaims(uid, { role: userRole });
          console.log(`✅ Обновлены custom claims для пользователя ${email} (${uid}) с ролью ${userRole}`);
        } else {
          console.log(`ℹ️  Пользователь ${email} (${uid}) уже имеет корректные данные`);
        }
      }
    }

    console.log('✅ Обновление всех пользователей завершено!');
    console.log('⚠️  Пользователи должны выйти и войти заново для применения custom claims');
  } catch (error) {
    console.error('❌ Ошибка при обновлении пользователей:', error);
  }
}

updateExistingUsers(); 