// iOS Safari compatible service worker
const CACHE_NAME = 'pomodoro-pro-ios-v1';
const urlsToCache = [
  '/pomodoro-pro/',
  '/pomodoro-pro/manifest.json',
  '/pomodoro-pro/favicon.ico',
  '/pomodoro-pro/logo192.png',
  '/pomodoro-pro/logo512.png',
  '/pomodoro-pro/pomodoro-icon.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Cache addAll failed:', err);
          // Don't fail installation if some resources can't be cached
          return Promise.resolve();
        });
      })
      .catch(err => {
        console.error('Cache open failed:', err);
        // Don't block installation
        return Promise.resolve();
      })
  );
  // Force immediate activation
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
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
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    }).catch(err => {
      console.error('Activation failed:', err);
      return Promise.resolve();
    })
  );
});

// Fetch event - network first, then cache fallback
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If we got a valid response, clone it and update cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(err => {
              console.log('Cache put failed:', err);
            });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // If not in cache and it's a navigation request, return index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/pomodoro-pro/');
            }
            return new Response('Resource not available', {
              status: 404,
              statusText: 'Not Found'
            });
          });
      })
  );
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
  event.preventDefault();
});