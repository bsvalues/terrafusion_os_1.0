/**
 * ═══════════════════════════════════════════════════════════════
 * TerraFusion System Monitor
 * Source-backed browser/runtime metrics only. Backend/AI/security metrics stay
 * unavailable until a governed telemetry provider supplies them.
 * ═══════════════════════════════════════════════════════════════
 */

export interface EliteSystemMetrics {
  // Performance Metrics
  responseTime: number;
  memoryUsage: number;
  cpuUtilization: number;
  networkLatency: number;
  renderTime: number;

  // Quality Metrics
  codeQualityScore: number;
  testCoverage: number;
  compilationTime: number;
  eslintScore: number;

  // AI Metrics
  aiAccuracy: number;
  mlProcessingTime: number;
  costForgePerformance: number;

  // Government Compliance
  fismaCompliance: boolean;
  accessibilityScore: number;
  securityScore: number;

  // System Health
  serverUptime: number;
  errorRate: number;
  successRate: number;
  quantumOptimization: number;
}

export interface EliteHealthStatus {
  overall: 'UNAVAILABLE' | 'DEGRADED' | 'OPERATIONAL';
  systems: {
    frontend: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE';
    backend: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE';
    database: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE';
    ai: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE';
  };
  alerts: string[];
  recommendations: string[];
}

class EliteSystemMonitor {
  private metrics: EliteSystemMetrics;
  private subscribers: ((metrics: EliteSystemMetrics) => void)[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.metrics = this.getInitialMetrics();
  }

  private getInitialMetrics(): EliteSystemMetrics {
    return {
      responseTime: 0,
      memoryUsage: 0,
      cpuUtilization: 0,
      networkLatency: 0,
      renderTime: 0,
      codeQualityScore: 0,
      testCoverage: 0,
      compilationTime: 0,
      eslintScore: 0,
      aiAccuracy: 0,
      mlProcessingTime: 0,
      costForgePerformance: 0,
      fismaCompliance: false,
      accessibilityScore: 0,
      securityScore: 0,
      serverUptime: 0,
      errorRate: 0,
      successRate: 0,
      quantumOptimization: 0,
    };
  }

