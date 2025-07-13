import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./AuthContext";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Service Worker регистрация
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Проверка на обновления каждые 60 секунд
        setInterval(() => {
          registration.update();
        }, 60000);
        
        // Обработка обновлений
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Показываем пользователю уведомление об обновлении
                if (window.confirm('Доступно обновление приложения. Обновить сейчас?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA Install промо
let deferredPrompt;
const addBtn = document.createElement('button');
addBtn.style.display = 'none';
addBtn.textContent = 'Установить приложение';
addBtn.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #1f2937;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: all 0.3s ease;
`;

addBtn.addEventListener('mouseenter', () => {
  addBtn.style.transform = 'translateY(-2px)';
  addBtn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
});

addBtn.addEventListener('mouseleave', () => {
  addBtn.style.transform = 'translateY(0)';
  addBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
});

document.body.appendChild(addBtn);

window.addEventListener('beforeinstallprompt', (e) => {
  // Предотвращаем показ мини-инфобара Chrome 67 и раньше
  e.preventDefault();
  // Сохраняем событие для последующего использования
  deferredPrompt = e;
  // Показываем кнопку установки
  addBtn.style.display = 'block';
  
  // Автоматически показываем промо через 30 секунд
  setTimeout(() => {
    if (deferredPrompt && addBtn.style.display === 'block') {
      addBtn.click();
    }
  }, 30000);
});

addBtn.addEventListener('click', (e) => {
  // Скрываем кнопку
  addBtn.style.display = 'none';
  // Показываем промо
  deferredPrompt.prompt();
  // Ждем выбора пользователя
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    deferredPrompt = null;
  });
});

// Обработка успешной установки
window.addEventListener('appinstalled', (evt) => {
  console.log('a2hs installed');
  // Скрываем кнопку установки
  addBtn.style.display = 'none';
  
  // Показываем уведомление об успешной установке
  const notification = document.createElement('div');
  notification.textContent = 'Приложение успешно установлено!';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 1001;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Удаляем уведомление через 3 секунды
  setTimeout(() => {
    notification.remove();
  }, 3000);
});

// Обработка изменения состояния сети
window.addEventListener('online', () => {
  console.log('Back online');
  // Можно показать уведомление о восстановлении соединения
});

window.addEventListener('offline', () => {
  console.log('Gone offline');
  // Можно показать уведомление об отсутствии соединения
});

// Добавляем CSS анимацию
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);