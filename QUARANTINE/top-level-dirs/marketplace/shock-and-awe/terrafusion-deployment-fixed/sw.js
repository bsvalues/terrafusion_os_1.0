/**
 * TerraFusion Market - Service Worker
 * Progressive Web App Implementation
 * Squad Gamma Component - Offline & Caching
 */

const CACHE_NAME = 'terrafusion-market-v1.0.0';
const STATIC_CACHE = 'terrafusion-static-v1';
const DYNAMIC_CACHE = 'terrafusion-dynamic-v1';
const API_CACHE = 'terrafusion-api-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/components.css',
    '/js/main.js',
    '/js/demo.js',
    '/js/animations.js',
    '/js/quantum-viz.js',
    '/manifest.json',
    '/assets/logo.svg',
    '/assets/favicon.ico',
    '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/config',
    '/api/counties',
    '/api/assessment/types',
    '/api/market/trends'
];

// Assets that should be cached on first access
const DYNAMIC_ASSETS = [
    '/assets/icons/',
    '/assets/images/',
    '/assets/screenshots/'
];

/**
 * Install event - Cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('📦 Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            
            // Cache API endpoints
            caches.open(API_CACHE).then((cache) => {
                console.log('🌐 Pre-caching API endpoints');
                return Promise.all(
                    API_ENDPOINTS.map(async (endpoint) => {
                        try {
                            const response = await fetch(endpoint);
                            if (response.ok) {
                                return cache.put(endpoint, response);
                            }
                        } catch (error) {
                            console.warn(`⚠️ Failed to cache ${endpoint}:`, error);
                        }
                    })
                );
            })
        ]).then(() => {
            console.log('✅ Service Worker installation complete');
            // Force activation
            return self.skipWaiting();
        })
    );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== API_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Take control of all pages
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker activation complete');
        })
    );
});

/**
 * Fetch event - Implement caching strategies
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and chrome-extension requests
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different types of requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
    } else if (isStaticAsset(url.pathname)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isDynamicAsset(url.pathname)) {
        event.respondWith(handleDynamicAsset(request));
    } else {
        event.respondWith(handlePageRequest(request));
    }
});

/**
 * Handle API requests with network-first strategy
 */
async function handleApiRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Try network first for fresh data
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(API_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
    } catch (error) {
        console.log('🌐 Network failed, checking cache for:', url.pathname);
        
        // Fall back to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for assessments
        if (url.pathname.includes('/assessment/demo')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Offline mode - demo assessment unavailable',
                code: 'OFFLINE_MODE',
                offline: true
            }), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        
        throw error;
    }
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request) {
    try {
        // Check cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fetch from network and cache
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Failed to load static asset:', request.url);
        
        // Return placeholder for images
        if (request.url.includes('.png') || request.url.includes('.jpg') || request.url.includes('.svg')) {
            return new Response('', {
                status: 404,
                statusText: 'Image not available offline'
            });
        }
        
        throw error;
    }
}

/**
 * Handle dynamic assets with stale-while-revalidate strategy
 */
async function handleDynamicAsset(request) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        // Fetch fresh version in background
        const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        }).catch(() => cachedResponse);
        
        // Return cached version immediately if available
        return cachedResponse || await fetchPromise;
    } catch (error) {
        console.error('❌ Failed to load dynamic asset:', request.url);
        throw error;
    }
}

/**
 * Handle page requests
 */
