/*
  Скрипт для установки кнопок меню (Chat Menu Button) у двух ботов:
  - @it_agent_admin_bot -> "Admin panel" -> https://it-agent.pro/
  - @bali_investor_bot  -> "Properties list" -> https://it-agent.pro/public

  Запуск локально: node functions/setupMenuButtons.js
*/

const ADMIN_BOT_TOKEN = "8168450032:AAHjSVJn8VqcBEsgK_NtbfgqxGeXW0buaUM"; // it_agent_admin_bot
const INVESTOR_BOT_TOKEN = "8317716572:AAHW5pB-Mges4evBxv_SLRKtJTG-Ru8nzw8"; // bali_investor_bot

async function setMenuButton(botToken, text, url) {
  const payload = {
    menu_button: {
      type: 'web_app',
      text,
      web_app: { url },
    },
  };

  const resp = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await resp.json();
  if (!resp.ok || data.ok === false) {
    throw new Error(`setChatMenuButton failed: ${JSON.stringify(data)}`);
  }
  return data;
}

async function getMenuButton(botToken) {
  const resp = await fetch(`https://api.telegram.org/bot${botToken}/getChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await resp.json();
  if (!resp.ok || data.ok === false) {
    throw new Error(`getChatMenuButton failed: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('▶️ Настройка меню для @it_agent_admin_bot ...');
  await setMenuButton(ADMIN_BOT_TOKEN, 'Admin panel', 'https://it-agent.pro/');
  const adminMenu = await getMenuButton(ADMIN_BOT_TOKEN);
  console.log('✅ @it_agent_admin_bot menu set to:', JSON.stringify(adminMenu, null, 2));

  console.log('▶️ Настройка меню для @bali_investor_bot ...');
  await setMenuButton(INVESTOR_BOT_TOKEN, 'Properties list', 'https://it-agent.pro/public');
  const investorMenu = await getMenuButton(INVESTOR_BOT_TOKEN);
  console.log('✅ @bali_investor_bot menu set to:', JSON.stringify(investorMenu, null, 2));

  console.log('🎉 Готово. Кнопки установлены в дефолтном меню обоих ботов.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Ошибка при установке меню:', err);
    process.exit(1);
  });
}

module.exports = { setMenuButton, getMenuButton };



