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

// Маппинг комплексов к застройщикам (по названию застройщика)
const complexToDeveloperMapping = {
  // SWOI комплексы
  'SWOI GARDENS': 'V51GEuobTgKjJUyD737l', // SWOI
  'SWOI LOFT UMALAS': 'V51GEuobTgKjJUyD737l', // SWOI
  'SWOI BERAWA': 'V51GEuobTgKjJUyD737l', // SWOI
  
  // NEXA комплексы
  'NEXA TOWNHOUSE CANGGU': 'HDJDWVKtaxfACmH5Ruhg', // NEXA
  'NEXA TOWNHOUSE ULUWATU': 'HDJDWVKtaxfACmH5Ruhg', // NEXA
  'NEXA APARTMENTS': 'HDJDWVKtaxfACmH5Ruhg', // NEXA
  'NEXA OCEANVIEW 2': 'HDJDWVKtaxfACmH5Ruhg', // NEXA
  
  // LOYO комплексы
  'LOYO VILLAS': 'jxVzoJhi0FXL9nbZADNj', // LOYO DEVELOPMENT
  
  // ORO REAL ESTATE BALI комплексы
  'MELASTI ARCADE': 'PVIPQl3swL0hkTc71Zdx', // ORO REAL ESTATE BALI
  'MELASTI DREAM RESIDENCE': 'PVIPQl3swL0hkTc71Zdx', // ORO REAL ESTATE BALI
  'MELASTI APART': 'PVIPQl3swL0hkTc71Zdx', // ORO REAL ESTATE BALI
  'MELASTI VILLAS': 'PVIPQl3swL0hkTc71Zdx', // ORO REAL ESTATE BALI
  
  // HIDDEN CITY комплексы
  'HIDDEN CITY': 'DNWSJj4TPfYnZEdVKJMM', // HIDDEN CITY
  
  // OASIS комплексы
  'OASIS': 'XORI4gjt46PzTN0kl4Jr', // HQC
  'OASIS 2': 'XORI4gjt46PzTN0kl4Jr', // HQC
  'OASIS 3': 'XORI4gjt46PzTN0kl4Jr', // HQC
  'OASIS ROYAL COLLECTION': 'XORI4gjt46PzTN0kl4Jr', // HQC
  
  // AQUAMARINE комплексы
  'AQUAMARINE 1': 'LnOmvtotuy7zlM79rRhi', // MIRAH
  'AQUAMARINE 2': 'LnOmvtotuy7zlM79rRhi', // MIRAH
  'AQUAMARINE 3': 'LnOmvtotuy7zlM79rRhi', // MIRAH
  
  // PANDAWA комплексы
  'PANDAWA HILLS VILLAS': 'PobRW4nwpHsvdeqHmb6E', // BREIG
  'PANDAWA HILLS APART': 'PobRW4nwpHsvdeqHmb6E', // BREIG
  'PANDAWA DREAM VILLAS': 'PobRW4nwpHsvdeqHmb6E', // BREIG
  'PANDAWA DREAM APART': 'PobRW4nwpHsvdeqHmb6E', // BREIG
  'XO PANDAWA APARTMENTS': 'PobRW4nwpHsvdeqHmb6E', // BREIG
  'XO PANDAWA VILLAS': 'PobRW4nwpHsvdeqHmb6E', // BREIG
  
  // CANGGU комплексы
  'XO CANGGU APARTMENTS': 'PobRW4nwpHsvdeqHmb6E', // BREIG
  'XO CANGGU VILLAS': 'PobRW4nwpHsvdeqHmb6E', // BREIG
  
  // RED SUNSET комплексы
  'RED SUNSET 1': '53VacUKihovNfPTPw0dj', // THEIA
  'RED SUNSET 2': '53VacUKihovNfPTPw0dj', // THEIA
  
  // GARDEN VILLA комплексы
  'GARDEN VILLA 1': '5PSOCd1nFl62vxiVxQe0', // ADVA
  'GARDEN VILLA 2': '5PSOCd1nFl62vxiVxQe0', // ADVA
  
  // GREEN VILLAGE комплексы
  'GREEN VILLAGE VILLAS': 'hMNcTITVFLjFDuVOBtig', // LYVIN
  'GREEN VILLAGE APART': 'hMNcTITVFLjFDuVOBtig', // LYVIN
  
  // U VILLAS комплексы
  'U VILLAS 1': 'l05JwOQFthMafUwrcuvy', // ORBITA
  'U VILLAS 2': 'l05JwOQFthMafUwrcuvy', // ORBITA
  
  // NUSA DUA EDEM комплексы
  'NUSA DUA EDEM': 'p7lwU3rCDAijZOWNh41T', // BALI CAPITAL GROUP
  'NUSA DUA EDEM 2': 'p7lwU3rCDAijZOWNh41T', // BALI CAPITAL GROUP
  
  // Остальные комплексы (привязываем к BFD для тестирования)
  'SERENITY VILLAS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'THE HEIGHTS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'COCANA': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'OCTA SUN RESIDENCE': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'VILLAGE COMPLEX': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'RENAISSANCE RESIDENCE': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'UBUD DREAM': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'NAGAYA': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'DE VELLO': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'ULUWATU APARTMENTS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'JUNGLE FLOWER VILLAS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'HEY YOLO': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'SOMOSHOTELS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'GOLDEN PEARL': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'RIVER VILLA': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'NILA': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'ESCAPIST': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'VESNA TOWNHOUSES': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'DZEN GREEN FIELD': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'BALIWOOD 1': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'DREAM APARTMENTS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'BLACK ROCK': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'KIARA OCEAN PLACE': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'PAZ VILLAS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'GARDENS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'AMALI': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'SIX STARS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'KIARA BEACHFRONT': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'BALIWOOD 2': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'BINGIN VILLAS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'ARDHANA RESIDENCE': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'VIEW APARTMENTS': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'JUNGLE VISTA': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'ELYSIUM': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'TERRAKOTTA': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
  'PURI SIDEM': 'PVBQmL8Ui1wQh7NXPE4y', // BFD
};

