// Terrafusion Public Records - Service Worker
// Makes the app work offline and lightning fast

const CACHE_NAME = 'terrafusion-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json', '/offline.html'];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
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
  // Claim all clients
  self.clients.claim();
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request because it's a stream
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it's a stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page if fetch fails
          return caches.match('/offline.html');
        });
    })
  );
});

// Push notification event
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update from your county',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/check.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/close.png',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('Terrafusion Alert', options));
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(clients.openWindow('/'));
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncOfflineForms());
  }
});

async function syncOfflineForms() {
  // Sync any forms submitted while offline
  const cache = await caches.open(CACHE_NAME);
  // Implementation would sync offline data
  console.log('Syncing offline forms...');
}

// Performance optimization - cache strategies
const cacheStrategies = {
  // Network first for API calls
  networkFirst: async request => {
    try {
      const networkResponse = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      return caches.match(request);
    }
  },

  // Cache first for static assets
  cacheFirst: async request => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  },

  // Stale while revalidate
  staleWhileRevalidate: async request => {
    const cachedResponse = await caches.match(request);
    const fetchPromise = fetch(request).then(networkResponse => {
      const cache = caches.open(CACHE_NAME);
      cache.then(cache => cache.put(request, networkResponse.clone()));
      return networkResponse;
    });
    return cachedResponse || fetchPromise;
  },
};

console.log('Service Worker: Ready to make government actually work offline!');
