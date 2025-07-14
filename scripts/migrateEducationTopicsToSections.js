// Скрипт миграции тем обучения в дефолтный раздел
// Запускать через node scripts/migrateEducationTopicsToSections.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function migrate() {
  // 1. Создать дефолтный раздел
  const sectionRef = db.collection('educationSections').doc();
  const sectionId = sectionRef.id;
  await sectionRef.set({
    nameEn: 'General Section',
    nameRu: 'Общий раздел',
    nameId: 'Bagian Umum',
    descriptionEn: 'Default section for all topics',
    descriptionRu: 'Дефолтный раздел для всех тем',
    descriptionId: 'Bagian default untuk semua topik',
    roles: ['admin', 'модератор', 'застройщик', 'agent', 'premium agent', 'user'],
    createdAt: new Date()
  });
  console.log('Создан дефолтный раздел с id:', sectionId);

  // 2. Проставить sectionId во все темы
  const topicsSnap = await db.collection('educationTopics').get();
  const batch = db.batch();
  topicsSnap.forEach(docSnap => {
    batch.update(docSnap.ref, { sectionId });
  });
  await batch.commit();
  console.log('Всем темам добавлен sectionId:', sectionId);
}

migrate().then(() => {
  console.log('Миграция завершена');
  process.exit(0);
}).catch(e => {
  console.error('Ошибка миграции:', e);
  process.exit(1);
}); 