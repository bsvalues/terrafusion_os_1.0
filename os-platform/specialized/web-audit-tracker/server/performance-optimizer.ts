import { storage } from './storage';

interface PerformanceMetrics {
  queryExecutionTime: number;
  cacheHitRate: number;
  activeConnections: number;
  memoryUsage: number;
  requestsPerSecond: number;
  errorRate: number;
}

interface OptimizationRecommendation {
  id: string;
  type: 'query' | 'cache' | 'index' | 'connection_pool' | 'memory';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  estimatedGain: string;
  implementation: string[];
  priority: number;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    queryExecutionTime: 0,
    cacheHitRate: 0,
    activeConnections: 0,
    memoryUsage: 0,
    requestsPerSecond: 0,
    errorRate: 0,
  };

  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private cacheStats = { hits: 0, misses: 0 };

  /**
   * Enhanced query execution with caching and performance monitoring
   */
  async optimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: { ttl?: number; useCache?: boolean } = {}
  ): Promise<T> {
    const { ttl = 300000, useCache = true } = options; // Default 5 minutes TTL
    const startTime = Date.now();

    // Check cache first
    if (useCache && this.queryCache.has(queryKey)) {
      const cached = this.queryCache.get(queryKey)!;
      if (Date.now() - cached.timestamp < cached.ttl) {
        this.cacheStats.hits++;
        this.updateMetrics('cacheHit', Date.now() - startTime);
        return cached.data;
      } else {
        this.queryCache.delete(queryKey);
      }
    }

    // Execute query
    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;

      // Cache the result
      if (useCache) {
        this.queryCache.set(queryKey, {
          data: result,
          timestamp: Date.now(),
          ttl,
        });
        this.cacheStats.misses++;
      }

      this.updateMetrics('queryExecution', executionTime);
      return result;
    } catch (error) {
      this.updateMetrics('error', Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Get optimized audit data with intelligent caching
   */
  async getOptimizedAudits() {
    return this.optimizedQuery(
      'all_audits',
      async () => {
        return await storage.getAudits();
      },
      { ttl: 60000 }
    ); // 1 minute cache for audit data
  }

  /**
   * Get optimized analytics with aggressive caching
   */
  async getOptimizedAnalytics() {
    return this.optimizedQuery(
      'analytics_data',
      async () => {
        const audits = await this.getOptimizedAudits();

        return {
          pendingCount: audits.filter(a => a.status === 'pending').length,
          inProgressCount: audits.filter(a => a.status === 'in_progress').length,
          approvedCount: audits.filter(a => a.status === 'approved').length,
          rejectedCount: audits.filter(a => a.status === 'rejected').length,
          totalCount: audits.length,
          averageProcessingTime: this.calculateAverageProcessingTime(audits),
          highPriorityCount: audits.filter(a => ['high', 'urgent'].includes(a.priority || ''))
            .length,
        };
      },
      { ttl: 30000 }
    ); // 30 seconds cache for analytics
  }

  /**
   * Batch operation optimization for bulk updates
   */
  async batchUpdateAudits(updates: Array<{ id: number; data: Partial<any> }>) {
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < updates.length; i += batchSize) {
      batches.push(updates.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      const batchPromises = batch.map(update => storage.updateAudit(update.id, update.data));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Invalidate relevant caches
    this.invalidateCache(['all_audits', 'analytics_data']);

    return results;
  }

  /**
   * Intelligent preloading based on user patterns
   */
  async preloadCriticalData() {
    const preloadTasks = [
      this.getOptimizedAudits(),
      this.getOptimizedAnalytics(),
      this.optimizedQuery('recent_events', () => storage.getRecentAuditEvents(20), { ttl: 15000 }),
    ];

    await Promise.all(preloadTasks);
  }

  /**
   * Analyze current performance and generate optimization recommendations
   */
  generateOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Query performance analysis
    if (this.metrics.queryExecutionTime > 1000) {
      recommendations.push({
        id: 'slow-queries',
        type: 'query',
        title: 'Optimize Slow Database Queries',
        description: `Average query execution time is ${this.metrics.queryExecutionTime}ms. Consider query optimization and indexing.`,
        impact: 'high',
        estimatedGain: '40-60% faster queries',
        implementation: [
          'Add database indexes on frequently queried columns',
          'Optimize complex JOIN operations',
          'Implement query result pagination',
          'Use database query explain plans for optimization',
        ],
        priority: 1,
      });
    }

    // Cache hit rate analysis
    const cacheHitRate =
      (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100;
    if (cacheHitRate < 70) {
      recommendations.push({
        id: 'cache-optimization',
        type: 'cache',
        title: 'Improve Cache Hit Rate',
        description: `Current cache hit rate is ${cacheHitRate.toFixed(1)}%. Optimize caching strategy for better performance.`,
        impact: 'medium',
        estimatedGain: '20-30% faster response times',
        implementation: [
          'Increase cache TTL for stable data',
          'Implement intelligent cache warming',
          'Add cache invalidation strategies',
          'Use Redis for distributed caching',
        ],
        priority: 2,
      });
    }

    // Memory usage analysis
    if (this.metrics.memoryUsage > 80) {
      recommendations.push({
        id: 'memory-optimization',
        type: 'memory',
        title: 'Optimize Memory Usage',
        description: `Memory usage is at ${this.metrics.memoryUsage}%. Implement memory optimization strategies.`,
        impact: 'critical',
        estimatedGain: '50% reduction in memory usage',
        implementation: [
          'Implement object pooling for frequently created objects',
          'Optimize data structures and algorithms',
          'Add garbage collection tuning',
          'Implement data streaming for large datasets',
        ],
        priority: 1,
      });
    }

    // Connection pool optimization
    if (this.metrics.activeConnections > 50) {
      recommendations.push({
        id: 'connection-pool',
        type: 'connection_pool',
        title: 'Optimize Database Connection Pool',
        description: `${this.metrics.activeConnections} active connections detected. Optimize connection pooling.`,
        impact: 'medium',
        estimatedGain: '25% better resource utilization',
        implementation: [
          'Configure optimal connection pool size',
          'Implement connection pooling best practices',
          'Add connection monitoring and alerting',
          'Optimize connection lifecycle management',
        ],
        priority: 3,
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics & { cacheHitRate: number } {
    const cacheHitRate =
      this.cacheStats.hits + this.cacheStats.misses > 0
        ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100
        : 0;

    return {
      ...this.metrics,
      cacheHitRate,
    };
  }

  /**
   * Update internal metrics
   */
  private updateMetrics(type: string, value: number) {
    switch (type) {
      case 'queryExecution':
        this.metrics.queryExecutionTime = (this.metrics.queryExecutionTime + value) / 2; // Moving average
        break;
      case 'cacheHit':
        // Cache hit recorded separately
        break;
      case 'error':
        this.metrics.errorRate++;
        break;
    }
  }

  /**
   * Clear cache entries
   */
  private invalidateCache(keys: string[]) {
    keys.forEach(key => {
      this.queryCache.delete(key);
    });
  }

  /**
   * Calculate average processing time for audits
   */
  private calculateAverageProcessingTime(audits: any[]): number {
    const completedAudits = audits.filter(
      a => a.status === 'approved' && a.submittedAt && a.updatedAt
    );

    if (completedAudits.length === 0) return 0;

    const totalTime = completedAudits.reduce((sum, audit) => {
      const start = new Date(audit.submittedAt).getTime();
      const end = new Date(audit.updatedAt).getTime();
      return sum + (end - start);
    }, 0);

    return totalTime / completedAudits.length / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, cached] of this.queryCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.queryCache.delete(key);
      }
    }
  }
}

export const performanceOptimizer = new PerformanceOptimizer();

// Cleanup cache every 5 minutes
setInterval(() => {
  performanceOptimizer.cleanupCache();
}, 300000);
