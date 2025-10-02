// Minimal SW to avoid stale cache and always serve latest from network
// Version bump to force update on deployment
const SW_VERSION = 'sw-v-2025-08-13-1';

self.addEventListener('install', (event) => {
	// Activate immediately on install
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// Remove all existing caches to avoid serving stale content
			try {
				const cacheNames = await caches.keys();
				await Promise.all(cacheNames.map((name) => caches.delete(name)));
			} catch (e) {
				// no-op
			}
			// Take control of uncontrolled clients immediately
			await self.clients.claim();
		})()
	);
});

// Intentionally no 'fetch' handler → the browser will use HTTP caching only
// per Firebase Hosting headers (index.html no-cache; assets immutable).

const CACHE_NAME = 'it-agent-panel-v2';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/offline.html'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Cache installation failed:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Не перехватываем fetch — пусть браузер работает по HTTP кешу и заголовкам

// Обработка push уведомлений (для будущего использования)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };

    event.waitUntil(
      self.registration.showNotification('IT Agent Panel', options)
    );
  }
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
}); 