async function handlePageRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful page responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
    } catch (error) {
        // Fall back to cached version
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fall back to cached index.html for SPA routes
        const indexResponse = await caches.match('/index.html');
        if (indexResponse) {
            return indexResponse;
        }
        
        // Last resort - offline page
        const offlineResponse = await caches.match('/offline.html');
        if (offlineResponse) {
            return offlineResponse;
        }
        
        // Return basic offline message
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>TerraFusion Market - Offline</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 50px;
                        background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
                        color: white;
                        margin: 0;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    .offline-icon {
                        font-size: 4rem;
                        margin-bottom: 2rem;
                    }
                    h1 {
                        color: #68d391;
                        margin-bottom: 1rem;
                    }
                    p {
                        font-size: 1.1rem;
                        margin-bottom: 2rem;
                        opacity: 0.9;
                    }
                    .retry-btn {
                        background: #68d391;
                        color: #1a365d;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        font-size: 1rem;
                        cursor: pointer;
                        transition: background 0.3s;
                    }
                    .retry-btn:hover {
                        background: #48bb78;
                    }
                </style>
            </head>
            <body>
                <div class="offline-icon">🌐</div>
                <h1>You're Offline</h1>
                <p>TerraFusion Market is not available right now.<br>
                   Please check your connection and try again.</p>
                <button class="retry-btn" onclick="window.location.reload()">
                    Try Again
                </button>
            </body>
            </html>
        `, {
            status: 200,
            headers: {
                'Content-Type': 'text/html'
            }
        });
    }
}

/**
 * Handle background sync for offline actions
 */
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-assessments') {
        event.waitUntil(syncPendingAssessments());
    } else if (event.tag === 'sync-contact-forms') {
        event.waitUntil(syncPendingContactForms());
    }
});

/**
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
    console.log('📱 Push notification received');
    
    const options = {
        body: 'Your property assessment is ready!',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/badge-72.png',
        vibrate: [200, 100, 200],
        tag: 'assessment-ready',
        actions: [
            {
                action: 'view',
                title: 'View Assessment',
                icon: '/assets/icons/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/assets/icons/action-dismiss.png'
            }
        ],
        data: {
            url: '/portal/assessments'
        }
    };
    
    if (event.data) {
        const data = event.data.json();
        options.body = data.body || options.body;
        options.data = { ...options.data, ...data };
    }
    
    event.waitUntil(
        self.registration.showNotification('TerraFusion Market', options)
    );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        const url = event.notification.data.url || '/';
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(url) && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
        );
    }
});

/**
 * Handle messages from main thread
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(cacheUrls(event.data.urls));
    }
});

/**
 * Utility functions
 */
function isStaticAsset(pathname) {
    return STATIC_ASSETS.some(asset => pathname === asset) ||
           pathname.endsWith('.css') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.json') ||
           pathname.endsWith('.ico') ||
           pathname.endsWith('.svg');
}

function isDynamicAsset(pathname) {
    return DYNAMIC_ASSETS.some(pattern => pathname.startsWith(pattern)) ||
           pathname.includes('/assets/') ||
           pathname.endsWith('.png') ||
           pathname.endsWith('.jpg') ||
           pathname.endsWith('.jpeg') ||
           pathname.endsWith('.webp');
}

async function syncPendingAssessments() {
    try {
        // Get pending assessments from IndexedDB
        const pendingAssessments = await getPendingAssessments();
        
        for (const assessment of pendingAssessments) {
            try {
                const response = await fetch('/api/assessment/demo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(assessment.data)
                });
                
                if (response.ok) {
                    await removePendingAssessment(assessment.id);
                    console.log('✅ Synced pending assessment:', assessment.id);
                }
            } catch (error) {
                console.error('❌ Failed to sync assessment:', error);
            }
        }
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

async function syncPendingContactForms() {
    try {
        // Similar implementation for contact forms
        console.log('🔄 Syncing pending contact forms...');
    } catch (error) {
        console.error('❌ Contact form sync failed:', error);
    }
}

async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    return Promise.all(
        urls.map(async (url) => {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    return cache.put(url, response);
                }
            } catch (error) {
                console.warn('⚠️ Failed to cache URL:', url);
            }
        })
    );
}

// IndexedDB helpers for offline storage
async function getPendingAssessments() {
    // Placeholder - implement IndexedDB operations
    return [];
}

async function removePendingAssessment(id) {
    // Placeholder - implement IndexedDB operations
    console.log('Removing pending assessment:', id);
}

console.log('🚀 TerraFusion Market Service Worker loaded');