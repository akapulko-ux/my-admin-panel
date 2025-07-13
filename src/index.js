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

// PWA Install промо (отключено - пользователи могут устанавливать через браузер)
window.addEventListener('beforeinstallprompt', (e) => {
  // Предотвращаем показ мини-инфобара Chrome
  e.preventDefault();
  console.log('PWA install prompt available');
});

// Обработка успешной установки
window.addEventListener('appinstalled', (evt) => {
  console.log('PWA installed successfully');
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

