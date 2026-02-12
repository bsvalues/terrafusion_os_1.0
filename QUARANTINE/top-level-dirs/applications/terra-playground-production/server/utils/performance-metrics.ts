export class PerformanceMetrics {
  private context: string;
  private operationStartTimes: Map<string, number>;
  private operationDurations: Map<string, number[]>;
  private errorCounts: Map<string, number>;

  constructor(context: string) {
    this.context = context;
    this.operationStartTimes = new Map();
    this.operationDurations = new Map();
    this.errorCounts = new Map();
  }

  startOperation(operationName: string): void {
    this.operationStartTimes.set(operationName, Date.now());
  }

  endOperation(operationName: string): void {
    const startTime = this.operationStartTimes.get(operationName);
    if (startTime) {
      const duration = Date.now() - startTime;
      const durations = this.operationDurations.get(operationName) || [];
      durations.push(duration);
      this.operationDurations.set(operationName, durations);
      this.operationStartTimes.delete(operationName);
    }
  }

  recordError(operationName: string): void {
    const currentCount = this.errorCounts.get(operationName) || 0;
    this.errorCounts.set(operationName, currentCount + 1);
  }

  getOperationStats(operationName: string): {
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    errorCount: number;
    totalOperations: number;
  } {
    const durations = this.operationDurations.get(operationName) || [];
    const errorCount = this.errorCounts.get(operationName) || 0;

    if (durations.length === 0) {
      return {
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        errorCount,
        totalOperations: 0
      };
    }

    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      avgDuration: avg,
      minDuration: min,
      maxDuration: max,
      errorCount,
      totalOperations: durations.length
    };
  }

  reset(): void {
    this.operationStartTimes.clear();
    this.operationDurations.clear();
    this.errorCounts.clear();
  }
} 