async function assignComplexesToDevelopers() {
  try {
    const db = admin.firestore();
    
    console.log('🔗 Привязка комплексов к застройщикам...\n');
    
    // Получаем все комплексы
    const complexesSnapshot = await db.collection('complexes').get();
    
    console.log(`📊 Найдено ${complexesSnapshot.size} комплексов для обработки\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    const batch = db.batch();
    
    for (const doc of complexesSnapshot.docs) {
      const complexData = doc.data();
      const complexName = complexData.name;
      
      // Ищем застройщика по названию комплекса
      const developerId = complexToDeveloperMapping[complexName];
      
      if (developerId) {
        // Обновляем комплекс
        batch.update(doc.ref, {
          developerId: developerId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ ${complexName} → ${developerId}`);
        updatedCount++;
      } else {
        console.log(`❌ ${complexName} → НЕ НАЙДЕН МАППИНГ`);
        skippedCount++;
      }
    }
    
    // Выполняем batch обновление
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`\n🎉 Обновлено ${updatedCount} комплексов`);
    }
    
    if (skippedCount > 0) {
      console.log(`⚠️  Пропущено ${skippedCount} комплексов (нет маппинга)`);
    }
    
    console.log(`\n📊 Итого: ${updatedCount} обновлено, ${skippedCount} пропущено`);
    
  } catch (error) {
    console.error('❌ Ошибка при привязке комплексов:', error);
  }
}

async function verifyAssignment() {
  try {
    const db = admin.firestore();
    
    console.log('\n🔍 Проверка результатов привязки...\n');
    
    // Получаем комплексы с developerId
    const complexesWithDeveloperId = await db.collection('complexes')
      .where('developerId', '!=', null)
      .get();
    
    console.log(`✅ Комплексов с developerId: ${complexesWithDeveloperId.size}`);
    
    // Получаем комплексы без developerId
    const complexesWithoutDeveloperId = await db.collection('complexes')
      .where('developerId', '==', null)
      .get();
    
    console.log(`❌ Комплексов без developerId: ${complexesWithoutDeveloperId.size}`);
    
    if (complexesWithoutDeveloperId.size > 0) {
      console.log('\n⚠️  Комплексы без developerId:');
      complexesWithoutDeveloperId.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке:', error);
  }
}

async function runAssignment() {
  console.log('🚀 Запуск привязки комплексов к застройщикам...\n');
  
  try {
    await assignComplexesToDevelopers();
    await verifyAssignment();
    
    console.log('\n📋 Следующие шаги:');
    console.log('1. Создайте тестовую фиксацию через приложение');
    console.log('2. Проверьте, что фиксация получила developerId');
    console.log('3. Убедитесь, что застройщик получает уведомление в бота');
    
  } catch (error) {
    console.error('❌ Ошибка выполнения привязки:', error);
  }
}

// Запускаем привязку
runAssignment().then(() => {
  console.log('\n🎉 Привязка завершена');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Ошибка выполнения привязки:', error);
  process.exit(1);
}); 