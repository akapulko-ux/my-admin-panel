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

async function checkRealFixations() {
  try {
    const db = admin.firestore();
    
    console.log('🔍 Проверка реальных фиксаций в базе данных...\n');
    
    // Получаем последние 10 фиксаций
    const fixationsSnapshot = await db.collection('clientFixations')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`📊 Найдено ${fixationsSnapshot.size} последних фиксаций:\n`);
    
    fixationsSnapshot.forEach((doc, index) => {
      const fixationData = doc.data();
      console.log(`📝 Фиксация ${index + 1} (ID: ${doc.id}):`);
      console.log(`   👤 Клиент: ${fixationData.clientName || 'не указан'}`);
      console.log(`   📞 Телефон: ${fixationData.clientPhone || 'не указан'}`);
      console.log(`   🏢 Комплекс: ${fixationData.complexName || 'не указан'}`);
      console.log(`   🏗️ Застройщик: ${fixationData.developerName || 'не указан'}`);
      console.log(`   🔑 Developer ID: ${fixationData.developerId || 'НЕ УКАЗАН!'}`);
      console.log(`   🏠 Тип недвижимости: ${fixationData.propertyType || 'не указан'}`);
      console.log(`   📅 Дата создания: ${fixationData.createdAt ? new Date(fixationData.createdAt.toDate()).toLocaleString() : 'не указана'}`);
      console.log(`   🧪 Тестовая: ${fixationData.isTest ? 'Да' : 'Нет'}`);
      console.log('');
    });
    
    // Проверяем, есть ли фиксации без developerId
    const fixationsWithoutDeveloperId = fixationsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.developerId;
    });
    
    if (fixationsWithoutDeveloperId.length > 0) {
      console.log(`⚠️  ВНИМАНИЕ! Найдено ${fixationsWithoutDeveloperId.length} фиксаций БЕЗ developerId:`);
      fixationsWithoutDeveloperId.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ID: ${doc.id}, Клиент: ${data.clientName}, Комплекс: ${data.complexName}`);
      });
      console.log('');
    }
    
    // Проверяем, есть ли фиксации с developerId
    const fixationsWithDeveloperId = fixationsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.developerId;
    });
    
    console.log(`✅ Фиксаций с developerId: ${fixationsWithDeveloperId.length}`);
    console.log(`❌ Фиксаций без developerId: ${fixationsWithoutDeveloperId.length}`);
    
  } catch (error) {
    console.error('❌ Ошибка при проверке фиксаций:', error);
  }
}

async function checkComplexesForDeveloperId() {
  try {
    const db = admin.firestore();
    
    console.log('\n🏢 Проверка комплексов на наличие developerId...\n');
    
    // Получаем все комплексы
    const complexesSnapshot = await db.collection('complexes').get();
    
    console.log(`📊 Найдено ${complexesSnapshot.size} комплексов:\n`);
    
    complexesSnapshot.forEach((doc, index) => {
      const complexData = doc.data();
      console.log(`🏢 Комплекс ${index + 1} (ID: ${doc.id}):`);
      console.log(`   📝 Название: ${complexData.name || 'не указано'}`);
      console.log(`   🏗️ Застройщик: ${complexData.developerName || 'не указан'}`);
      console.log(`   🔑 Developer ID: ${complexData.developerId || 'НЕ УКАЗАН!'}`);
      console.log('');
    });
    
    // Проверяем, есть ли комплексы без developerId
    const complexesWithoutDeveloperId = complexesSnapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.developerId;
    });
    
    if (complexesWithoutDeveloperId.length > 0) {
      console.log(`⚠️  ВНИМАНИЕ! Найдено ${complexesWithoutDeveloperId.length} комплексов БЕЗ developerId:`);
      complexesWithoutDeveloperId.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ID: ${doc.id}, Название: ${data.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке комплексов:', error);
  }
}

async function runDiagnostic() {
  console.log('🚀 Диагностика проблемы с реальными фиксациями...\n');
  
  try {
    await checkRealFixations();
    await checkComplexesForDeveloperId();
    
    console.log('\n📋 Выводы:');
    console.log('1. Если фиксации создаются без developerId - это причина проблемы');
    console.log('2. Если комплексы не имеют developerId - фиксации не смогут получить developerId');
    console.log('3. Нужно проверить, как создаются фиксации в приложении');
    
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