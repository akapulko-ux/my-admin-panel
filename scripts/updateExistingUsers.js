const admin = require('firebase-admin');

// Путь к вашему файлу сервисного аккаунта
const serviceAccountPath = '../bali-estate-1130f-firebase-adminsdk-fbsvc-15f3730e4e.json';

// Определение ролей и их алиасов
const ROLES = {
  admin: ['admin', 'administrator', 'администратор'],
  moderator: ['moderator', 'mod'],
  premium_agent: ['premium_agent', 'premium agent', 'премиум агент', 'премиум-агент', 'premium'],
  agent: ['agent', 'агент'],
  user: ['user', 'пользователь', ''],
  closed: ['closed', 'закрытый аккаунт', 'закрытый', 'заблокированный']
};

// Функция для нормализации роли
function normalizeRole(role) {
  if (!role) return 'user';
  
  const normalizedRole = role.toLowerCase().trim();
  
  // Ищем соответствие в алиасах
  for (const [roleKey, aliases] of Object.entries(ROLES)) {
    if (aliases.includes(normalizedRole)) {
      return roleKey;
    }
  }
  
  console.warn(`Неизвестная роль "${role}" будет заменена на "user"`);
  return 'user';
}

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

      try {
        // Получаем документ пользователя из Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          const originalRole = userData.role;
          const normalizedRole = normalizeRole(originalRole);

          console.log(`Обработка пользователя ${email} (${uid}):`, {
            originalRole,
            normalizedRole
          });

          // Обновляем роль в Firestore, если она изменилась после нормализации
          if (originalRole !== normalizedRole) {
            await db.collection('users').doc(uid).update({
              role: normalizedRole,
              lastRoleUpdate: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Роль в Firestore обновлена для ${email} с ${originalRole} на ${normalizedRole}`);
          }

          // Проверяем и обновляем custom claims
          const currentClaims = userRecord.customClaims || {};
          if (!currentClaims.role || currentClaims.role !== normalizedRole) {
            await auth.setCustomUserClaims(uid, { role: normalizedRole });
            console.log(`✅ Custom claims обновлены для ${email} на роль ${normalizedRole}`);
          }
        } else {
          // Создаем документ пользователя, если он отсутствует
          const userData = {
            email: email,
            role: 'user',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            uid: uid,
            updatedByScript: true
          };

          await db.collection('users').doc(uid).set(userData);
          await auth.setCustomUserClaims(uid, { role: 'user' });
          console.log(`✅ Создан новый документ для пользователя ${email} с ролью user`);
        }
      } catch (error) {
        console.error(`❌ Ошибка при обработке пользователя ${email}:`, error);
      }
    }

    console.log('✅ Обновление всех пользователей завершено!');
    console.log('⚠️  Пользователи должны выйти и войти заново для применения новых custom claims');
  } catch (error) {
    console.error('❌ Ошибка при обновлении пользователей:', error);
  }
}

updateExistingUsers(); 