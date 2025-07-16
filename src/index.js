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

// Функция для очистки кеша Service Worker (для разработки)
const clearServiceWorkerCache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('Service Worker cache cleared');
  }
};

// Service Worker регистрация с улучшенной обработкой ошибок
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Проверяем, что мы в production или на localhost
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
        window.location.hostname === '[::1]' ||
        window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );

    // Регистрируем SW только в production или на localhost
    if (isLocalhost || window.location.protocol === 'https:') {
      // В режиме разработки очищаем кеш при загрузке
      if (process.env.NODE_ENV === 'development') {
        clearServiceWorkerCache();
      }

      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered successfully: ', registration);
          
          // Проверка на обновления каждые 60 секунд
          setInterval(() => {
            registration.update().catch(err => {
              console.log('SW update check failed:', err);
            });
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
          // Не показываем ошибку пользователю, так как это не критично
        });
    } else {
      console.log('SW registration skipped - not localhost or HTTPS');
    }
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

// Глобальные функции для отладки (доступны в консоли браузера)
window.clearSWCache = clearServiceWorkerCache;
window.reloadSW = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    }).then(() => {
      window.location.reload();
    });
  }
};

