const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

// Этот эндпоинт предназначен для iOS-приложения: оно присылает Firebase ID токен,
// мы верифицируем его через Admin SDK и выпускаем короткоживущий custom token,
// который затем используется Web SDK внутри WebView для тихого входа.
// Важно: не навешиваем authenticateApiKey/checkUserAccess миддлвары — пользователю
// достаточно иметь действительный ID токен. Rate limit и CORS стоят на уровне app.

router.post('/mint-custom-token', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const idToken = bearer || req.body?.idToken || req.body?.token || '';

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    // Верифицируем ID токен от iOS‑приложения (без обязательной проверки ревокации, чтобы избежать ложных 500)
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
      console.error('[mint-custom-token] verifyIdToken error:', e);
      // Возвращаем 401 с кодом/сообщением, чтобы клиент мог диагностировать проблему (другой проект, протухший токен и т.п.)
      return res.status(401).json({ error: 'Invalid ID token', details: e?.code || e?.message || String(e) });
    }
    const uid = decoded.uid;

    // Доп. защита: запрещаем заблокированным аккаунтам выпускать custom token
    try {
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'closed') {
        return res.status(403).json({ error: 'Account is blocked' });
      }
    } catch (e) {
      // Не блокируем по ошибке чтения, но логируем
      console.warn('[mint-custom-token] user role check failed:', e?.message || e);
    }

    // Выпускаем custom token для этого UID
    const customToken = await admin.auth().createCustomToken(uid);

    // Возвращаем custom token. Используйте его ТОЛЬКО немедленно на веб‑стороне.
    return res.json({ customToken });
  } catch (error) {
    console.error('[mint-custom-token] error:', error);
    const code = error?.code || '';
    if (
      code === 'auth/argument-error' ||
      code === 'auth/invalid-id-token' ||
      code === 'auth/id-token-revoked'
    ) {
      return res.status(401).json({ error: 'Invalid ID token', details: code });
    }
    return res.status(500).json({ error: 'Internal error', details: error?.message || String(error) });
  }
});

module.exports = router;


