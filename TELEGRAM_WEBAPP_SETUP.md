# Настройка Telegram Web App для PROPWAY Bot

## 1. Настройка Web App в BotFather

### Шаг 1: Откройте BotFather
1. Найдите @BotFather в Telegram
2. Отправьте команду `/mybots`
3. Выберите PROPWAY Bot

### Шаг 2: Настройте Web App
1. Выберите "Bot Settings" → "Menu Button"
2. Выберите "Configure Menu Button"
3. Введите текст кнопки: `Открыть админ-панель` (русский) / `Open Admin Panel` (английский)
4. Введите URL Web App: `https://propway.site/`

### Шаг 3: Активируйте Web App
1. В настройках бота выберите "Web App"
2. Введите URL: `https://propway.site/`
3. Введите описание: "PROPWAY Admin Panel - система управления недвижимостью"

## 2. Альтернативная настройка через API

Можно также настроить программно через Telegram Bot API:

```bash
# Установка кнопки меню
curl -X POST "https://api.telegram.org/bot8168450032:AAHjSVJn8VqcBEsgK_NtbfgqxGeXW0buaUM/setChatMenuButton" \
-H "Content-Type: application/json" \
-d '{
  "menu_button": {
    "type": "web_app",
    "text": "Админ-панель",
    "web_app": {
      "url": "https://propway.site/"
    }
  }
}'
```

## 3. Проверка настройки

После настройки проверьте:
1. Откройте чат с ботом
2. Убедитесь, что появилась кнопка меню рядом с полем ввода
3. Нажмите на кнопку - должна открыться админ-панель внутри Telegram

## 4. Важные особенности

### URL должен быть HTTPS
- Telegram Web App работает только с HTTPS URL
- Наш URL `https://propway.site/` соответствует требованиям

### Поддерживаемые платформы
- ✅ Telegram Desktop
- ✅ Telegram Web
- ✅ Telegram Mobile (iOS/Android)

### Ограничения
- Web App открывается в отдельном окне внутри Telegram
- Имеет доступ к Telegram API для получения данных пользователя
- Может закрываться программно

## 5. Следующие шаги

После настройки Web App в BotFather:
1. Обновим код бота для поддержки Web App кнопок в уведомлениях
2. Добавим inline кнопки для открытия админ-панели
3. Протестируем интеграцию

## 6. Команды для тестирования

После настройки можно протестировать:
- `/start` - проверить приветственное сообщение с кнопкой
- Создать тестовую фиксацию в админке - проверить уведомление с Web App кнопкой 