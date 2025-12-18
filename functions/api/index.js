const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Rate limiting - глобальный лимит
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Строгий rate limiting для аутентификационных endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа с одного IP
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true // не считать успешные запросы
});

// Применяем строгий лимит к auth endpoints
app.use('/v1/auth', authLimiter);
app.use('/api/v1/auth', authLimiter);

// Middleware для логирования времени запроса
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// API Routes
app.use('/v1/fixations', require('./routes/fixations'));
app.use('/v1/properties', require('./routes/properties'));
app.use('/v1/complexes', require('./routes/complexes'));
app.use('/v1/webhooks', require('./routes/webhooks'));
app.use('/v1/analytics', require('./routes/analytics'));
app.use('/v1/bots', require('./routes/bots'));
app.use('/v1/knowledge', require('./routes/knowledge'));
// Auth bridge for WebView silent login
app.use('/v1/auth', require('./routes/auth'));
// Robokassa endpoints
app.use('/payments/robokassa', require('./routes/robokassa'));
// Support same routes with '/api' prefix when proxied via Hosting rewrite
app.use('/api/payments/robokassa', require('./routes/robokassa'));
// Alias for auth under '/api' prefix (Hosting rewrite adds '/api' in front)
app.use('/api/v1/auth', require('./routes/auth'));

// Geo proxy to avoid CORS in the client
app.get('/v1/geo', async (req, res) => {
  try {
    const r = await fetch('https://ipapi.co/json/', { method: 'GET' });
    if (!r.ok) return res.status(204).end();
    const data = await r.json();
    return res.json({
      country: data?.country_name || null,
      city: data?.city || null,
      region: data?.region || null,
      ip: data?.ip || null
    });
  } catch (e) {
    return res.status(204).end();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app; 