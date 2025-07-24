const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

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