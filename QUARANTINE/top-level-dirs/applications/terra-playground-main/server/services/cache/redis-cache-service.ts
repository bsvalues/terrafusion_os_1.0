/**
 * Redis Cache Service
 *
 * A scalable caching layer for property data and lookup tables that reduces
 * database load and improves application performance. This service provides:
 *
 * - Tiered caching strategy with in-memory fallbacks
 * - Automatic cache invalidation based on data lineage
 * - Support for complex data structures and JSON objects
 * - Configurable TTL (Time To Live) for different data types
 * - Connection pooling and error handling for Redis operations
 */

import Redis from 'ioredis';
import { logger } from '../../utils/logger';

// Cache key prefixes for different data types
export enum CachePrefix {
  PROPERTY = 'property:',
  PROPERTY_LIST = 'property:list:',
  USE_CODE = 'usecode:',
  GIS_LAYER = 'gislayer:',
  LOOKUP_TABLE = 'lookup:',
  USER = 'user:',
  ETL_JOB = 'etl:job:',
  FTP_DATA = 'ftp:data:',
}

// Default TTL values for different cache categories (in seconds)
export enum CacheTTL {
  SHORT = 60, // 1 minute
  MEDIUM = 300, // 5 minutes
  STANDARD = 1800, // 30 minutes
  LONG = 3600 * 4, // 4 hours
  VERY_LONG = 86400, // 1 day
}

// Configuration options for the Redis cache service
export interface RedisCacheOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  connectionTimeout?: number;
  maxRetriesPerRequest?: number;
  enableOfflineQueue?: boolean;
  enableReadyCheck?: boolean;
  connectTimeout?: number;
}

/**
 * Redis Cache Service implementation
 */
export class RedisCacheService {
  private client: Redis;
  private isConnected: boolean = false;
  private defaultTTL: number = CacheTTL.STANDARD;
  private inMemoryCache: Map<string, { value: any; expiry: number }>;
  private useInMemoryFallback: boolean = true;

  /**
   * Create a new Redis Cache Service
   * @param options Redis connection options
   */
  constructor(options?: RedisCacheOptions) {
    // Default options for Redis connection
    const defaultOptions: RedisCacheOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: 0,
      keyPrefix: 'taxai:',
      connectionTimeout: 10000,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
    };

    // Merge provided options with defaults
    const mergedOptions = {
      ...defaultOptions,
      ...options,
    };

    // Create Redis client
    this.client = new Redis(mergedOptions);

