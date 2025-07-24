# 🚀 Система API интеграции для IT Agent

Полная система API интеграции для передачи данных о заявках на фиксацию клиентов в сторонние CRM системы.

## 📋 Обзор системы

Система включает в себя:
- **REST API** для получения данных о фиксациях, объектах и комплексах
- **Webhook систему** для реального времени уведомлений
- **Управление API ключами** с разграничением прав доступа
- **Аналитику использования** API
- **Документацию** для разработчиков

## 🏗️ Архитектура

### Backend (Firebase Functions)
```
functions/
├── api/
│   ├── index.js              # Основной Express сервер
│   ├── middleware/
│   │   └── auth.js           # Аутентификация и авторизация
│   └── routes/
│       ├── fixations.js      # API фиксаций
│       ├── properties.js     # API объектов
│       ├── complexes.js      # API комплексов
│       ├── webhooks.js       # API webhook
│       └── analytics.js      # API аналитики
├── webhookService.js         # Сервис отправки webhook
└── index.js                  # Экспорт функций
```

### Frontend (React)
```
src/
├── pages/
│   ├── ApiKeys.js            # Управление API ключами
│   └── Webhooks.js           # Управление webhook
└── components/
    └── Navigation.js         # Навигация (обновлена)
```

## 🔧 Установка и развертывание

### 1. Установка зависимостей

```bash
cd functions
npm install
```

### 2. Развертывание Firebase Functions

```bash
firebase deploy --only functions
```

### 3. Настройка Firestore Rules

Добавьте правила для новых коллекций:

```javascript
// apiKeys collection
match /apiKeys/{document} {
  allow read, write: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}

// webhookSubscriptions collection
match /webhookSubscriptions/{document} {
  allow read, write: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}

// apiLogs collection
match /apiLogs/{document} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow write: if false; // Только сервер может писать
}

// webhookLogs collection
match /webhookLogs/{document} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow write: if false; // Только сервер может писать
}
```

### 4. Развертывание Frontend

```bash
npm run build
firebase deploy --only hosting
```

## 🔑 API Ключи

### Создание API ключа
1. Перейдите в раздел "API Ключи" в админ-панели
2. Нажмите "Создать API ключ"
3. Укажите название и описание
4. Выберите разрешения
5. Скопируйте сгенерированный ключ

### Использование API ключа
```bash
curl -H "X-API-Key: sk_live_your_api_key_here" \
  https://us-central1-bali-estate-1130f.cloudfunctions.net/api/v1/fixations
```

## 🔗 Webhook

### Создание webhook подписки
1. Перейдите в раздел "Webhook" в админ-панели
2. Нажмите "Создать Webhook"
3. Укажите URL эндпоинта
4. Выберите события для подписки
5. Протестируйте webhook

### Обработка webhook на вашем сервере
```javascript
const crypto = require('crypto');

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  // Проверяем подпись
  const expectedSignature = crypto
    .createHmac('sha256', 'your_webhook_secret')
    .update(payload)
    .digest('hex');
    
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Обрабатываем событие
  const { event, data } = req.body;
  
  switch (event) {
    case 'fixation.created':
      // Обработка новой фиксации
      break;
    case 'fixation.status_changed':
      // Обработка изменения статуса
      break;
  }
  
  res.status(200).json({ received: true });
});
```

## 📊 API Endpoints

### Фиксации
- `GET /v1/fixations` - Список фиксаций
- `GET /v1/fixations/:id` - Конкретная фиксация
- `GET /v1/fixations/stats` - Статистика фиксаций

### Объекты
- `GET /v1/properties` - Список объектов
- `GET /v1/properties/:id` - Конкретный объект

### Комплексы
- `GET /v1/complexes` - Список комплексов
- `GET /v1/complexes/:id` - Конкретный комплекс

### Webhook
- `GET /v1/webhooks` - Список подписок
- `POST /v1/webhooks` - Создание подписки
- `PUT /v1/webhooks/:id` - Обновление подписки
- `DELETE /v1/webhooks/:id` - Удаление подписки
- `POST /v1/webhooks/:id/test` - Тестирование подписки

