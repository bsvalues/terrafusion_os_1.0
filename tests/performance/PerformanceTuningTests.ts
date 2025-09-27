// NO HARDCODED PORTS! Use environment variables.
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';
import { performance } from 'perf_hooks';

/**
 * PHASE 6 Week 10: Performance Tuning Tests
 * Government-scale workload optimization and benchmarking
 */

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  concurrentUsers: number;
  errorRate: number;
  quantumSpeedup: number;
  aiProcessingTime: number;
}

interface LoadTestConfig {
  baseUrl: string;
  maxConcurrentUsers: number;
  testDuration: number;
  rampUpTime: number;
  endpoints: string[];
}

class PerformanceTuner {
  private config: LoadTestConfig;
  private metrics: PerformanceMetrics[] = [];
  private activeRequests: Set<Promise<any>> = new Set();

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  async runLoadTest(): Promise<PerformanceMetrics> {
    console.log(`Starting load test with ${this.config.maxConcurrentUsers} concurrent users`);

    const startTime = performance.now();
    const promises: Promise<any>[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Ramp up users gradually
    for (let i = 0; i < this.config.maxConcurrentUsers; i++) {
      const delay = (i / this.config.maxConcurrentUsers) * this.config.rampUpTime;

      const userPromise = new Promise(resolve => {
        setTimeout(async () => {
          try {
            await this.simulateUserSession();
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`User session error:`, error);
          }
          resolve(null);
        }, delay);
      });

      promises.push(userPromise);
    }

    // Wait for all users to complete
    await Promise.all(promises);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    return {
      responseTime: totalTime / this.config.maxConcurrentUsers,
      throughput: (successCount / totalTime) * 1000, // requests per second
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: 0, // Would need system monitoring
      concurrentUsers: this.config.maxConcurrentUsers,
      errorRate: (errorCount / (successCount + errorCount)) * 100,
      quantumSpeedup: await this.measureQuantumSpeedup(),
      aiProcessingTime: await this.measureAIProcessingTime(),
    };
  }

  private async simulateUserSession(): Promise<void> {
    const sessionDuration = Math.random() * this.config.testDuration + 1000;
    const sessionStart = performance.now();

    while (performance.now() - sessionStart < sessionDuration) {
      // Random endpoint selection
      const endpoint =
        this.config.endpoints[Math.floor(Math.random() * this.config.endpoints.length)];

      try {
        const response = await axios.get(`${this.config.baseUrl}${endpoint}`, {
          timeout: 30000,
        });

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Simulate user think time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      } catch (error) {
        throw error;
      }
    }
  }

  private async measureQuantumSpeedup(): Promise<number> {
    const classicalStart = performance.now();

    // Simulate classical processing
    await axios.post(`${this.config.baseUrl}/api/performance/classical-benchmark`, {
      complexity: 'high',
      iterations: 1000,
    });

    const classicalTime = performance.now() - classicalStart;

    const quantumStart = performance.now();

    // Simulate quantum-enhanced processing
    await axios.post(`${this.config.baseUrl}/api/performance/quantum-benchmark`, {
      complexity: 'high',
      iterations: 1000,
      quantumEnhanced: true,
    });

    const quantumTime = performance.now() - quantumStart;

    return classicalTime / quantumTime;
  }

  private async measureAIProcessingTime(): Promise<number> {
    const start = performance.now();

    await axios.post(`${this.config.baseUrl}/api/ai/swarm-optimization`, {
      jurisdiction: 'test-county',
      agentCount: 1000,
      optimizationTarget: 'revenue',
    });

    return performance.now() - start;
  }

  async optimizeDatabaseQueries(): Promise<void> {
    // Test current query performance
    const slowQueries = await this.identifySlowQueries();

    for (const query of slowQueries) {
      await this.optimizeQuery(query);
    }
  }

  private async identifySlowQueries(): Promise<string[]> {
    const response = await axios.get(`${this.config.baseUrl}/api/performance/slow-queries`);
    return response.data.queries || [];
  }

  private async optimizeQuery(queryId: string): Promise<void> {
    await axios.post(`${this.config.baseUrl}/api/performance/optimize-query`, {
      queryId,
      optimizations: ['indexing', 'caching', 'partitioning'],
    });
  }

  async implementCaching(): Promise<void> {
    // Configure Redis caching for frequently accessed data
    await axios.post(`${this.config.baseUrl}/api/cache/configure`, {
      strategy: 'redis',
      ttl: 3600, // 1 hour
      maxMemory: '2gb',
      evictionPolicy: 'allkeys-lru',
    });

    // Cache frequently accessed endpoints
    const cacheableEndpoints = [
      '/api/properties/search',
      '/api/analytics/dashboard',
      '/api/reports/executive',
      '/api/ai/predictions',
    ];

    for (const endpoint of cacheableEndpoints) {
      await axios.post(`${this.config.baseUrl}/api/cache/enable`, {
        endpoint,
        duration: 1800, // 30 minutes
      });
    }
  }

  async optimizeMemoryUsage(): Promise<void> {
    // Configure garbage collection
    await axios.post(`${this.config.baseUrl}/api/performance/gc-config`, {
      strategy: 'generational',
      heapSize: '8gb',
      gcInterval: 30000,
    });

    // Optimize object pooling
    await axios.post(`${this.config.baseUrl}/api/performance/object-pooling`, {
      enabled: true,
      poolSize: 10000,
    });
  }

  async implementRateLimiting(): Promise<void> {
    // Configure API rate limiting
    await axios.post(`${this.config.baseUrl}/api/security/rate-limit`, {
      windowMs: 900000, // 15 minutes
      max: 1000, // requests per window
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    });
  }

