// Terra University Service Worker
// ANSI/ISO-17024 Compliant Education Platform PWA

const CACHE_NAME = 'terra-university-v1.0.0';
const CACHE_URLS = [
  '/terra-university-dashboard.html',
  '/terra-university-manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('[Terra University SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Terra University SW] Caching app shell');
        return cache.addAll(CACHE_URLS);
      })
      .catch(error => {
        console.error('[Terra University SW] Cache installation failed:', error);
      })
  );
  
  // Force activation
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Terra University SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Terra University SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests for external APIs
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cdn.')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('[Terra University SW] Serving from cache:', event.request.url);
          return response;
        }

        console.log('[Terra University SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();

            // Cache successful responses
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('[Terra University SW] Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/terra-university-dashboard.html');
            }
            
            // Return empty response for other requests
            return new Response('', {
              status: 200,
              statusText: 'OK'
            });
          });
      })
  );
});

// Background sync for assessment data
self.addEventListener('sync', event => {
  if (event.tag === 'assessment-sync') {
    console.log('[Terra University SW] Background sync: assessment data');
    event.waitUntil(syncAssessmentData());
  }
  
  if (event.tag === 'certification-sync') {
    console.log('[Terra University SW] Background sync: certification data');
    event.waitUntil(syncCertificationData());
  }
});

// Push notifications for certification updates
self.addEventListener('push', event => {
  console.log('[Terra University SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New certification available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'terra-university-notification',
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ],
    data: {
      url: '/terra-university-dashboard.html#certifications'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Terra University', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[Terra University SW] Notification clicked');
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/terra-university-dashboard.html')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  console.log('[Terra University SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_ASSESSMENT') {
    cacheAssessmentData(event.data.payload);
  }
  
  if (event.data && event.data.type === 'CACHE_LEARNING_PROGRESS') {
    cacheLearningProgress(event.data.payload);
  }
});

// Utility functions for data synchronization
async function syncAssessmentData() {
  try {
    // Get pending assessment submissions from IndexedDB
    const pendingAssessments = await getPendingAssessments();
    
    for (const assessment of pendingAssessments) {
      const response = await fetch('/api/terra-university/assessments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessment)
      });
      
      if (response.ok) {
        await removePendingAssessment(assessment.id);
        console.log('[Terra University SW] Assessment synced:', assessment.id);
      }
    }
  } catch (error) {
    console.error('[Terra University SW] Assessment sync failed:', error);
  }
}

async function syncCertificationData() {
  try {
    const response = await fetch('/api/terra-university/certifications/status');
    if (response.ok) {
      const certifications = await response.json();
      await updateCertificationCache(certifications);
      console.log('[Terra University SW] Certifications synced');
    }
  } catch (error) {
    console.error('[Terra University SW] Certification sync failed:', error);
  }
}

async function cacheAssessmentData(data) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(data));
    await cache.put('/assessment-data', response);
    console.log('[Terra University SW] Assessment data cached');
  } catch (error) {
    console.error('[Terra University SW] Assessment caching failed:', error);
  }
}

async function cacheLearningProgress(data) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(data));
    await cache.put('/learning-progress', response);
    console.log('[Terra University SW] Learning progress cached');
  } catch (error) {
    console.error('[Terra University SW] Learning progress caching failed:', error);
  }
}

// IndexedDB operations for offline data storage
async function getPendingAssessments() {
  // In real implementation, this would use IndexedDB
  return [];
}

async function removePendingAssessment(id) {
  // In real implementation, this would remove from IndexedDB
  console.log('[Terra University SW] Removing pending assessment:', id);
}

async function updateCertificationCache(certifications) {
  // In real implementation, this would update IndexedDB
  console.log('[Terra University SW] Updating certification cache');
}

// Performance monitoring
self.addEventListener('fetch', event => {
  const startTime = Date.now();
  
  event.respondWith(
    fetch(event.request).then(response => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log slow requests for performance monitoring
      if (duration > 1000) {
        console.warn('[Terra University SW] Slow request detected:', {
          url: event.request.url,
          duration: duration,
          timestamp: new Date().toISOString()
        });
      }
      
      return response;
    })
  );
});

console.log('[Terra University SW] Service worker loaded successfully');