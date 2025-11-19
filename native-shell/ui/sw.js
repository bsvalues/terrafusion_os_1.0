/**
 * Terrafusion OS Service Worker - PWA Offline Support
 * Handles caching, background sync, and offline functionality for government module system
 */

const CACHE_NAME = 'terrafusion-os-v1.0.0';
const API_CACHE_NAME = 'terrafusion-api-v1.0.0';
const MODULE_CACHE_NAME = 'terrafusion-modules-v1.0.0';

// Resources to cache immediately
const PRECACHE_RESOURCES = [
  '/',
  '/manifest.json',
  '/static/js/main.js',
  '/static/css/main.css',
  '/static/media/logo.svg',
  // Add other critical static assets
];

// API endpoints to cache
const CACHEABLE_API_ROUTES = [
  '/api/ecosystem/status',
  '/api/ecosystem/performance/summary',
  '/api/modules/',
  '/api/health',
  '/api/ai-swarm/status'
];

// Module-specific routes that need offline support
const MODULE_ROUTES = [
  '/modules/government-edition',
  '/modules/ai-command-brain',
  '/modules/marketplace-champion',
  '/modules/unified-system'
];

self.addEventListener('install', (event) => {
  // SW: Installing service worker
  
  event.waitUntil(
    Promise.all([
      // Cache core app resources
      caches.open(CACHE_NAME).then((cache) => {
        // SW: Precaching app resources
        return cache.addAll(PRECACHE_RESOURCES);
      }),
      
      // Initialize API cache
      caches.open(API_CACHE_NAME).then((cache) => {
        // SW: Initialized API cache
        return cache;
      }),
      
      // Initialize module cache
      caches.open(MODULE_CACHE_NAME).then((cache) => {
        // SW: Initialized module cache
        return cache;
      })
    ])
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // SW: Activating service worker
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== MODULE_CACHE_NAME) {
              // SW: Deleting old cache
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle module requests
  if (MODULE_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(handleModuleRequest(request));
    return;
  }
  
  // Handle app shell requests
  if (request.destination === 'document') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticAssetRequest(request));
});

/**
 * Handle API requests with cache-first strategy for GET requests
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Only cache GET requests for specific endpoints
  if (request.method === 'GET' && 
      CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
    
    try {
      // Try network first for fresh data
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache successful response
        const cache = await caches.open(API_CACHE_NAME);
        await cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      // SW: Network request failed, checking cache
    }
    
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request, { cacheName: API_CACHE_NAME });
    if (cachedResponse) {
      // SW: Serving API request from cache
      return cachedResponse;
    }
    
    // Return offline response for ecosystem status
    if (url.pathname.includes('/ecosystem/status')) {
      return new Response(JSON.stringify({
        totalModules: 33,
        activeModules: 0,
        healthyModules: 0,
        warningModules: 0,
        criticalModules: 0,
        averagePerformance: 0,
        totalMemoryUsage: 0,
        totalComponentCount: 25000,
        lastUpdate: new Date().toISOString(),
        moduleHealthStatuses: [],
        offline: true
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
  }
  
  // For non-cacheable requests, try network only
  return fetch(request);
}

/**
 * Handle module requests with stale-while-revalidate strategy
 */
async function handleModuleRequest(request) {
  const cache = await caches.open(MODULE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Serve from cache immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
      })
      .catch(() => {
        // SW: Background update failed
      });
    
    return cachedResponse;
  }
  
  // No cache, try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline module page
    return new Response(
      '<html><body><h1>Module Offline</h1><p>This module is not available offline.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' }, status: 200 }
    );
  }
}

/**
 * Handle navigation requests (app shell)
 */
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Serve app shell from cache when offline
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/');
    return cachedResponse || new Response(
      '<html><body><h1>Offline</h1><p>Terrafusion OS is not available offline.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' }, status: 200 }
    );
  }
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.url.startsWith(self.location.origin)) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // SW: Static asset request failed
    throw error;
  }
}

// Background sync for module data
self.addEventListener('sync', (event) => {
  // SW: Background sync triggered
  
  if (event.tag === 'module-data-sync') {
    event.waitUntil(syncModuleData());
  } else if (event.tag === 'ecosystem-status-sync') {
    event.waitUntil(syncEcosystemStatus());
  }
});

/**
 * Sync module data in background
 */
async function syncModuleData() {
  try {
    // SW: Syncing module data in background
    
    const modulesToSync = [
      '/api/ecosystem/status',
      '/api/ecosystem/performance/summary',
      '/api/modules/health'
    ];
    
    const cache = await caches.open(API_CACHE_NAME);
    
    for (const url of modulesToSync) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
          // SW: Synced
        }
      } catch (error) {
        // SW: Failed to sync
      }
    }
    
    // Notify all clients about successful sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', data: 'module-data' });
    });
    
  } catch (error) {
    // SW: Background sync failed
  }
}

/**
 * Sync ecosystem status
 */
async function syncEcosystemStatus() {
  try {
    const response = await fetch('/api/ecosystem/status');
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      await cache.put('/api/ecosystem/status', response.clone());
      
      const data = await response.json();
      
      // Notify clients
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ 
          type: 'ECOSYSTEM_STATUS_UPDATED', 
          data 
        });
      });
    }
  } catch (error) {
    // SW: Ecosystem status sync failed
  }
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
  // SW: Received message
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SYNC_DATA') {
    // Cache data provided by the app
    cacheProvidedData(event.data.data);
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
});

/**
 * Cache data provided by the main app
 */
async function cacheProvidedData(data) {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const response = new Response(JSON.stringify(data));
    await cache.put('/api/cached-data', response);
    // SW: Cached provided data
  } catch (error) {
    // SW: Failed to cache provided data
  }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    // SW: All caches cleared
  } catch (error) {
    // SW: Failed to clear caches
  }
}

// Periodic background tasks
setInterval(() => {
  // Cleanup old cache entries
  cleanupOldCacheEntries();
}, 60 * 60 * 1000); // Run every hour

/**
 * Cleanup old cache entries
 */
async function cleanupOldCacheEntries() {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const keys = await cache.keys();
    
    // Remove entries older than 24 hours
    const maxAge = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const cacheTime = new Date(dateHeader).getTime();
          if (now - cacheTime > maxAge) {
            await cache.delete(request);
            // SW: Removed old cache entry
          }
        }
      }
    }
  } catch (error) {
    // SW: Cache cleanup failed
  }
}

// SW: Terrafusion OS Service Worker loaded