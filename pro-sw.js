// Pomodoro Pro Service Worker - iOS Safari Compatible
const CACHE_NAME = 'pomodoro-pro-v1';
const urlsToCache = [
  '/pomodoro-pro/pro.html',
  '/pomodoro-pro/pro-manifest.json',
  '/pomodoro-pro/icon-192.png',
  '/pomodoro-pro/icon-512.png',
  '/pomodoro-pro/icon-1024.png',
  '/pomodoro-pro/icon-144.png',
  '/pomodoro-pro/icon-256.png',
  '/pomodoro-pro/icon-96.png'
];

// Install event - cache resources with error handling
self.addEventListener('install', event => {
  console.log('Pomodoro Pro SW installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching Pomodoro Pro resources...');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Cache addAll failed:', err);
          // Cache individual resources that succeed
          return Promise.allSettled(
            urlsToCache.map(url => cache.add(url))
          ).then(results => {
            console.log('Individual cache results:', results);
            return Promise.resolve();
          });
        });
      })
      .catch(err => {
        console.error('Cache open failed:', err);
        return Promise.resolve();
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Pomodoro Pro SW activating...');
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
      return self.clients.claim();
    }).catch(err => {
      console.error('Activation failed:', err);
      return Promise.resolve();
    })
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip external requests
  if (!event.request.url.includes('pomodoro-pro')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If we got a valid response, clone it and update cache
        if (response && response.status === 200 && response.type === 'basic') {
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
            // If not in cache and it's a navigation request, return main app
            if (event.request.mode === 'navigate') {
              return caches.match('/pomodoro-pro/pro.html');
            }
            // Return a generic offline response
            return new Response('Offline - Pomodoro Pro', {
              status: 404,
              statusText: 'Not Found',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync for data persistence (if supported)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync user data when online
      console.log('Background sync triggered')
    );
  }
});

// Push notification handling (for future features)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pomodoro-pro/icon-192.png',
      badge: '/pomodoro-pro/icon-96.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: [
        {
          action: 'start',
          title: 'Start Timer',
          icon: '/pomodoro-pro/icon-96.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'start') {
    event.waitUntil(
      clients.openWindow('/pomodoro-pro/pro.html?auto=start')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/pomodoro-pro/pro.html')
    );
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('Pomodoro Pro SW error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Pomodoro Pro SW unhandled rejection:', event.reason);
  event.preventDefault();
});

// Message handling for communication with the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});