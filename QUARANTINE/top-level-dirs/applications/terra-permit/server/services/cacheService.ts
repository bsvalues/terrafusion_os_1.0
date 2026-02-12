import { EventEmitter } from 'events';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  memoryUsage: number;
  hitRate: number;
}

export class IntelligentCacheService extends EventEmitter {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    memoryUsage: 0,
    hitRate: 0
  };
  private cleanupTimer: NodeJS.Timeout | null = null;
  private maxSize: number = 10000;
  private defaultTTL: number = 300000; // 5 minutes

  constructor(maxSize: number = 10000, defaultTTL: number = 300000) {
    super();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.startCleanupTimer();
    console.log('[CacheService] Intelligent cache service initialized');
  }

  set<T>(key: string, value: T, ttl?: number, tags: string[] = []): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt,
      accessCount: 0,
      lastAccessed: now,
      tags
    };

    this.cache.set(key, entry);
    this.updateStats();
    
    console.log(`[CacheService] Cached entry: ${key} (TTL: ${ttl || this.defaultTTL}ms)`);
    this.emit('cache_set', { key, size: this.cache.size });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      console.log(`[CacheService] Expired entry removed: ${key}`);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.stats.hits++;
    this.updateHitRate();
    
    return entry.value as T;
  }

  // Smart caching for county compliance templates
  async getComplianceTemplate(countyType: string, level: string): Promise<any> {
    const key = `compliance:${countyType}:${level}`;
    const cached = this.get(key);
    
    if (cached) {
      console.log(`[CacheService] Compliance template cache hit: ${key}`);
      return cached;
    }

    // Generate compliance template (this would normally fetch from database)
    const template = {
      countyType,
      level,
      requirements: [
        'Data encryption at rest and in transit',
        'Multi-factor authentication required',
        'Audit logging enabled',
        'Regular security assessments'
      ],
      policies: {
        passwordPolicy: { minLength: 12, complexity: true },
        sessionTimeout: level === 'CJIS-4' ? 15 : 30,
        auditRetention: 365
      },
      generatedAt: new Date()
    };

    // Cache for 1 hour with relevant tags
    this.set(key, template, 3600000, ['compliance', countyType, level]);
    console.log(`[CacheService] Generated and cached compliance template: ${key}`);
    
    return template;
  }

  // Smart caching for AI classification results
  async getAIClassification(permitData: any): Promise<any> {
    // Create a hash of the permit data for caching
    const dataHash = this.hashPermitData(permitData);
    const key = `ai_classification:${dataHash}`;
    const cached = this.get(key);
    
    if (cached) {
      console.log(`[CacheService] AI classification cache hit: ${key}`);
      return { ...cached, fromCache: true };
    }

    // Simulate AI classification (this would call actual AI service)
    const classification = {
      permitType: permitData.type || 'Building',
      category: 'Commercial',
      complexity: 'Medium',
      estimatedProcessingTime: 72, // hours
      requiredDocuments: ['Plans', 'Environmental Impact', 'Zoning Approval'],
      confidence: 0.89,
      classifiedAt: new Date(),
      dataHash
    };

    // Cache AI results for 24 hours with permit-specific tags
    this.set(key, classification, 86400000, ['ai_classification', permitData.type]);
    console.log(`[CacheService] Generated and cached AI classification: ${key}`);
    
    return classification;
  }

  // Cache security policies with smart invalidation
  async getSecurityPolicies(countyId: string): Promise<any> {
    const key = `security_policies:${countyId}`;
    const cached = this.get(key);
    
    if (cached) {
      console.log(`[CacheService] Security policies cache hit: ${key}`);
      return cached;
    }

    const policies = {
      countyId,
      firewall: {
        allowedPorts: [443, 3003],
        blockedProtocols: ['SMBv1', 'Telnet']
      },
      encryption: {
        algorithm: 'AES-256-GCM',
        keyRotation: 'quarterly'
      },
      authentication: {
        mfa: true,
        sessionTimeout: 900,
        passwordPolicy: {
          minLength: 12,
          requireSpecialChars: true
        }
      },
      audit: {
        logLevel: 'detailed',
        retention: 365,
        realTimeMonitoring: true
      },
      lastUpdated: new Date()
    };

    // Cache security policies for 2 hours
    this.set(key, policies, 7200000, ['security', 'policies', countyId]);
    console.log(`[CacheService] Generated and cached security policies: ${key}`);
    
    return policies;
  }

  // Invalidate cache entries by tags
  invalidateByTag(tag: string): number {
    let invalidated = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    this.updateStats();
    console.log(`[CacheService] Invalidated ${invalidated} entries with tag: ${tag}`);
    this.emit('cache_invalidated', { tag, count: invalidated });
    
    return invalidated;
  }

  // Smart cache warming for frequently accessed data
  async warmCache(): Promise<void> {
    console.log('[CacheService] Starting intelligent cache warming...');
    
    // Pre-load common compliance templates
    const commonCountyTypes = ['urban', 'suburban', 'rural'];
    const complianceLevels = ['CJIS-3', 'CJIS-4', 'CJIS-5'];
    
    for (const countyType of commonCountyTypes) {
      for (const level of complianceLevels) {
        await this.getComplianceTemplate(countyType, level);
      }
    }
    
    // Pre-load security policies for active counties
    const activeCounties = ['county_001', 'county_002', 'county_003'];
    for (const countyId of activeCounties) {
      await this.getSecurityPolicies(countyId);
    }
    
    console.log('[CacheService] Cache warming completed');
    this.emit('cache_warmed', { entries: this.cache.size });
  }

  private hashPermitData(data: any): string {
    // Create a simple hash of permit data for caching
    const relevant = {
      type: data.type,
      size: data.size,
      location: data.location,
      category: data.category
    };
    
    return Buffer.from(JSON.stringify(relevant)).toString('base64').slice(0, 16);
  }

  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastUsedScore = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      // Score based on access count and recency
      const recencyScore = Date.now() - entry.lastAccessed;
      const accessScore = 1 / (entry.accessCount + 1);
      const score = recencyScore * accessScore;
      
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      console.log(`[CacheService] Evicted least used entry: ${leastUsedKey}`);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Clean up every minute
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.updateStats();
      console.log(`[CacheService] Cleaned up ${cleaned} expired entries`);
      this.emit('cache_cleaned', { cleaned });
    }
  }

  private updateStats(): void {
    this.stats.entries = this.cache.size;
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry.value).length * 2; // Rough UTF-16 size
    }
    this.stats.memoryUsage = memoryUsage;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      memoryUsage: 0,
      hitRate: 0
    };
    console.log('[CacheService] Cache cleared');
    this.emit('cache_cleared');
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    console.log('[CacheService] Cache service stopped');
  }
}

// Export singleton instance
export const cacheService = new IntelligentCacheService();