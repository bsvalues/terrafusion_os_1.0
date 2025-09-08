/**
 * Cache Service for TerraAgent MCP Server
 * Handles caching of tool results for improved performance
 */

import * as crypto from 'crypto';
import { CacheConfig } from '../types/mcp-types.js';

export class CacheService {
  private memoryCache: Map<string, CacheEntry>;
  private maxMemoryMB: number;
  private currentMemoryMB: number;

  constructor(maxMemoryMB: number = 100) {
    this.memoryCache = new Map();
    this.maxMemoryMB = maxMemoryMB;
    this.currentMemoryMB = 0;
  }

  /**
   * Generate cache key for tool and arguments
   */
  public generateCacheKey(toolName: string, args: any): string {
    const argsString = JSON.stringify(args, Object.keys(args).sort());
    const hash = crypto.createHash('sha256').update(`${toolName}:${argsString}`).digest('hex');
    return `${toolName}:${hash.substring(0, 16)}`;
  }

  /**
   * Get cached result
   */
  public async get(key: string): Promise<any | null> {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      this.currentMemoryMB -= entry.sizeMB;
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = Date.now();
    
    return entry.data;
  }

  /**
   * Set cache entry
   */
  public async set(key: string, data: any, config?: CacheConfig): Promise<void> {
    const cacheConfig = {
      ttlSeconds: 300,
      enabled: true,
      ...config,
    };

    if (!cacheConfig.enabled) {
      return;
    }

    const serializedData = JSON.stringify(data);
    const sizeMB = Buffer.byteLength(serializedData, 'utf8') / (1024 * 1024);

    // Check if data is too large
    if (sizeMB > this.maxMemoryMB / 2) {
      console.warn(`Cache entry too large (${sizeMB.toFixed(2)}MB), skipping cache`);
      return;
    }

    // Ensure we have space
    await this.ensureSpace(sizeMB);

    const entry: CacheEntry = {
      data,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + (cacheConfig.ttlSeconds * 1000),
      sizeMB,
      tags: cacheConfig.tags || [],
    };

    this.memoryCache.set(key, entry);
    this.currentMemoryMB += sizeMB;
  }

  /**
   * Ensure sufficient cache space
   */
  private async ensureSpace(requiredMB: number): Promise<void> {
    // If we have enough space, return
    if (this.currentMemoryMB + requiredMB <= this.maxMemoryMB) {
      return;
    }

    // Collect entries with access times for LRU eviction
    const entries = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    // Remove least recently used entries until we have enough space
    for (const { key, entry } of entries) {
      this.memoryCache.delete(key);
      this.currentMemoryMB -= entry.sizeMB;

      if (this.currentMemoryMB + requiredMB <= this.maxMemoryMB) {
        break;
      }
    }
  }

  /**
   * Clear cache by tags
   */
  public async clearByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      const hasTag = entry.tags.some(tag => tags.includes(tag));
      if (hasTag) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        this.memoryCache.delete(key);
        this.currentMemoryMB -= entry.sizeMB;
      }
    }
  }

  /**
   * Clear all cache
   */
  public async clear(): Promise<void> {
    this.memoryCache.clear();
    this.currentMemoryMB = 0;
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const now = Date.now();
    let expiredCount = 0;

    for (const entry of this.memoryCache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    }

    return {
      totalEntries: this.memoryCache.size,
      expiredEntries: expiredCount,
      currentMemoryMB: this.currentMemoryMB,
      maxMemoryMB: this.maxMemoryMB,
      memoryUsagePercent: (this.currentMemoryMB / this.maxMemoryMB) * 100,
    };
  }

  /**
   * Cleanup expired entries
   */
  public async cleanup(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        this.memoryCache.delete(key);
        this.currentMemoryMB -= entry.sizeMB;
      }
    }
  }

  /**
   * Disconnect cache (cleanup)
   */
  public disconnect(): void {
    this.memoryCache.clear();
    this.currentMemoryMB = 0;
  }
}

interface CacheEntry {
  data: any;
  createdAt: number;
  lastAccessed: number;
  expiresAt: number;
  sizeMB: number;
  tags: string[];
}

interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  currentMemoryMB: number;
  maxMemoryMB: number;
  memoryUsagePercent: number;
}
