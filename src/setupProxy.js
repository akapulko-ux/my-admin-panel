const { createProxyMiddleware } = require('http-proxy-middleware');

// Development proxy setup
module.exports = function(app) {
  // Add proper headers for manifest.webmanifest in development
  app.get('/manifest.webmanifest', (req, res, next) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    next();
  });

  // Add security headers for development
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
};
