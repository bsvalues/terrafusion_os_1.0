/**
 * Terrafusion Service Worker
 * Helps maintain WebSocket connections in the Replit environment
 * with persistent reconnection and background syncing
 */

// Cache name for service worker
const CACHE_NAME = "terrafusion-cache-v1";

// Add event listener for the install event
self.addEventListener("install", (event: any) => {
  console.log("[ServiceWorker] Installing...");

  // Skip waiting to activate immediately
  self.skipWaiting();

  // Cache essential resources
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/index.html", "/main.js", "/main.css"]);
    })
  );
});

// Add event listener for the activate event
self.addEventListener("activate", (event: any) => {
  console.log("[ServiceWorker] Activating...");

  // Claim clients to take control immediately
  event.waitUntil(self.clients.claim());

  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Add event listener for the fetch event
self.addEventListener("fetch", (event: any) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  // Skip for WebSocket connections
  if (event.request.url.startsWith("ws:") || event.request.url.startsWith("wss:")) return;

  // Skip API requests
  if (event.request.url.includes("/api/")) return;

  // Network-first strategy for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a clone of the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // If network fetch fails, try to get from cache
        return caches.match(event.request);
      })
  );
});

// Handle WebSocket messages from the client
self.addEventListener("message", (event: any) => {
  if (event.data && event.data.type === "PING") {
    // Respond to ping requests from the client
    event.ports[0].postMessage({ type: "PONG" });
  }

  // Handle WebSocket reconnection requests
  if (event.data && event.data.type === "RECONNECT_WEBSOCKET") {
    const { url, protocols } = event.data;

    // Attempt to establish a WebSocket connection
    console.log("[ServiceWorker] Attempting WebSocket connection to:", url);

    try {
      const socket = new WebSocket(url, protocols);

      socket.onopen = () => {
        console.log("[ServiceWorker] WebSocket connection established");
        event.ports[0].postMessage({
          type: "WEBSOCKET_STATUS",
          status: "connected",
          url,
        });
      };

      socket.onclose = (closeEvent) => {
        console.log(
          "[ServiceWorker] WebSocket connection closed:",
          closeEvent.code,
          closeEvent.reason
        );
        event.ports[0].postMessage({
          type: "WEBSOCKET_STATUS",
          status: "disconnected",
          code: closeEvent.code,
          reason: closeEvent.reason,
          url,
        });
      };

      socket.onerror = (errorEvent) => {
        console.error("[ServiceWorker] WebSocket error");
        event.ports[0].postMessage({
          type: "WEBSOCKET_STATUS",
          status: "error",
          url,
        });
      };

      // We can't keep the socket reference here as the service worker context will be terminated
      // This is just to check if the connection can be established at all
      setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000, "Connection test completed");
        }
      }, 2000);
    } catch (error) {
      console.error("[ServiceWorker] Error creating WebSocket:", error);
      event.ports[0].postMessage({
        type: "WEBSOCKET_STATUS",
        status: "error",
        error: error.message,
        url,
      });
    }
  }
});

// Handle background sync registration
self.addEventListener("sync", (event: any) => {
  if (event.tag === "websocket-reconnect") {
    console.log("[ServiceWorker] Handling background sync for WebSocket reconnection");
    // The actual reconnection is handled by the client when it receives the sync event
  }
});

console.log("[ServiceWorker] Service worker registered");
