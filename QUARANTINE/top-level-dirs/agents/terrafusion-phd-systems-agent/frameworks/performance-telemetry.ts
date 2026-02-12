/**
 * TerraFusion MIT PhD Systems Agent - Performance Telemetry
 * Real-time performance monitoring and metrics collection
 */

import * as fs from 'fs';
import * as path from 'path';

interface PerformanceMetric {
  timestamp: string;
  operation: string;
  duration_ms: number;
  countyId?: string;
  metadata: any;
  success: boolean;
  error?: string;
}

interface PerformanceReport {
  timeframe: {
    start: string;
    end: string;
  };
  operations: {
    [operation: string]: {
      count: number;
      total_duration_ms: number;
      avg_duration_ms: number;
      min_duration_ms: number;
      max_duration_ms: number;
      p50_ms: number;
      p95_ms: number;
      p99_ms: number;
      success_rate: number;
      errors: number;
    };
  };
  overall: {
    total_operations: number;
    total_duration_ms: number;
    avg_duration_ms: number;
    success_rate: number;
  };
}

export class PerformanceTelemetry {
  private metricsPath: string;
  private metrics: PerformanceMetric[];
  private activeOperations: Map<string, { startTime: number; operation: string; metadata: any }>;

  constructor(workspaceRoot: string) {
    this.metricsPath = path.join(
      workspaceRoot,
      'agents/terrafusion-phd-systems-agent/logs/performance'
    );

    if (!fs.existsSync(this.metricsPath)) {
      fs.mkdirSync(this.metricsPath, { recursive: true });
    }

    this.metrics = [];
    this.activeOperations = new Map();
  }

  /**
   * Start tracking an operation
   */
  startOperation(operation: string, metadata: any = {}): string {
    const operationId = this.generateOperationId();
    this.activeOperations.set(operationId, {
      startTime: Date.now(),
      operation,
      metadata
    });
    return operationId;
  }

  /**
   * Complete an operation successfully
   */
  completeOperation(operationId: string, additionalMetadata: any = {}): void {
    const op = this.activeOperations.get(operationId);
    if (!op) {
      console.warn(`Operation ${operationId} not found`);
      return;
    }

    const duration = Date.now() - op.startTime;
    const metric: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      operation: op.operation,
      duration_ms: duration,
      countyId: op.metadata.countyId,
      metadata: { ...op.metadata, ...additionalMetadata },
      success: true
    };

