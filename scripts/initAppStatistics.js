const admin = require('firebase-admin');

try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (e) {
  console.error('Failed to initialize admin SDK:', e);
  process.exit(1);
}

async function main() {
  const db = admin.firestore();
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const todayYmd = `${y}-${m}-${d}`;

  const totals = {
    totalUsers: 171,
    activeUsers: 104,
    appLogins: 687,
    searches: 193,
    views: 1157,
    favorites: 54,
  };

  const payload = {
    totals,
    startDate: admin.firestore.Timestamp.fromDate(now),
    lastIncrementDate: todayYmd,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'init-script'
  };

  await db.doc('system/appStatistics').set(payload, { merge: true });
  const snap = await db.doc('system/appStatistics').get();
  console.log('Written document:\n', JSON.stringify(snap.data(), null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });











