# Настройка переменных окружения

## Локальная разработка

Создайте файл `.env.local` в корне проекта со следующим содержимым:

```bash
# Firebase (уже настроено в firebaseConfig.js)
REACT_APP_FIREBASE_API_KEY=ваш_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=ваш_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=ваш_project_id

# Telegram Bot Tokens (ОБЯЗАТЕЛЬНО ЗАМЕНИТЬ НА РЕАЛЬНЫЕ)
TELEGRAM_ADMIN_BOT_TOKEN=ваш_реальный_admin_bot_token
TELEGRAM_INVESTOR_BOT_TOKEN=ваш_реальный_investor_bot_token
BALI_SUPERVISION_BOT_TOKEN=ваш_реальный_supervision_bot_token

# OpenAI API Key (ОБЯЗАТЕЛЬНО ЗАМЕНИТЬ НА РЕАЛЬНЫЙ)
OPENAI_API_KEY=ваш_реальный_openai_api_key

# Cloudinary (для изображений)
REACT_APP_CLOUDINARY_API_KEY=ваш_реальный_cloudinary_api_key
REACT_APP_CLOUDINARY_API_SECRET=ваш_реальный_cloudinary_api_secret

# Qdrant (для векторного поиска)
QDRANT_URL=https://ваш_реальный_qdrant_instance:6333
QDRANT_API_KEY=ваш_реальный_qdrant_api_key

# Redis
REDIS_HOST=ваш_реальный_redis_host
REDIS_PORT=6379
REDIS_USERNAME=ваш_реальный_redis_username
REDIS_PASSWORD=ваш_реальный_redis_password
REDIS_TLS=true

# Other
INDEX_SECRET=ваш_реальный_index_secret
PUBLIC_GALLERY_BASE_URL=https://propway.site
```

## Production (Firebase Functions)

### ⚠️ СРОЧНО: МИГРАЦИЯ НА .ENV ФАЙЛЫ!

**Firebase functions.config() отключат в марте 2026!**

#### ШАГ 1: Создайте functions/.env файл
```bash
# Создайте файл functions/.env с содержимым:
TELEGRAM_ADMIN_BOT_TOKEN=8168450032:AAHjSVJn8VqcBEsgK_NtbfgqxGeXW0buaUM
TELEGRAM_INVESTOR_BOT_TOKEN=8317716572:AAHW5pB-Mges4evBxv_SLRKtJTG-Ru8nzw8
BALI_SUPERVISION_BOT_TOKEN=8424126127:AAGsb5ia4eo7yXcj9EcAvGDPNgVj9KfIYGY
OPENAI_API_KEY=ваш_openai_api_key
QDRANT_URL=https://ваш_qdrant_instance:6333
QDRANT_API_KEY=ваш_qdrant_api_key
REDIS_HOST=ваш_redis_host
REDIS_PORT=6379
REDIS_USERNAME=ваш_redis_username
REDIS_PASSWORD=ваш_redis_password
REDIS_TLS=true
INDEX_SECRET=ваш_index_secret
PUBLIC_GALLERY_BASE_URL=https://propway.site
```

#### ШАГ 2: Добавьте в .gitignore
```bash
# В корневом .gitignore добавьте:
functions/.env
```

#### ШАГ 3: Тестирование
```bash
# Деплой functions
firebase deploy --only functions

# Проверьте логи что переменные загружены
firebase functions:log
```

### Текущий статус:
- ✅ **Код готов** к .env файлам (fallback на functions.config())
- ✅ **CLI настроен** (работает до 2026)
- ⏳ **Нужен .env файл** для future-proof решения

### Почему важно мигрировать:
- functions.config() **отключат в марте 2026**
- .env файлы **более гибкие и современные**
- Легче **управлять секретами локально**

### Альтернатива (временная):
**Через Firebase Console:**
- Console → Functions → Configuration → Add variable

## Проверка

После настройки переменных:

```bash
# Локально
npm run build
npm start

# В Functions
firebase functions:config:get
```

## Важно!

- Никогда не коммитьте `.env.local` в Git
- Используйте разные секреты для dev/staging/production
- Регулярно ротируйте API ключи