  generatePerformanceReport(): string {
    if (this.metrics.length === 0) {
      return 'No performance metrics available';
    }

    const latest = this.metrics[this.metrics.length - 1];

    return `
# Performance Tuning Report

## Load Test Results
- **Concurrent Users**: ${latest.concurrentUsers}
- **Average Response Time**: ${latest.responseTime.toFixed(2)}ms
- **Throughput**: ${latest.throughput.toFixed(2)} req/sec
- **Error Rate**: ${latest.errorRate.toFixed(2)}%
- **Memory Usage**: ${latest.memoryUsage.toFixed(2)} MB

## Quantum Performance
- **Quantum Speedup**: ${latest.quantumSpeedup.toFixed(2)}x
- **AI Processing Time**: ${latest.aiProcessingTime.toFixed(2)}ms

## Performance Targets
- ✅ Response Time: ${latest.responseTime < 2000 ? 'PASS' : 'FAIL'} (< 2000ms)
- ✅ Throughput: ${latest.throughput > 100 ? 'PASS' : 'FAIL'} (> 100 req/sec)
- ✅ Error Rate: ${latest.errorRate < 1 ? 'PASS' : 'FAIL'} (< 1%)
- ✅ Quantum Speedup: ${latest.quantumSpeedup > 1000 ? 'PASS' : 'FAIL'} (> 1000x)

## Recommendations
${this.generateRecommendations(latest)}
    `;
  }

  private generateRecommendations(metrics: PerformanceMetrics): string {
    const recommendations: string[] = [];

    if (metrics.responseTime > 2000) {
      recommendations.push('- Implement additional caching layers');
      recommendations.push('- Optimize database queries with better indexing');
    }

    if (metrics.throughput < 100) {
      recommendations.push('- Scale horizontally with additional server instances');
      recommendations.push('- Implement connection pooling');
    }

    if (metrics.errorRate > 1) {
      recommendations.push('- Implement circuit breaker pattern');
      recommendations.push('- Add retry logic with exponential backoff');
    }

    if (metrics.memoryUsage > 1000) {
      recommendations.push('- Optimize memory usage with object pooling');
      recommendations.push('- Implement memory leak detection');
    }

    return recommendations.length > 0
      ? recommendations.join('\n')
      : '- System performance is optimal';
  }
}

// Test Suite
describe('Performance Tuning Tests', () => {
  let tuner: PerformanceTuner;

  beforeAll(() => {
    tuner = new PerformanceTuner({
      baseUrl: process.env.TEST_API_URL || 'http://localhost:${TF_STATIC_PORT:-8080}',
      maxConcurrentUsers: 1000,
      testDuration: 60000, // 1 minute
      rampUpTime: 30000, // 30 seconds
      endpoints: [
        '/api/health',
        '/api/properties/search',
        '/api/analytics/dashboard',
        '/api/ai/predictions',
        '/api/reports/executive',
      ],
    });
  });

  test('Load Test - 1000 Concurrent Users', async () => {
    const metrics = await tuner.runLoadTest();

    expect(metrics.concurrentUsers).toBe(1000);
    expect(metrics.responseTime).toBeLessThan(2000); // < 2 seconds
    expect(metrics.throughput).toBeGreaterThan(100); // > 100 req/sec
    expect(metrics.errorRate).toBeLessThan(1); // < 1% error rate
    expect(metrics.quantumSpeedup).toBeGreaterThan(1000); // > 1000x speedup
  }, 120000); // 2 minute timeout

  test('Database Query Optimization', async () => {
    await tuner.optimizeDatabaseQueries();

    // Verify optimization took effect
    const response = await axios.get(
      `${process.env.TEST_API_URL || 'http://localhost:${TF_STATIC_PORT:-8080}'}/api/performance/query-stats`
    );
    expect(response.data.averageQueryTime).toBeLessThan(100); // < 100ms
  });

  test('Redis Caching Implementation', async () => {
    await tuner.implementCaching();

    // Test cache hit
    const response1 = await axios.get(
      `${process.env.TEST_API_URL || 'http://localhost:${TF_STATIC_PORT:-8080}'}/api/properties/search?q=test`
    );
    const response2 = await axios.get(
      `${process.env.TEST_API_URL || 'http://localhost:${TF_STATIC_PORT:-8080}'}/api/properties/search?q=test`
    );

    expect(response1.headers['x-cache']).toBeUndefined();
    expect(response2.headers['x-cache']).toBe('HIT');
  });

  test('Memory Usage Optimization', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    await tuner.optimizeMemoryUsage();

    // Force garbage collection and measure
    if (global.gc) {
      global.gc();
    }

    const optimizedMemory = process.memoryUsage().heapUsed;
    expect(optimizedMemory).toBeLessThanOrEqual(initialMemory);
  });

  test('API Rate Limiting', async () => {
    await tuner.implementRateLimiting();

    // Test rate limiting
    const promises = Array(1100)
      .fill(null)
      .map(() =>
        axios
          .get(`${process.env.TEST_API_URL || 'http://localhost:${TF_STATIC_PORT:-8080}'}/api/health`)
          .catch(error => error.response)
      );

    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('Quantum Performance Validation', async () => {
    const speedup = await tuner['measureQuantumSpeedup']();
    expect(speedup).toBeGreaterThan(1000); // Validate 1000x+ speedup claim
  });

  test('AI Processing Performance', async () => {
    const processingTime = await tuner['measureAIProcessingTime']();
    expect(processingTime).toBeLessThan(5000); // < 5 seconds for AI processing
  });
});

export { PerformanceTuner, PerformanceMetrics, LoadTestConfig };
