let OpenAI;
try { OpenAI = require('openai'); } catch (_) { OpenAI = null; }

async function getEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !OpenAI) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });
  const cleaned = (text || '').toString().replace(/\s+/g, ' ').trim();
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
  const resp = await client.embeddings.create({ model, input: cleaned });
  const vec = resp.data?.[0]?.embedding;
  if (!Array.isArray(vec)) throw new Error('Embedding failed');
  return vec;
}

module.exports = { getEmbedding };