    // Initialize in-memory cache for fallback
    this.inMemoryCache = new Map();

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for Redis client
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected', { component: 'RedisCacheService' });
      this.isConnected = true;
    });

    this.client.on('error', error => {
      logger.error('Redis client error', { component: 'RedisCacheService', error });
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting', { component: 'RedisCacheService' });
    });

    this.client.on('end', () => {
      logger.info('Redis client disconnected', { component: 'RedisCacheService' });
      this.isConnected = false;
    });
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        return this.getFromMemoryCache<T>(key);
      }

      const value = await this.client.get(key);

      if (!value) {
        return null;
      }

      try {
        // Try to parse as JSON
        return JSON.parse(value) as T;
      } catch (e) {
        // Return as is if not JSON
        return value as unknown as T;
      }
    } catch (error) {
      logger.error('Error getting value from Redis cache', {
        component: 'RedisCacheService',
        key,
        error,
      });

      // Fall back to memory cache
      return this.getFromMemoryCache<T>(key);
    }
  }

  /**
   * Get from in-memory cache fallback
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  private getFromMemoryCache<T>(key: string): T | null {
    if (!this.useInMemoryFallback) {
      return null;
    }

    const item = this.inMemoryCache.get(key);

    if (!item) {
      return null;
    }

    const now = Date.now();

    if (item.expiry < now) {
      this.inMemoryCache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   * @returns True if successful
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;

      if (!this.isConnected) {
        return this.setInMemoryCache(key, value, expiry);
      }

      if (expiry) {
        await this.client.setex(key, expiry, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }

      // Also update in-memory cache for fallback
      if (this.useInMemoryFallback) {
        this.setInMemoryCache(key, value, expiry);
      }

      return true;
    } catch (error) {
      logger.error('Error setting value in Redis cache', {
        component: 'RedisCacheService',
        key,
        error,
      });

      // Try to fall back to memory cache
      return this.setInMemoryCache(key, value, ttl || this.defaultTTL);
    }
  }

  /**
   * Set value in memory cache fallback
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   * @returns True if successful
   */
  private setInMemoryCache(key: string, value: any, ttlSeconds: number): boolean {
    if (!this.useInMemoryFallback) {
      return false;
    }

    const expiry = Date.now() + ttlSeconds * 1000;
    this.inMemoryCache.set(key, { value, expiry });
    return true;
  }

  /**
   * Delete value from cache
   * @param key Cache key
   * @returns True if successful
   */
  async delete(key: string): Promise<boolean> {
    try {
      // Remove from in-memory cache
      if (this.useInMemoryFallback) {
        this.inMemoryCache.delete(key);
      }

      if (!this.isConnected) {
        return true;
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Error deleting value from Redis cache', {
        component: 'RedisCacheService',
        key,
        error,
      });
      return false;
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key Cache key
   * @returns True if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      // Check in-memory cache first
      if (this.useInMemoryFallback && this.inMemoryCache.has(key)) {
        const item = this.inMemoryCache.get(key);
        if (item && item.expiry > Date.now()) {
          return true;
        }
      }

      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking if key exists in Redis cache', {
        component: 'RedisCacheService',
        key,
        error,
      });
      return false;
    }
  }

  /**
   * Flush all keys with a specific prefix
   * @param prefix Key prefix to flush
   * @returns Number of keys deleted
   */
  async flushByPrefix(prefix: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return this.flushMemoryCacheByPrefix(prefix);
      }

      // Get all keys with the specified prefix
      const keys = await this.client.keys(`${prefix}*`);

      if (keys.length === 0) {
        return 0;
      }

      // Delete the keys
      const result = await this.client.del(...keys);

      // Also flush from in-memory cache
      if (this.useInMemoryFallback) {
        this.flushMemoryCacheByPrefix(prefix);
      }

      return result;
    } catch (error) {
      logger.error('Error flushing keys by prefix from Redis cache', {
        component: 'RedisCacheService',
        prefix,
        error,
      });

      // Try to flush from in-memory cache
      return this.flushMemoryCacheByPrefix(prefix);
    }
  }

  /**
   * Flush memory cache by prefix
   * @param prefix Key prefix to flush
   * @returns Number of keys deleted
   */
  private flushMemoryCacheByPrefix(prefix: string): number {
    if (!this.useInMemoryFallback) {
      return 0;
    }

    let count = 0;

    for (const key of this.inMemoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.inMemoryCache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Increment a counter
   * @param key Counter key
   * @param value Increment value (default: 1)
   * @returns New counter value
   */
  async increment(key: string, value: number = 1): Promise<number> {
    try {
      if (!this.isConnected) {
        // No reliable way to increment in memory cache
        return 0;
      }

      const result = await this.client.incrby(key, value);
      return result;
    } catch (error) {
      logger.error('Error incrementing counter in Redis cache', {
        component: 'RedisCacheService',
        key,
        value,
        error,
      });
      return 0;
    }
  }

  /**
   * Set expiration for a key
   * @param key Cache key
   * @param ttl Time to live in seconds
   * @returns True if successful
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        // Update expiry in memory cache
        const item = this.inMemoryCache.get(key);
        if (item) {
          item.expiry = Date.now() + ttl * 1000;
          this.inMemoryCache.set(key, item);
          return true;
        }
        return false;
      }

      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Error setting expiration in Redis cache', {
        component: 'RedisCacheService',
        key,
        ttl,
        error,
      });
      return false;
    }
  }

  /**
   * Get multiple values from cache
   * @param keys Array of cache keys
   * @returns Object with key-value pairs
   */
  async mget<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      if (!this.isConnected) {
        return this.mgetFromMemoryCache<T>(keys);
      }

      const values = await this.client.mget(...keys);

      const result: Record<string, T | null> = {};

      for (let i = 0; i < keys.length; i++) {
        const value = values[i];

        if (value === null) {
          result[keys[i]] = null;
          continue;
        }

        try {
          // Try to parse as JSON
          result[keys[i]] = JSON.parse(value) as T;
        } catch (e) {
          // Return as is if not JSON
          result[keys[i]] = value as unknown as T;
        }
      }

      return result;
    } catch (error) {
      logger.error('Error getting multiple values from Redis cache', {
        component: 'RedisCacheService',
        keys,
        error,
      });

      // Fall back to memory cache
      return this.mgetFromMemoryCache<T>(keys);
    }
  }

  /**
   * Get multiple values from memory cache
   * @param keys Array of cache keys
   * @returns Object with key-value pairs
   */
  private mgetFromMemoryCache<T>(keys: string[]): Record<string, T | null> {
    if (!this.useInMemoryFallback) {
      return keys.reduce(
        (acc, key) => {
          acc[key] = null;
          return acc;
        },
        {} as Record<string, T | null>
      );
    }

    const now = Date.now();
    const result: Record<string, T | null> = {};

    for (const key of keys) {
      const item = this.inMemoryCache.get(key);

      if (!item || item.expiry < now) {
        result[key] = null;
        continue;
      }

      result[key] = item.value as T;
    }

    return result;
  }

  /**
   * Set multiple values in cache
   * @param keyValues Object with key-value pairs
   * @param ttl Time to live in seconds (optional)
   * @returns True if successful
   */
  async mset(keyValues: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return this.msetInMemoryCache(keyValues, ttl || this.defaultTTL);
      }

      // Flatten key-values for Redis mset
      const args: string[] = [];

      for (const [key, value] of Object.entries(keyValues)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        args.push(key, stringValue);
      }

      await this.client.mset(...args);

      // Set expiration if provided
      if (ttl) {
        const pipeline = this.client.pipeline();

        for (const key of Object.keys(keyValues)) {
          pipeline.expire(key, ttl);
        }

        await pipeline.exec();
      }

      // Also update in-memory cache for fallback
      if (this.useInMemoryFallback) {
        this.msetInMemoryCache(keyValues, ttl || this.defaultTTL);
      }

      return true;
    } catch (error) {
      logger.error('Error setting multiple values in Redis cache', {
        component: 'RedisCacheService',
        keyCount: Object.keys(keyValues).length,
        error,
      });

      // Try to fall back to memory cache
      return this.msetInMemoryCache(keyValues, ttl || this.defaultTTL);
    }
  }

  /**
   * Set multiple values in memory cache
   * @param keyValues Object with key-value pairs
   * @param ttlSeconds Time to live in seconds
   * @returns True if successful
   */
  private msetInMemoryCache(keyValues: Record<string, any>, ttlSeconds: number): boolean {
    if (!this.useInMemoryFallback) {
      return false;
    }

    const expiry = Date.now() + ttlSeconds * 1000;

    for (const [key, value] of Object.entries(keyValues)) {
      this.inMemoryCache.set(key, { value, expiry });
    }

    return true;
  }

  /**
   * Shutdown the Redis client
   */
  async shutdown(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis client shutdown', { component: 'RedisCacheService' });
    } catch (error) {
      logger.error('Error shutting down Redis client', {
        component: 'RedisCacheService',
        error,
      });
    }
  }
}