    this.recordMetric(metric);
    this.activeOperations.delete(operationId);
  }

  /**
   * Fail an operation
   */
  failOperation(operationId: string, error: string): void {
    const op = this.activeOperations.get(operationId);
    if (!op) {
      console.warn(`Operation ${operationId} not found`);
      return;
    }

    const duration = Date.now() - op.startTime;
    const metric: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      operation: op.operation,
      duration_ms: duration,
      countyId: op.metadata.countyId,
      metadata: op.metadata,
      success: false,
      error
    };

    this.recordMetric(metric);
    this.activeOperations.delete(operationId);
  }

  /**
   * Record a metric directly
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Write to log file
    const logLine = JSON.stringify(metric) + '\n';
    const logFile = path.join(this.metricsPath, `metrics-${this.getCurrentDate()}.log`);
    fs.appendFileSync(logFile, logLine);

    // Check for performance violations
    this.checkPerformanceThresholds(metric);
  }

  /**
   * Generate performance report
   */
  generateReport(hoursBack: number = 24): PerformanceReport {
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const metrics = this.loadMetrics(startTime);

    const operations: { [key: string]: any } = {};
    let totalOperations = 0;
    let totalDuration = 0;
    let totalSuccess = 0;

    // Group by operation
    const grouped: { [key: string]: PerformanceMetric[] } = {};
    for (const metric of metrics) {
      if (!grouped[metric.operation]) {
        grouped[metric.operation] = [];
      }
      grouped[metric.operation].push(metric);
    }

    // Calculate statistics per operation
    for (const [operation, opMetrics] of Object.entries(grouped)) {
      const durations = opMetrics.map(m => m.duration_ms).sort((a, b) => a - b);
      const successes = opMetrics.filter(m => m.success).length;

      operations[operation] = {
        count: opMetrics.length,
        total_duration_ms: durations.reduce((a, b) => a + b, 0),
        avg_duration_ms: durations.reduce((a, b) => a + b, 0) / durations.length,
        min_duration_ms: Math.min(...durations),
        max_duration_ms: Math.max(...durations),
        p50_ms: this.percentile(durations, 50),
        p95_ms: this.percentile(durations, 95),
        p99_ms: this.percentile(durations, 99),
        success_rate: (successes / opMetrics.length) * 100,
        errors: opMetrics.length - successes
      };

      totalOperations += opMetrics.length;
      totalDuration += operations[operation].total_duration_ms;
      totalSuccess += successes;
    }

    return {
      timeframe: {
        start: startTime.toISOString(),
        end: new Date().toISOString()
      },
      operations,
      overall: {
        total_operations: totalOperations,
        total_duration_ms: totalDuration,
        avg_duration_ms: totalOperations > 0 ? totalDuration / totalOperations : 0,
        success_rate: totalOperations > 0 ? (totalSuccess / totalOperations) * 100 : 0
      }
    };
  }

  /**
   * Print performance report
   */
  printReport(report: PerformanceReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PERFORMANCE TELEMETRY REPORT');
    console.log('='.repeat(80));
    console.log(`Timeframe: ${report.timeframe.start} to ${report.timeframe.end}`);
    console.log(`\nOverall: ${report.overall.total_operations} operations, ${report.overall.avg_duration_ms.toFixed(2)}ms avg, ${report.overall.success_rate.toFixed(2)}% success`);
    console.log('='.repeat(80));

    for (const [operation, stats] of Object.entries(report.operations)) {
      console.log(`\n📈 ${operation}`);
      console.log(`   Count: ${stats.count}`);
      console.log(`   Latency: P50=${stats.p50_ms.toFixed(2)}ms, P95=${stats.p95_ms.toFixed(2)}ms, P99=${stats.p99_ms.toFixed(2)}ms`);
      console.log(`   Range: ${stats.min_duration_ms.toFixed(2)}ms - ${stats.max_duration_ms.toFixed(2)}ms`);
      console.log(`   Success Rate: ${stats.success_rate.toFixed(2)}%`);

      // Check against targets
      if (stats.p95_ms > 10) {
        console.log(`   ⚠️  WARNING: P95 latency ${stats.p95_ms.toFixed(2)}ms exceeds 10ms target`);
      }
      if (stats.success_rate < 99.9) {
        console.log(`   ⚠️  WARNING: Success rate ${stats.success_rate.toFixed(2)}% below 99.9% target`);
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * Check performance against thresholds
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = {
      api_latency_p50: 1,     // 1ms
      api_latency_p95: 10,    // 10ms
      database_query: 100,     // 100ms
      batch_operation: 1000    // 1s
    };

    // Determine threshold based on operation type
    let threshold = thresholds.database_query; // default
    if (metric.operation.includes('API')) {
      threshold = thresholds.api_latency_p95;
    } else if (metric.operation.includes('batch')) {
      threshold = thresholds.batch_operation;
    }

    if (metric.duration_ms > threshold) {
      console.warn(`⚠️  Performance warning: ${metric.operation} took ${metric.duration_ms}ms (threshold: ${threshold}ms)`);
    }
  }

  /**
   * Load metrics from disk
   */
  private loadMetrics(since: Date): PerformanceMetric[] {
    const metrics: PerformanceMetric[] = [];

    if (!fs.existsSync(this.metricsPath)) {
      return metrics;
    }

    const files = fs.readdirSync(this.metricsPath)
      .filter(f => f.startsWith('metrics-') && f.endsWith('.log'))
      .sort()
      .reverse()
      .slice(0, 7); // Last 7 days

    for (const file of files) {
      const filepath = path.join(this.metricsPath, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l.length > 0);

      for (const line of lines) {
        try {
          const metric: PerformanceMetric = JSON.parse(line);
          if (new Date(metric.timestamp) >= since) {
            metrics.push(metric);
          }
        } catch (error) {
          // Skip malformed lines
        }
      }
    }

    return metrics;
  }

  private generateOperationId(): string {
    return `OP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const index = Math.ceil((arr.length * p) / 100) - 1;
    return arr[Math.max(0, index)];
  }
}

export default PerformanceTelemetry;
