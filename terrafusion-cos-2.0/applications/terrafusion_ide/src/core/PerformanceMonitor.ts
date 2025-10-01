export interface PerformanceMetrics {
  apiResponse: number;
  aiResponse: number;
  dbImprovement: number;
  uiResponsiveness: number;
  memoryBaseline: number;
  quantumCoherence: number;
}

export interface PerformanceReport {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  apiLatency: { current: number; target: number };
  aiProcessing: { current: number; target: number };
  databasePerformance: { current: number; target: number };
  quantumOptimization: { current: number; target: number };
  recommendation: string;
  timestamp: Date;
}

export class TerraFusionPerformanceMonitor {
  private readonly targets: PerformanceMetrics;
  private readonly metrics: Map<string, number[]> = new Map();
  private readonly maxHistorySize = 1000;

  constructor(targets: PerformanceMetrics) {
    this.targets = targets;
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    const metricKeys = [
      'apiResponse',
      'aiResponse',
      'dbImprovement',
      'uiResponsiveness',
      'memoryBaseline',
      'quantumCoherence',
    ];

    metricKeys.forEach(key => {
      this.metrics.set(key, []);
    });
  }

  async validatePerformance(): Promise<PerformanceReport> {
    const metrics = await this.collectMetrics();

    return {
      status: this.evaluateStatus(metrics),
      apiLatency: { current: metrics.apiResponse, target: this.targets.apiResponse },
      aiProcessing: { current: metrics.aiResponse, target: this.targets.aiResponse },
      databasePerformance: { current: metrics.dbImprovement, target: this.targets.dbImprovement },
      quantumOptimization: {
        current: metrics.quantumCoherence,
        target: this.targets.quantumCoherence,
      },
      recommendation: this.generateOptimizationPlan(metrics),
      timestamp: new Date(),
    };
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    const currentMetrics: PerformanceMetrics = {
      apiResponse: await this.measureAPILatency(),
      aiResponse: await this.measureAIProcessing(),
      dbImprovement: await this.measureDatabasePerformance(),
      uiResponsiveness: await this.measureUIResponsiveness(),
      memoryBaseline: await this.measureMemoryUsage(),
      quantumCoherence: await this.measureQuantumCoherence(),
    };

    this.recordMetrics(currentMetrics);
    return currentMetrics;
  }

