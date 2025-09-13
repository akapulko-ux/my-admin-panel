const Redis = require('ioredis');

let client = null;

function getRedis() {
  if (client) return client;
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
  const username = process.env.REDIS_USERNAME || undefined;
  const password = process.env.REDIS_PASSWORD || undefined;
  const useTls = String(process.env.REDIS_TLS || '').toLowerCase() === 'true';
  if (!host) return null;
  client = new Redis({ host, port, username, password, tls: useTls ? {} : undefined, lazyConnect: true, enableOfflineQueue: true });
  client.on('error', (e) => console.warn('[cache] redis error:', e.message));
  return client;
}

async function cacheGet(key) {
  try {
    const r = getRedis();
    if (!r) return null;
    if (!r.status || r.status === 'end') await r.connect().catch(() => {});
    const v = await r.get(key);
    return v ? JSON.parse(v) : null;
  } catch (_) { return null; }
}

async function cacheSet(key, value, ttlSeconds) {
  try {
    const r = getRedis();
    if (!r) return;
    if (!r.status || r.status === 'end') await r.connect().catch(() => {});
    const ttl = Number(process.env.CACHE_TTL_SECONDS || ttlSeconds || 900);
    await r.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (_) { /* ignore */ }
}

module.exports = { cacheGet, cacheSet };


