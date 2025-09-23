const CACHE_NAME = 'pomodoro-pro-v4';
const urlsToCache = [
  '/pomodoro-pro/',
  '/pomodoro-pro/static/js/main.3935cedf.js',
  '/pomodoro-pro/static/css/main.c64ab729.css',
  '/pomodoro-pro/manifest.json',
  '/pomodoro-pro/favicon.ico',
  '/pomodoro-pro/logo192.png',
  '/pomodoro-pro/logo512.png',
  '/pomodoro-pro/pomodoro-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});