### Аналитика
- `GET /v1/analytics/usage` - Статистика использования
- `GET /v1/analytics/api-keys` - Статистика ключей
- `GET /v1/analytics/webhooks` - Статистика webhook

## 🔒 Безопасность

### Аутентификация
- API ключи привязаны к конкретным пользователям
- Проверка ролей и прав доступа
- Лимиты использования по ролям

### Webhook безопасность
- HMAC-SHA256 подписи
- Проверка URL валидности
- Логирование всех доставок

### Rate Limiting
- Ограничения по количеству запросов
- Разные лимиты для разных ролей
- Автоматическое блокирование при превышении

## 📈 Мониторинг

### Логирование
- Все API запросы логируются
- Webhook доставки отслеживаются
- Ошибки и исключения записываются

### Аналитика
- Статистика использования API
- Отчеты по webhook доставкам
- Мониторинг производительности

## 🚀 Интеграция с CRM

### Пример интеграции с AmoCRM
```javascript
const axios = require('axios');

class AmoCRMIntegration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://us-central1-bali-estate-1130f.cloudfunctions.net/api/v1';
  }
  
  async getFixations() {
    const response = await axios.get(`${this.baseUrl}/fixations`, {
      headers: { 'X-API-Key': this.apiKey }
    });
    return response.data.data;
  }
  
  async createLead(fixation) {
    // Создание лида в AmoCRM на основе фиксации
    const leadData = {
      name: `Фиксация: ${fixation.clientName}`,
      phone: fixation.clientPhone,
      custom_fields: [
        { id: 123, values: [{ value: fixation.complexName }] },
        { id: 124, values: [{ value: fixation.propertyType }] }
      ]
    };
    
    // Отправка в AmoCRM API
    return await axios.post('https://your-domain.amocrm.ru/api/v4/leads', leadData);
  }
}
```

### Пример интеграции с Bitrix24
```javascript
class Bitrix24Integration {
  constructor(apiKey, webhookUrl) {
    this.apiKey = apiKey;
    this.webhookUrl = webhookUrl;
    this.baseUrl = 'https://us-central1-bali-estate-1130f.cloudfunctions.net/api/v1';
  }
  
  async setupWebhook() {
    const webhookData = {
      url: this.webhookUrl,
      events: ['fixation.created', 'fixation.status_changed']
    };
    
    const response = await axios.post(`${this.baseUrl}/webhooks`, webhookData, {
      headers: { 'X-API-Key': this.apiKey }
    });
    
    return response.data.data;
  }
  
  async handleWebhook(payload) {
    const { event, data } = payload;
    
    if (event === 'fixation.created') {
      await this.createDeal(data);
    }
  }
  
  async createDeal(fixation) {
    const dealData = {
      fields: {
        TITLE: `Фиксация: ${fixation.clientName}`,
        CONTACT_ID: await this.getOrCreateContact(fixation),
        STAGE_ID: 'NEW',
        CURRENCY_ID: 'RUB',
        OPPORTUNITY: 0
      }
    };
    
    return await axios.post('https://your-domain.bitrix24.ru/rest/1/your-webhook/crm.deal.add', dealData);
  }
}
```

## 📚 Документация

Полная документация доступна по адресу:
```
https://your-domain.com/api-docs.html
```

## 🛠️ Разработка

### Локальная разработка
```bash
# Запуск Firebase emulator
firebase emulators:start

# Запуск frontend в режиме разработки
npm start
```

### Тестирование
```bash
# Тестирование API
npm test

# Тестирование webhook
curl -X POST http://localhost:5001/your-project/us-central1/api/v1/webhooks/test-id/test
```

## 📞 Поддержка

При возникновении вопросов или проблем:
1. Проверьте логи в Firebase Console
2. Убедитесь в правильности API ключа
3. Проверьте настройки webhook URL
4. Обратитесь к документации API

## 🔄 Обновления

### Версия 1.0.0
- ✅ Базовая API система
- ✅ Управление API ключами
- ✅ Webhook система
- ✅ Аналитика использования
- ✅ Документация
- ✅ Интеграция с существующей системой

### Планы на будущее
- 🔄 GraphQL API
- 🔄 Более детальная аналитика
- 🔄 Интеграция с популярными CRM
- 🔄 SDK для различных языков программирования 