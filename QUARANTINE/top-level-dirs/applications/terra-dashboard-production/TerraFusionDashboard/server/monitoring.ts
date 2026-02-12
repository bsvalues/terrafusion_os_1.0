import { Request, Response } from 'express';

interface SystemMetrics {
  timestamp: string;
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  uptime: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: number;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private requestCounts = new Map<string, number[]>();
  private errorCounts = new Map<string, number[]>();
  private activeConnections = 0;

  trackRequest(req: Request, res: Response, responseTime: number) {
    const endpoint = req.path;
    const method = req.method;
    const now = Date.now();
    
    // Store performance metric
    this.metrics.push({
      endpoint,
      method,
      responseTime,
      statusCode: res.statusCode,
      timestamp: now
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Track requests per minute
    const minuteKey = `${endpoint}:${Math.floor(now / 60000)}`;
    if (!this.requestCounts.has(minuteKey)) {
      this.requestCounts.set(minuteKey, []);
    }
    this.requestCounts.get(minuteKey)!.push(now);

    // Track errors
    if (res.statusCode >= 400) {
      if (!this.errorCounts.has(endpoint)) {
        this.errorCounts.set(endpoint, []);
      }
      this.errorCounts.get(endpoint)!.push(now);
    }

    // Clean old data
    this.cleanOldData();
  }

  private cleanOldData() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean request counts
    for (const [key, timestamps] of Array.from(this.requestCounts.entries())) {
      const filtered = timestamps.filter((t: number) => t > oneHourAgo);
      if (filtered.length === 0) {
        this.requestCounts.delete(key);
      } else {
        this.requestCounts.set(key, filtered);
      }
    }

    // Clean error counts
    for (const [endpoint, timestamps] of Array.from(this.errorCounts.entries())) {
      const filtered = timestamps.filter((t: number) => t > oneHourAgo);
      if (filtered.length === 0) {
        this.errorCounts.delete(endpoint);
      } else {
        this.errorCounts.set(endpoint, filtered);
      }
    }
  }

  getSystemMetrics(): SystemMetrics {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Calculate requests per minute
    const recentRequests = this.metrics.filter(m => m.timestamp > oneMinuteAgo);
    const requestsPerMinute = recentRequests.length;

    // Calculate error rate
    const recentErrors = recentRequests.filter(m => m.statusCode >= 400);
    const errorRate = recentRequests.length > 0 ? (recentErrors.length / recentRequests.length) * 100 : 0;

    return {
      timestamp: new Date().toISOString(),
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      activeConnections: this.activeConnections,
      requestsPerMinute,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  getPerformanceReport() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowestEndpoints: [],
        errorsByEndpoint: {},
        statusCodeDistribution: {}
      };
    }

    // Group by endpoint
    const endpointMetrics = new Map<string, PerformanceMetric[]>();
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointMetrics.has(key)) {
        endpointMetrics.set(key, []);
      }
      endpointMetrics.get(key)!.push(metric);
    });

    // Calculate slowest endpoints
    const slowestEndpoints = Array.from(endpointMetrics.entries())
      .map(([endpoint, metrics]) => ({
        endpoint,
        averageResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
        requestCount: metrics.length,
        errorCount: metrics.filter(m => m.statusCode >= 400).length
      }))
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, 10);

    // Status code distribution
    const statusCodeDistribution: Record<string, number> = {};
    recentMetrics.forEach(metric => {
      const code = metric.statusCode.toString();
      statusCodeDistribution[code] = (statusCodeDistribution[code] || 0) + 1;
    });

    // Errors by endpoint
    const errorsByEndpoint: Record<string, number> = {};
    recentMetrics.filter(m => m.statusCode >= 400).forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      errorsByEndpoint[key] = (errorsByEndpoint[key] || 0) + 1;
    });

    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length,
      slowestEndpoints,
      errorsByEndpoint,
      statusCodeDistribution
    };
  }

  incrementConnections() {
    this.activeConnections++;
  }

  decrementConnections() {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  // Alert thresholds
  checkAlerts() {
    const metrics = this.getSystemMetrics();
    const alerts = [];

    // High memory usage
    if (metrics.memory.heapUsed / metrics.memory.heapTotal > 0.9) {
      alerts.push({
        type: 'HIGH_MEMORY',
        message: 'Memory usage above 90%',
        severity: 'warning'
      });
    }

    // High error rate
    if (metrics.errorRate > 5) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `Error rate at ${metrics.errorRate}%`,
        severity: 'critical'
      });
    }

    // High request volume
    if (metrics.requestsPerMinute > 500) {
      alerts.push({
        type: 'HIGH_TRAFFIC',
        message: `${metrics.requestsPerMinute} requests per minute`,
        severity: 'info'
      });
    }

    return alerts;
  }
}

export const monitoring = new MonitoringService();

// Middleware to track requests
export const trackingMiddleware = (req: Request, res: Response, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    monitoring.trackRequest(req, res, responseTime);
  });

  next();
};

// WebSocket connection tracking
export const trackConnection = () => {
  monitoring.incrementConnections();
  return () => monitoring.decrementConnections();
};

export { MonitoringService };