// Локальные секреты для разработки
// В ПРОДАКШЕНЕ эти значения должны браться из Firebase Environment Configuration

const secrets = {
  // Telegram Bot Tokens
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8168450032:AAHjSVJn8VqcBEsgK_NtbfgqxGeXW0buaUM',
  TELEGRAM_ADMIN_BOT_TOKEN: process.env.TELEGRAM_ADMIN_BOT_TOKEN || '8168450032:AAHjSVJn8VqcBEsgK_NtbfgqxGeXW0buaUM',
  TELEGRAM_INVESTOR_BOT_TOKEN: process.env.TELEGRAM_INVESTOR_BOT_TOKEN || '8317716572:AAHW5pB-Mges4evBxv_SLRKtJTG-Ru8nzw8',
  TELEGRAM_SUPERVISION_BOT_TOKEN: process.env.TELEGRAM_SUPERVISION_BOT_TOKEN || '8424126127:AAGsb5ia4eo7yXcj9EcAvGDPNgVj9KfIYGY',

  // API Keys and Secrets
  INDEX_SECRET: process.env.INDEX_SECRET || 'super-index-secret',

  // Public Gallery Base URL
  PUBLIC_GALLERY_BASE_URL: process.env.PUBLIC_GALLERY_BASE_URL || 'https://propway.site'
};

module.exports = secrets;
