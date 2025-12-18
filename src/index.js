import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./AuthContext";
import "./index.css";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "./firebaseConfig";

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
    // Service Worker cache cleared
  }
};

// Service Worker включен для PWA функциональности
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
          // SW registered successfully
          
          // Явно проверяем обновления сразу после регистрации
          registration.update().catch(err => {
            // SW immediate update check failed
          });
          
          // Обработка обновлений
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  // Сразу применяем новую версию без подтверждения
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          // SW registration failed - не показываем пользователю, так как это не критично
        });
    } else {
      // SW registration skipped - not localhost or HTTPS
    }
  });
}

// Очистка кеша Service Worker при загрузке только в development
if (process.env.NODE_ENV === 'development') {
  clearServiceWorkerCache();
}

// PWA Install промо - браузер показывает стандартный баннер
window.addEventListener('beforeinstallprompt', (e) => {
  // Браузер автоматически покажет баннер установки PWA
  // e.preventDefault(); // Убрано - теперь браузер покажет баннер
});

// Обработка успешной установки
window.addEventListener('appinstalled', (evt) => {
  // PWA installed successfully
});

// Обработка изменения состояния сети
window.addEventListener('online', () => {
  // Back online - можно показать уведомление о восстановлении соединения
});

window.addEventListener('offline', () => {
  // Gone offline - можно показать уведомление об отсутствии соединения
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

// Глобальный обработчик для тихой авторизации внутри WebView (iOS мост вызывает эту функцию)
// Безопасность: НЕ передавайте токен через URL. Вызывайте напрямую из нативного кода после загрузки вашего домена.
if (!window.itAgentSilentLogin) {
  window.itAgentSilentLogin = async function itAgentSilentLogin(customToken) {
    try {
      if (!customToken || typeof customToken !== 'string') {
        console.warn('[SilentLogin] Нет валидного customToken');
        return { ok: false, reason: 'invalid_token' };
      }
      if (auth.currentUser) {
        return { ok: true, skipped: true };
      }
      await signInWithCustomToken(auth, customToken);
      return { ok: true };
    } catch (e) {
      console.error('[SilentLogin] Ошибка входа через custom token:', e?.message || e);
      return { ok: false, reason: e?.code || 'unknown_error' };
    }
  };
}

// Авто‑поллинг: если токен уже инжектирован до загрузки приложения,
// но itAgentSilentLogin не был вызван — пробуем автоматически.
if (!window.__itAgentSilentLoginPollerStarted) {
  window.__itAgentSilentLoginPollerStarted = true;
  (function startSilentLoginPoller(){
    let attempts = 0; const maxAttempts = 120; // ~30 секунд
    const timer = setInterval(async () => {
      try {
        if (auth.currentUser) { clearInterval(timer); return; }
        const t = window.__FIREBASE_CUSTOM_TOKEN;
        if (t && typeof t === 'string' && window.itAgentSilentLogin) {
          await window.itAgentSilentLogin(t);
          clearInterval(timer);
        }
      } catch (_) {}
      attempts++;
      if (attempts >= maxAttempts) clearInterval(timer);
    }, 250);
  })();
}

