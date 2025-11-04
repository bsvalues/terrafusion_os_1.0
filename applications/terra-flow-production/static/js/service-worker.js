/**
 * GeoAssessmentPro Service Worker
 * Provides offline access capabilities for field assessors
 */

const CACHE_NAME = 'geoassessmentpro-v1';
const ASSETS_CACHE_NAME = 'geoassessmentpro-assets-v1';
const MAP_CACHE_NAME = 'geoassessmentpro-maps-v1';

// Resources to cache immediately on installation
const PRECACHE_URLS = [
  '/',
  '/login',
  '/static/css/styles.css',
  '/static/css/mobile.css',
  '/static/js/main.js',
  '/static/js/offline.js',
  '/static/img/icons/icon-192x192.png',
  '/static/img/offline-background.jpg',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js',
  'https://code.jquery.com/jquery-3.6.0.min.js'
];

// Field assessment-specific resources
const FIELD_ASSESSMENT_URLS = [
  '/assessment-map',
  '/map-viewer',
  '/static/js/map-controls.js',
  '/static/js/property-assessment.js'
];

// Install event - cache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Pre-caching critical assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Skip waiting for activation
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, ASSETS_CACHE_NAME, MAP_CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(cachesToDelete.map(cacheToDelete => {
          console.log('Removing old cache:', cacheToDelete);
          return caches.delete(cacheToDelete);
        }));
      })
      .then(() => {
        // Claim clients to start serving updated content
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network with caching strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin && 
      !event.request.url.includes('cdn.jsdelivr.net') && 
      !event.request.url.includes('code.jquery.com')) {
    return;
  }
  
  // Apply different strategies based on URL patterns
  
  // 1. API requests - network-first with timeout fallback
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(networkFirstWithTimeout(event.request, 3000));
  }
  
  // 2. Map tile requests - cache first with network fallback
  if (url.pathname.includes('/tiles/') || 
      url.hostname.includes('tile.openstreetmap.org') ||
      url.hostname.includes('maps.googleapis.com')) {
    return event.respondWith(cacheFirst(event.request, MAP_CACHE_NAME));
  }
  
  // 3. Static assets - cache first with network update
  if (url.pathname.startsWith('/static/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') || 
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') || 
      url.pathname.endsWith('.woff2')) {
    return event.respondWith(staleWhileRevalidate(event.request, ASSETS_CACHE_NAME));
  }
  
  // 4. HTML pages - network first with cache fallback
  return event.respondWith(networkFirst(event.request));
});

// Network-first strategy with cache fallback
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    // Cache the response for future use
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache match and we're navigating to a page, show offline page
    if (request.mode === 'navigate') {
      return cache.match('/static/offline.html');
    }
    
    // Otherwise just fail
    throw error;
  }
}

// Network-first strategy with timeout fallback to cache
async function networkFirstWithTimeout(request, timeoutMs) {
  const cache = await caches.open(CACHE_NAME);
  
  // Create a promise that rejects after the timeout
  const networkTimeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Network timeout')), timeoutMs);
  });
  
  try {
    // Race the network request against the timeout
    const networkResponse = await Promise.race([
      fetch(request),
      networkTimeoutPromise
    ]);
    
    // Cache the successful response
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // On timeout or network failure, use cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's an API request, return a custom response
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. This data is unavailable.'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For other resources, fail
    throw error;
  }
}

// Cache-first strategy with network fallback
async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // For map tiles, return a placeholder image if available
    if (request.url.includes('/tiles/') || request.url.includes('.tile.')) {
      return cache.match('/static/img/map-placeholder.png');
    }
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName = CACHE_NAME) {
  const cache = await caches.open(cacheName);
  
  // Return cached response immediately (if exists)
  const cachedResponse = await cache.match(request);
  
  // Fetch from network and update cache in the background
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    })
    .catch(error => {
      console.error('Failed to fetch and cache:', error);
      // Still throw so we use cached response
      throw error;
    });
  
  // Return cached response immediately if available, otherwise wait for fetch
  return cachedResponse || fetchPromise;
}

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-assessments') {
    event.waitUntil(syncAssessments());
  } else if (event.tag === 'sync-inspections') {
    event.waitUntil(syncInspections());
  }
});

// Sync pending property assessments
async function syncAssessments() {
  const db = await openDatabase();
  const pendingAssessments = await db.getAll('pendingAssessments');
  
  // Process each pending assessment
  for (const assessment of pendingAssessments) {
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessment.data)
      });
      
      if (response.ok) {
        // Remove synced assessment from pending queue
        await db.delete('pendingAssessments', assessment.id);
        
        // Notify user of successful sync
        const title = 'Assessment Synced';
        const options = {
          body: `Assessment for property ${assessment.data.parcel_id} has been successfully synchronized.`,
          icon: '/static/img/icons/icon-192x192.png',
          badge: '/static/img/icons/badge-72x72.png',
          tag: 'assessment-sync'
        };
        
        self.registration.showNotification(title, options);
      }
    } catch (error) {
      console.error('Failed to sync assessment:', error);
    }
  }
}

// Sync pending inspections
async function syncInspections() {
  const db = await openDatabase();
  const pendingInspections = await db.getAll('pendingInspections');
  
  // Process each pending inspection
  for (const inspection of pendingInspections) {
    try {
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspection.data)
      });
      
      if (response.ok) {
        // Remove synced inspection from pending queue
        await db.delete('pendingInspections', inspection.id);
        
        // Notify user of successful sync
        const title = 'Inspection Synced';
        const options = {
          body: `Inspection for property ${inspection.data.parcel_id} has been successfully synchronized.`,
          icon: '/static/img/icons/icon-192x192.png',
          badge: '/static/img/icons/badge-72x72.png',
          tag: 'inspection-sync'
        };
        
        self.registration.showNotification(title, options);
      }
    } catch (error) {
      console.error('Failed to sync inspection:', error);
    }
  }
}

// Helper function to open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GeoAssessmentProOffline', 1);
    
    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      
      // Create stores for offline data
      if (!db.objectStoreNames.contains('pendingAssessments')) {
        db.createObjectStore('pendingAssessments', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingInspections')) {
        db.createObjectStore('pendingInspections', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('cachedProperties')) {
        db.createObjectStore('cachedProperties', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      // Define database methods
      const dbWrapper = {
        getAll: function(storeName) {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        },
        delete: function(storeName, key) {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      };
      
      resolve(dbWrapper);
    };
    
    request.onerror = function(event) {
      reject(new Error('Failed to open IndexedDB'));
    };
  });
}