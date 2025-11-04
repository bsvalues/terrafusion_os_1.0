/**
 * Cache Service
 *
 * Provides caching functionality for agent responses and LLM calls.
 */

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  /**
   * Cached value
   */
  value: T;

  /**
   * Expiration timestamp
   */
  expires: number;
}

/**
 * Cache service configuration
 */
export interface CacheServiceConfig {
  /**
   * Default time-to-live in milliseconds
   */
  defaultTTL?: number;

  /**
   * Maximum cache size
   */
  maxSize?: number;

  /**
   * Whether to enable the cache
   */
  enabled?: boolean;
}

/**
 * Cache service for storing and retrieving cached values
 */
export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number;
  private maxSize: number;
  private enabled: boolean;

  constructor(config?: CacheServiceConfig) {
    this.defaultTTL = config?.defaultTTL || 5 * 60 * 1000; // Default: 5 minutes
    this.maxSize = config?.maxSize || 1000; // Default: 1000 entries
    this.enabled = config?.enabled !== undefined ? config.enabled : true;
  }

  /**
   * Get a value from the cache
   */
  public get<T>(key: string): T | null {
    if (!this.enabled) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expires) {
      this.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in the cache
   */
  public set<T>(key: string, value: T, ttl?: number): void {
    if (!this.enabled) {
      return;
    }

    // Evict entries if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expires });
  }

  /**
   * Delete a value from the cache
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Check if a key exists in the cache
   */
  public has(key: string): boolean {
    if (!this.enabled) {
      return false;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expires) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Get a cached value or compute and cache if not found
   */
  public async getOrCompute<T>(key: string, computeFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.get<T>(key);

    if (cachedValue !== null) {
      return cachedValue;
    }

    const value = await computeFn();
    this.set(key, value, ttl);

    return value;
  }

  /**
   * Evict the oldest entry from the cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestExpiry = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < oldestExpiry) {
        oldestKey = key;
        oldestExpiry = entry.expires;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
