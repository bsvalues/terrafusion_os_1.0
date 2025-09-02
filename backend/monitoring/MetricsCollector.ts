/**
 * 📈 Terrafusion OS 1.0 - Metrics Collector
 * Advanced performance monitoring for AI swarm operations
 */

export interface MetricEntry {
  timestamp: Date;
  metricName: string;
  value: number;
  tags: Record<string, string>;
  agentId?: string;
}

export interface PerformanceMetrics {
  successRate: number;
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  quantumCoherence: number;
  consciousnessLevel: number;
}

export class MetricsCollector {
  private metrics: MetricEntry[] = [];
  private readonly maxMetrics = 10000;

  recordSuccess(agentId: string, responseTime: number): void {
    this.recordMetric('task_success', 1, { agentId, status: 'success' });
    this.recordMetric('response_time', responseTime, { agentId });
  }

  recordFailure(agentId: string, error: Error): void {
    this.recordMetric('task_failure', 1, { agentId, status: 'failure', error: error.name });
  }

  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const entry: MetricEntry = {
      timestamp: new Date(),
      metricName: name,
      value,
      tags
    };

    this.metrics.push(entry);

    // Keep metrics buffer manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2);
    }
  }

  getMetrics(metricName?: string, timeWindow?: number): MetricEntry[] {
    let filtered = this.metrics;

    if (metricName) {
      filtered = filtered.filter(m => m.metricName === metricName);
    }

    if (timeWindow) {
      const cutoff = new Date(Date.now() - timeWindow);
      filtered = filtered.filter(m => m.timestamp >= cutoff);
    }

    return filtered;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const recentMetrics = this.getMetrics(undefined, 300000); // Last 5 minutes
    
    const successes = recentMetrics.filter(m => m.metricName === 'task_success').length;
    const failures = recentMetrics.filter(m => m.metricName === 'task_failure').length;
    const total = successes + failures;
    
    const responseTimes = recentMetrics
      .filter(m => m.metricName === 'response_time')
      .map(m => m.value);
    
    return {
      successRate: total > 0 ? successes / total : 1.0,
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0,
      throughput: total / 5, // Tasks per minute
      errorRate: total > 0 ? failures / total : 0,
      quantumCoherence: 0.98, // Simulated
      consciousnessLevel: 7.5  // Simulated
    };
  }
}

export default MetricsCollector;
