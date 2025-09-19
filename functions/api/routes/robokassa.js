const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');

const router = express.Router();

// Config from environment
const ROBO_MERCHANT = process.env.ROBO_MERCHANT_LOGIN || 'it-agent';
const ROBO_PASSWORD1 = process.env.ROBO_PASSWORD1 || '';
const ROBO_PASSWORD2 = process.env.ROBO_PASSWORD2 || '';
const ROBO_TEST_PASSWORD1 = process.env.ROBO_TEST_PASSWORD1 || '';
const ROBO_TEST_PASSWORD2 = process.env.ROBO_TEST_PASSWORD2 || '';
const ROBO_BASE_URL = 'https://auth.robokassa.ru/Merchant/Index.aspx';

// Fixed price for one-time access (RUB)
const ONE_TIME_PRICE_RUB = Number(process.env.ONE_TIME_PRICE_RUB || 4000);

function buildSignatureSHA256Init({ merchantLogin, outSum, invId, password, shpParams }) {
  const shpEntries = Object.entries(shpParams || {})
    .filter(([k]) => k && k.startsWith('Shp_'))
    .sort(([a], [b]) => a.localeCompare(b));
  const base = `${merchantLogin}:${outSum}:${invId}:${password}`;
  const tail = shpEntries.map(([k, v]) => `:${k}=${v}`).join('');
  const str = base + tail;
  return crypto.createHash('sha256').update(str).digest('hex');
}

function buildSignatureSHA256Result({ outSum, invId, password, shpParams }) {
  const shpEntries = Object.entries(shpParams || {})
    .filter(([k]) => k && k.startsWith('Shp_'))
    .sort(([a], [b]) => a.localeCompare(b));
  const base = `${outSum}:${invId}:${password}`;
  const tail = shpEntries.map(([k, v]) => `:${k}=${v}`).join('');
  const str = base + tail;
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function verifyIdTokenFromAuthHeader(req) {
  const authHeader = req.get('Authorization') || '';
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) {
    try {
      const decoded = await admin.auth().verifyIdToken(parts[1]);
      return decoded;
    } catch (e) {
      return null;
    }
  }
  return null;
}

// POST /payments/robokassa/create
// body: { propertyId: string, isTest?: boolean }
router.post('/create', async (req, res) => {
  try {
    const decoded = await verifyIdTokenFromAuthHeader(req);
    if (!decoded || !decoded.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = decoded.uid;
    const { propertyId, isTest } = req.body || {};
    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    const outSum = `${ONE_TIME_PRICE_RUB.toFixed(2)}`; // e.g. 4000.00
    const invId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const description = `One-time access to property ${propertyId}`;

    const Shp_uid = userId;
    const Shp_pid = propertyId;

    // Store preliminary order
    await admin.firestore().collection('robokassaOrders').doc(invId).set({
      userId,
      propertyId,
      invId,
      outSum: outSum,
      currency: 'RUB',
      provider: 'robokassa',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isTest: Boolean(isTest) || false
    });

    // Choose passwords depending on isTest
    const pwd1 = (Boolean(isTest) ? ROBO_TEST_PASSWORD1 : ROBO_PASSWORD1) || ROBO_PASSWORD1;

    const shpParams = { Shp_uid, Shp_pid };
    const signature = buildSignatureSHA256Init({
      merchantLogin: ROBO_MERCHANT,
      outSum,
      invId,
      password: pwd1,
      shpParams
    });

    const qs = new URLSearchParams({
      MerchantLogin: ROBO_MERCHANT,
      OutSum: outSum,
      InvId: invId,
      Description: description,
      SignatureValue: signature,
      Culture: 'en',
      Encoding: 'utf-8'
    });
    // Append Shp_* explicitly to preserve naming
    qs.append('Shp_uid', Shp_uid);
    qs.append('Shp_pid', Shp_pid);
    if (Boolean(isTest)) qs.append('IsTest', '1');

    const url = `${ROBO_BASE_URL}?${qs.toString()}`;

    return res.json({ url, invId });
  } catch (error) {
    console.error('robokassa.create error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /payments/robokassa/result (webhook)
router.post('/result', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    // Robokassa can send as form POST; also support JSON just in case
    const data = Object.keys(req.body || {}).length ? req.body : (req.query || {});
    const OutSum = data.OutSum || data.outsum;
    const InvId = data.InvId || data.invid;
    const SignatureValue = (data.SignatureValue || data.signaturevalue || '').toLowerCase();

    const Shp_uid = data.Shp_uid || data.shp_uid;
    const Shp_pid = data.Shp_pid || data.shp_pid;

    if (!OutSum || !InvId || !SignatureValue) {
      return res.status(400).send('Bad Request');
    }

    // Determine which password to use based on stored order.isTest
    const orderSnap = await admin.firestore().collection('robokassaOrders').doc(String(InvId)).get();
    const isTest = orderSnap.exists && orderSnap.data()?.isTest === true;
    const pwd2 = (isTest ? ROBO_TEST_PASSWORD2 : ROBO_PASSWORD2) || ROBO_PASSWORD2;

    const shpParams = {};
    if (Shp_uid) shpParams.Shp_uid = Shp_uid;
    if (Shp_pid) shpParams.Shp_pid = Shp_pid;

    const expected = buildSignatureSHA256Result({ outSum: OutSum, invId: InvId, password: pwd2, shpParams }).toLowerCase();
    if (expected !== SignatureValue) {
      console.error('Invalid signature in Robokassa result', { InvId, expected, got: SignatureValue });
      return res.status(400).send('Invalid signature');
    }

    // Resolve userId and propertyId
    let userId = Shp_uid;
    let propertyId = Shp_pid;
    if ((!userId || !propertyId) && orderSnap.exists) {
      const od = orderSnap.data();
      userId = userId || od.userId;
      propertyId = propertyId || od.propertyId;
    }

    if (!userId || !propertyId) {
      console.error('Missing Shp params and order mapping for InvId', InvId);
      return res.status(400).send('Missing metadata');
    }

    // Mark order paid and create entitlement
    const db = admin.firestore();
    await db.collection('robokassaOrders').doc(String(InvId)).set({
      status: 'paid',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      outSum: OutSum
    }, { merge: true });

    const entId = `${userId}_${propertyId}`;
    await db.collection('entitlements').doc(entId).set({
      userId,
      propertyId,
      provider: 'robokassa',
      type: 'one_time',
      status: 'active',
      invId: String(InvId),
      amount: Number(OutSum),
      currency: 'RUB',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Robokassa expects 'OK' + InvId
    return res.status(200).send(`OK${InvId}`);
  } catch (error) {
    console.error('robokassa.result error:', error);
    return res.status(500).send('Internal server error');
  }
});

module.exports = router;


