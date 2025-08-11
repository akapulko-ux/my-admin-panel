import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { name, phone, propertyId } = req.body || {};
    if (!name || !phone) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    await addDoc(collection(db, 'clientLeads'), {
      name,
      phone,
      propertyId: propertyId || null,
      createdAt: serverTimestamp(),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Lead save error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}


