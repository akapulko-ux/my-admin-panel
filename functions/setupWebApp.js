const BOT_TOKEN = "8168450032:AAHjSVJn8VqcBEsgK_NtbfgqxGeXW0buaUM";

// Функция для установки кнопки меню Web App
const setupWebAppMenuButton = async () => {
  try {
    console.log('🚀 Настройка Web App menu button...');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: 'Админ-панель',
          web_app: {
            url: 'https://propway.site/'
          }
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Web App menu button установлена успешно:', result);
    } else {
      console.error('❌ Ошибка установки Web App menu button:', result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Ошибка при установке Web App menu button:', error);
    throw error;
  }
};

// Функция для проверки текущей настройки меню
const getMenuButton = async () => {
  try {
    console.log('🔍 Проверка текущих настроек menu button...');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('📋 Текущие настройки menu button:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Ошибка получения настроек menu button:', result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Ошибка при получении настроек menu button:', error);
    throw error;
  }
};

// Функция для установки команд бота
const setBotCommands = async () => {
  try {
    console.log('⚙️ Установка команд бота...');
    
    const commands = [
      {
        command: 'start',
        description: 'Начать работу с ботом / Start working with bot'
      },
      {
        command: 'help',
        description: 'Получить справку / Get help'
      }
    ];
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: commands
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Команды бота установлены успешно:', result);
    } else {
      console.error('❌ Ошибка установки команд бота:', result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Ошибка при установке команд бота:', error);
    throw error;
  }
};

// Основная функция настройки
const setupBot = async () => {
  console.log('🤖 Начинаем настройку IT Agent Bot...\n');
  
  try {
    // Проверяем текущие настройки
    await getMenuButton();
    console.log('');
    
    // Устанавливаем Web App menu button
    await setupWebAppMenuButton();
    console.log('');
    
    // Устанавливаем команды бота
    await setBotCommands();
    console.log('');
    
    // Проверяем результат
    await getMenuButton();
    
    console.log('\n🎉 Настройка бота завершена успешно!');
    console.log('📱 Теперь пользователи могут открыть админ-панель через кнопку меню в боте');
    
  } catch (error) {
    console.error('\n❌ Ошибка при настройке бота:', error);
  }
};

// Запуск если скрипт вызван напрямую
if (require.main === module) {
  setupBot();
}

module.exports = {
  setupWebAppMenuButton,
  getMenuButton,
  setBotCommands,
  setupBot
}; 