  /**
   * Start source-backed monitoring.
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.notifySubscribers();
    }, intervalMs);

  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Update metrics that can be measured locally without fabricating backend state.
   */
  private async updateMetrics(): Promise<void> {
    try {
      // Measure server response time
      const startTime = performance.now();
      await this.pingServer();
      const endTime = performance.now();
      this.metrics.responseTime = endTime - startTime;

      // Update memory usage (if available)
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        this.metrics.memoryUsage = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
      }

      // Calculate render performance
      this.metrics.renderTime = this.calculateRenderTime();

      // Calculate overall system health
      this.calculateSystemHealth();
    } catch (error) {
      console.error('Elite System Monitor: Error updating metrics', error);
      this.metrics.errorRate = Math.min(this.metrics.errorRate + 0.1, 5);
    }
  }

  /**
   * Ping server for response time measurement
   */
  private async pingServer(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      // If /api/health doesn't exist, try the dev server root
      try {
        await fetch('/', { method: 'HEAD', cache: 'no-cache' });
      } catch (fallbackError) {
        throw error;
      }
    }
  }

  /**
   * Calculate render performance using performance API
   */
  private calculateRenderTime(): number {
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      return navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart;
    }
    return this.metrics.renderTime;
  }

  /**
   * Calculate overall system health status
   */
  private calculateSystemHealth(): void {
    if (this.metrics.responseTime > 0) {
      this.metrics.successRate = 100;
      this.metrics.errorRate = 0;
    }
  }

  /**
   * Get current system health status
   */
  getHealthStatus(): EliteHealthStatus {
    const overall = this.calculateOverallStatus();

    return {
      overall,
      systems: {
        frontend:
          this.metrics.responseTime <= 0
            ? 'UNAVAILABLE'
            : this.metrics.responseTime < 250
              ? 'OPERATIONAL'
              : 'DEGRADED',
        backend: this.metrics.successRate > 0 ? 'OPERATIONAL' : 'UNAVAILABLE',
        database: 'UNAVAILABLE',
        ai: 'UNAVAILABLE',
      },
      alerts: this.generateAlerts(),
      recommendations: this.generateRecommendations(),
    };
  }

  private calculateOverallStatus(): 'UNAVAILABLE' | 'DEGRADED' | 'OPERATIONAL' {
    if (this.metrics.successRate <= 0) return 'UNAVAILABLE';
    return this.metrics.responseTime < 250 ? 'OPERATIONAL' : 'DEGRADED';
  }

  private generateAlerts(): string[] {
    const alerts: string[] = [];

    if (this.metrics.responseTime > 200) {
      alerts.push('High response time detected');
    }
    if (this.metrics.errorRate > 2) {
      alerts.push('Elevated error rate');
    }
    if (this.metrics.aiAccuracy <= 0) {
      alerts.push('AI telemetry provider unavailable');
    }

    return alerts;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.responseTime > 100) {
      recommendations.push('Consider implementing performance optimization');
    }
    if (this.metrics.testCoverage <= 0) {
      recommendations.push('Wire governed CI telemetry before displaying coverage');
    }

    return recommendations;
  }

  /**
   * Subscribe to real-time metrics updates
   */
  subscribe(callback: (metrics: EliteSystemMetrics) => void): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of metrics updates
   */
  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Elite System Monitor: Error notifying subscriber', error);
      }
    });
  }

  /**
   * Get current metrics snapshot
   */
  getCurrentMetrics(): EliteSystemMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate performance report.
   */
  generatePerformanceReport(): string {
    const health = this.getHealthStatus();

    return `
TERRAFUSION SYSTEM PERFORMANCE REPORT
═══════════════════════════════════════════════

OVERALL STATUS: ${health.overall}
Response Time: ${this.metrics.responseTime.toFixed(1)}ms
AI Accuracy: ${this.metrics.aiAccuracy > 0 ? `${this.metrics.aiAccuracy.toFixed(1)}%` : 'Unavailable'}
Success Rate: ${this.metrics.successRate > 0 ? `${this.metrics.successRate.toFixed(2)}%` : 'Unavailable'}
Security Score: ${this.metrics.securityScore > 0 ? `${this.metrics.securityScore}%` : 'Unavailable'}
Accessibility: ${this.metrics.accessibilityScore > 0 ? `${this.metrics.accessibilityScore}%` : 'Unavailable'}

GOVERNMENT COMPLIANCE:
FISMA: ${this.metrics.fismaCompliance ? 'COMPLIANT' : 'Unavailable'}
Code Quality: ${this.metrics.codeQualityScore > 0 ? `${this.metrics.codeQualityScore}%` : 'Unavailable'}
Test Coverage: ${this.metrics.testCoverage > 0 ? `${this.metrics.testCoverage}%` : 'Unavailable'}

PRODUCT METRICS:
CostForge Performance: ${this.metrics.costForgePerformance > 0 ? `${this.metrics.costForgePerformance.toFixed(1)}%` : 'Unavailable'}
ML Processing: ${this.metrics.mlProcessingTime > 0 ? `${this.metrics.mlProcessingTime}ms` : 'Unavailable'}
Server Uptime: ${this.metrics.serverUptime > 0 ? `${this.metrics.serverUptime}%` : 'Unavailable'}
    `;
  }
}

// Singleton instance for global use
export const eliteSystemMonitor = new EliteSystemMonitor();

import { getViteEnv } from '@/env/getViteEnv';

// Auto-start monitoring in development
if (getViteEnv().DEV) {
  eliteSystemMonitor.startMonitoring(5000);
}

export default EliteSystemMonitor;
