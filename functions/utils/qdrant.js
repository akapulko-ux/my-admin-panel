const fetch = global.fetch || require('node-fetch');

const COLLECTION = process.env.QDRANT_COLLECTION || 'properties_kb';

async function qdrant(path, opts = {}) {
  const base = process.env.QDRANT_URL;
  const key = process.env.QDRANT_API_KEY;
  const url = `${base}${path}`;
  const resp = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'api-key': key,
      ...(opts.headers || {})
    }
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`Qdrant error ${resp.status}: ${JSON.stringify(json)}`);
  return json;
}

async function ensureCollection(vectorSize) {
  try {
    await qdrant(`/collections/${COLLECTION}`);
  } catch (_) {
    await qdrant(`/collections/${COLLECTION}`, {
      method: 'PUT',
      body: JSON.stringify({
        vectors: { size: vectorSize, distance: 'Cosine' }
      })
    });
  }
  // Ensure keyword index for payload field "district" (needed for filters)
  try {
    await qdrant(`/collections/${COLLECTION}/index`, {
      method: 'PUT',
      body: JSON.stringify({ field_name: 'district', field_schema: 'keyword' })
    });
  } catch (e) {
    const msg = (e && e.message) || '';
    // Ignore if index already exists
    if (!/already exists/i.test(msg)) {
      throw e;
    }
  }
  return true;
}

// Generic helpers for named collections (for Knowledge Base)
async function ensureCollectionFor(collectionName, vectorSize, keywordFields = []) {
  try {
    await qdrant(`/collections/${collectionName}`);
  } catch (_) {
    await qdrant(`/collections/${collectionName}`, {
      method: 'PUT',
      body: JSON.stringify({ vectors: { size: vectorSize, distance: 'Cosine' } })
    });
  }
  // create keyword indexes
  for (const field of keywordFields) {
    try {
      await qdrant(`/collections/${collectionName}/index`, {
        method: 'PUT',
        body: JSON.stringify({ field_name: field, field_schema: 'keyword' })
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!/already exists/i.test(msg)) throw e;
    }
  }
  return true;
}

async function upsertPoints(points) {
  // points: [{id, vector, payload}]
  return qdrant(`/collections/${COLLECTION}/points?wait=true`, {
    method: 'PUT',
    body: JSON.stringify({ points })
  });
}

async function upsertPointsTo(collectionName, points) {
  return qdrant(`/collections/${collectionName}/points?wait=true`, {
    method: 'PUT',
    body: JSON.stringify({ points })
  });
}

async function searchSimilar(vector, topK = 20, filter = null) {
  return qdrant(`/collections/${COLLECTION}/points/search`, {
    method: 'POST',
    body: JSON.stringify({ vector, limit: topK, filter })
  });
}

async function searchSimilarIn(collectionName, vector, topK = 20, filter = null) {
  return qdrant(`/collections/${collectionName}/points/search`, {
    method: 'POST',
    body: JSON.stringify({ vector, limit: topK, filter })
  });
}

module.exports = { ensureCollection, upsertPoints, searchSimilar, COLLECTION, ensureCollectionFor, upsertPointsTo, searchSimilarIn };