  private async measureAPILatency(): Promise<number> {
    try {
      const startTime = performance.now();
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const latency = performance.now() - startTime;

      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
      }

      return Math.round(latency);
    } catch (error) {
      console.warn('API latency measurement failed:', error);
      return 1000;
    }
  }

  private async measureAIProcessing(): Promise<number> {
    try {
      const startTime = performance.now();
      const testPrompt = 'Generate a simple response for performance testing';

      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt }),
        signal: AbortSignal.timeout(10000),
      });

      const latency = performance.now() - startTime;

      if (!response.ok) {
        throw new Error(`AI processing failed: ${response.status}`);
      }

      return Math.round(latency);
    } catch (error) {
      console.warn('AI processing measurement failed:', error);
      return 2000;
    }
  }

  private async measureDatabasePerformance(): Promise<number> {
    try {
      const startTime = performance.now();
      const response = await fetch('/api/database/performance', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const latency = performance.now() - startTime;

      if (!response.ok) {
        throw new Error(`Database performance check failed: ${response.status}`);
      }

      const data = await response.json();
      return data.improvementFactor || 1.0;
    } catch (error) {
      console.warn('Database performance measurement failed:', error);
      return 1.0;
    }
  }

  private async measureUIResponsiveness(): Promise<number> {
    try {
      const startTime = performance.now();

      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      const latency = performance.now() - startTime;
      return Math.round(latency);
    } catch (error) {
      console.warn('UI responsiveness measurement failed:', error);
      return 100;
    }
  }

  private async measureMemoryUsage(): Promise<number> {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }

      return 512;
    } catch (error) {
      console.warn('Memory usage measurement failed:', error);
      return 512;
    }
  }

  private async measureQuantumCoherence(): Promise<number> {
    try {
      const response = await fetch('/api/quantum/coherence', {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`Quantum coherence check failed: ${response.status}`);
      }

      const data = await response.json();
      return data.coherence || 0.85;
    } catch (error) {
      console.warn('Quantum coherence measurement failed:', error);
      return 0.85;
    }
  }

  private recordMetrics(metrics: PerformanceMetrics): void {
    Object.entries(metrics).forEach(([key, value]) => {
      const history = this.metrics.get(key) || [];
      history.push(value);

      if (history.length > this.maxHistorySize) {
        history.shift();
      }

      this.metrics.set(key, history);
    });
  }

  private evaluateStatus(
    metrics: PerformanceMetrics
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    let score = 0;
    let totalChecks = 0;

    if (metrics.apiResponse <= this.targets.apiResponse) {
      score += 1;
    }
    totalChecks++;

    if (metrics.aiResponse <= this.targets.aiResponse) {
      score += 1;
    }
    totalChecks++;

    if (metrics.dbImprovement >= this.targets.dbImprovement) {
      score += 1;
    }
    totalChecks++;

    if (metrics.uiResponsiveness <= this.targets.uiResponsiveness) {
      score += 1;
    }
    totalChecks++;

    if (metrics.memoryBaseline <= this.targets.memoryBaseline) {
      score += 1;
    }
    totalChecks++;

    if (metrics.quantumCoherence >= this.targets.quantumCoherence) {
      score += 1;
    }
    totalChecks++;

    const percentage = (score / totalChecks) * 100;

    if (percentage >= 95) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 60) return 'warning';
    return 'critical';
  }

  private generateOptimizationPlan(metrics: PerformanceMetrics): string {
    const recommendations: string[] = [];

    if (metrics.apiResponse > this.targets.apiResponse) {
      recommendations.push('Optimize API response times through caching and query optimization');
    }

    if (metrics.aiResponse > this.targets.aiResponse) {
      recommendations.push('Enhance AI processing with parallel execution and model optimization');
    }

    if (metrics.dbImprovement < this.targets.dbImprovement) {
      recommendations.push(
        'Implement database indexing and connection pooling for better performance'
      );
    }

    if (metrics.uiResponsiveness > this.targets.uiResponsiveness) {
      recommendations.push(
        'Optimize UI rendering with virtual scrolling and component memoization'
      );
    }

    if (metrics.memoryBaseline > this.targets.memoryBaseline) {
      recommendations.push('Implement memory management and garbage collection optimization');
    }

    if (metrics.quantumCoherence < this.targets.quantumCoherence) {
      recommendations.push('Enhance quantum optimization algorithms and coherence management');
    }

    if (recommendations.length === 0) {
      return 'All performance targets are being met. Continue monitoring for optimal performance.';
    }

    return recommendations.join('. ') + '.';
  }

  getHistoricalMetrics(key: string, count: number = 100): number[] {
    const history = this.metrics.get(key) || [];
    return history.slice(-count);
  }

  getAverageMetrics(): PerformanceMetrics {
    const averages: Partial<PerformanceMetrics> = {};

    Object.keys(this.targets).forEach(key => {
      const history = this.metrics.get(key) || [];
      if (history.length > 0) {
        const average = history.reduce((sum, value) => sum + value, 0) / history.length;
        (averages as any)[key] = Math.round(average * 100) / 100;
      }
    });

    return averages as PerformanceMetrics;
  }

  getPerformanceTrends(): Record<string, 'improving' | 'stable' | 'declining'> {
    const trends: Record<string, 'improving' | 'stable' | 'declining'> = {};

    Object.keys(this.targets).forEach(key => {
      const history = this.metrics.get(key) || [];
      if (history.length >= 10) {
        const recent = history.slice(-10);
        const older = history.slice(-20, -10);

        const recentAvg = recent.reduce((sum, value) => sum + value, 0) / recent.length;
        const olderAvg = older.reduce((sum, value) => sum + value, 0) / older.length;

        const change = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (change < -5) {
          trends[key] = 'improving';
        } else if (change > 5) {
          trends[key] = 'declining';
        } else {
          trends[key] = 'stable';
        }
      } else {
        trends[key] = 'stable';
      }
    });

    return trends;
  }

  generatePerformanceReport(): string {
    const report = this.getAverageMetrics();
    const trends = this.getPerformanceTrends();

    let reportText = '## Terrafusion Performance Report\n\n';

    Object.entries(report).forEach(([key, value]) => {
      const target = (this.targets as any)[key];
      const trend = trends[key];
      const status = value <= target ? '✅' : '⚠️';

      reportText += `**${key}**: ${value} (target: ${target}) ${status} ${trend}\n`;
    });

    return reportText;
  }
}
