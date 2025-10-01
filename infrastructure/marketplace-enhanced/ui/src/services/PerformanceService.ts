/**
 * Terrafusion Performance Optimization Service
 * Provides caching, lazy loading, and real-time updates for government marketplace
 * Optimized for large-scale multi-county deployments
 */

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache entries
  strategy: 'lru' | 'fifo' | 'ttl';
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  activeConnections: number;
  lastUpdated: string;
}

export interface LazyLoadConfig {
  threshold: number; // Pixels from viewport
  rootMargin: string;
  debounceMs: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

class PerformanceService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private cacheConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxSize: 1000,
    strategy: 'lru',
  };

  private observers: Map<string, IntersectionObserver> = new Map();
  private lazyLoadConfig: LazyLoadConfig = {
    threshold: 0.1,
    rootMargin: '50px',
    debounceMs: 100,
  };

  private websocket: WebSocket | null = null;
  private wsConfig: WebSocketConfig = {
    url: 'ws://localhost:\${{TF_FRONTEND_PORT:-3000}}/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
  };
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  private eventListeners: Map<string, Set<Function>> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    cacheHitRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    activeConnections: 0,
    lastUpdated: new Date().toISOString(),
  };

  constructor() {
    this.initializeWebSocket();
    this.startPerformanceMonitoring();
  }

  // Cache Management
  setCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }

  setCache(key: string, data: any, ttl?: number): void {
    const actualTtl = ttl || this.cacheConfig.ttl;

    // Enforce cache size limit
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictCache();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTtl,
    });
  }

  getCache(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update cache hit rate
    this.updateCacheHitRate(true);
    return entry.data;
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  private evictCache(): void {
    if (this.cacheConfig.strategy === 'lru') {
      // Remove least recently used (first entry in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    } else if (this.cacheConfig.strategy === 'ttl') {
      // Remove expired entries first
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
          break;
        }
      }
    }
  }

  // Lazy Loading
  createLazyLoader(callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver {
    const observer = new IntersectionObserver(
      this.debounce(callback, this.lazyLoadConfig.debounceMs),
      {
        threshold: this.lazyLoadConfig.threshold,
        rootMargin: this.lazyLoadConfig.rootMargin,
      }
    );

    return observer;
  }

  observeElement(element: Element, callback: (entry: IntersectionObserverEntry) => void): void {
    const observerId = `observer-${Date.now()}-${Math.random()}`;

    const observer = this.createLazyLoader(entries => {
      entries.forEach(callback);
    });

    observer.observe(element);
    this.observers.set(observerId, observer);

    // Clean up observer when element is removed
    const cleanupObserver = () => {
      observer.disconnect();
      this.observers.delete(observerId);
    };

    // Store cleanup function on element for later use
    (element as any).__tfCleanup = cleanupObserver;
  }

  unobserveElement(element: Element): void {
    if ((element as any).__tfCleanup) {
      (element as any).__tfCleanup();
      delete (element as any).__tfCleanup;
    }
  }

  // WebSocket Real-time Updates
  private initializeWebSocket(): void {
    try {
      this.websocket = new WebSocket(this.wsConfig.url);

      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected', {});
      };

      this.websocket.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        this.stopHeartbeat();
        this.emit('disconnected', {});
        this.attemptReconnect();
      };

      this.websocket.onerror = error => {
        console.error('WebSocket error:', error);
        this.emit('error', { error });
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'validation_update':
        this.clearCache('validation-*');
        this.emit('validation_update', message.data);
        break;

      case 'deployment_status':
        this.clearCache('deployment-*');
        this.emit('deployment_status', message.data);
        break;

      case 'compliance_alert':
        this.emit('compliance_alert', message.data);
        break;

      case 'audit_event':
        this.clearCache('audit-*');
        this.emit('audit_event', message.data);
        break;

      case 'performance_metrics':
        this.performanceMetrics = { ...this.performanceMetrics, ...message.data };
        this.emit('performance_update', this.performanceMetrics);
        break;

      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.wsConfig.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.wsConfig.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.initializeWebSocket();
    }, this.wsConfig.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.wsConfig.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  sendWebSocketMessage(type: string, data: any): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket not connected, message not sent:', { type, data });
    }
  }

  // Event System
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  // Performance Monitoring
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 30000); // Update every 30 seconds
  }

  private updatePerformanceMetrics(): void {
    this.performanceMetrics = {
      ...this.performanceMetrics,
      memoryUsage: this.getMemoryUsage(),
      activeConnections: this.websocket?.readyState === WebSocket.OPEN ? 1 : 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  private updateCacheHitRate(hit: boolean): void {
    // Simple moving average for cache hit rate
    const currentRate = this.performanceMetrics.cacheHitRate;
    const newRate = hit ? Math.min(currentRate + 0.1, 1) : Math.max(currentRate - 0.1, 0);
    this.performanceMetrics.cacheHitRate = newRate;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Utility Methods
  private debounce(func: Function, wait: number): Function {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Prefetching
  async prefetchData(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async key => {
      if (!this.getCache(key)) {
        try {
          const data = await fetcher(key);
          this.setCache(key, data);
        } catch (error) {
          console.warn(`Failed to prefetch data for key: ${key}`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  // Batch Operations
  async batchRequest<T>(
    requests: Array<{ key: string; fetcher: () => Promise<T> }>,
    options: { maxConcurrency?: number; timeout?: number } = {}
  ): Promise<Array<{ key: string; data: T | null; error?: Error }>> {
    const { maxConcurrency = 5, timeout = 10000 } = options;
    const results: Array<{ key: string; data: T | null; error?: Error }> = [];

    // Process requests in batches
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);

      const batchPromises = batch.map(async ({ key, fetcher }) => {
        try {
          // Check cache first
          const cached = this.getCache(key);
          if (cached) {
            return { key, data: cached };
          }

          // Fetch with timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeout);
          });

          const data = await Promise.race([fetcher(), timeoutPromise]);
          this.setCache(key, data);

          return { key, data };
        } catch (error) {
          return { key, data: null, error: error as Error };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            key: 'unknown',
            data: null,
            error: new Error(result.reason),
          });
        }
      });
    }

    return results;
  }

  // Cleanup
  destroy(): void {
    // Clear cache
    this.cache.clear();

    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Close WebSocket
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    // Stop heartbeat
    this.stopHeartbeat();

    // Clear event listeners
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
export default PerformanceService;
