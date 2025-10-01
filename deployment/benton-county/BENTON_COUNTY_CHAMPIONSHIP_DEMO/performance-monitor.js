const express = require('express');
const os = require('os');
const fs = require('fs');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      responses: { success: 0, errors: 0 },
      performance: { avg_response_time: 0, peak_memory: 0 },
      system: { cpu_usage: 0, memory_usage: 0, uptime: 0 },
      endpoints: new Map(),
      alerts: [],
    };
    this.startTime = Date.now();
    this.responseTimeBuffer = [];

    // Start monitoring
    this.startMonitoring();
  }

  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Track request
      this.metrics.requests++;

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = (...args) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Track response
        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.metrics.responses.success++;
        } else {
          this.metrics.responses.errors++;
        }

        // Track endpoint performance
        const endpoint = req.path;
        if (!this.metrics.endpoints.has(endpoint)) {
          this.metrics.endpoints.set(endpoint, {
            requests: 0,
            avg_response_time: 0,
            total_time: 0,
          });
        }

        const endpointMetrics = this.metrics.endpoints.get(endpoint);
        endpointMetrics.requests++;
        endpointMetrics.total_time += responseTime;
        endpointMetrics.avg_response_time = Math.round(
          endpointMetrics.total_time / endpointMetrics.requests
        );

        // Update global response time
        this.responseTimeBuffer.push(responseTime);
        if (this.responseTimeBuffer.length > 100) {
          this.responseTimeBuffer.shift();
        }
        this.metrics.performance.avg_response_time = Math.round(
          this.responseTimeBuffer.reduce((a, b) => a + b, 0) / this.responseTimeBuffer.length
        );

        // Check for performance alerts
        this.checkAlerts(responseTime, res.statusCode);

        originalEnd.apply(res, args);
      };

      next();
    };
  }

  startMonitoring() {
    setInterval(() => {
      // System metrics
      this.metrics.system.cpu_usage = Math.round(os.loadavg()[0] * 100);
      this.metrics.system.memory_usage = Math.round((1 - os.freemem() / os.totalmem()) * 100);
      this.metrics.system.uptime = Math.round((Date.now() - this.startTime) / 1000);
      this.metrics.performance.peak_memory = Math.round(process.memoryUsage().rss / 1024 / 1024);

      // Log metrics every 30 seconds
      console.log(
        `[PERFORMANCE] Requests: ${this.metrics.requests}, Avg Response: ${this.metrics.performance.avg_response_time}ms, Memory: ${this.metrics.performance.peak_memory}MB`
      );
    }, 30000);

    // Save metrics to file every 5 minutes
    setInterval(() => {
      this.saveMetrics();
    }, 300000);
  }

  checkAlerts(responseTime, statusCode) {
    const now = new Date().toISOString();

    // Response time alert
    if (responseTime > 1000) {
      this.metrics.alerts.push({
        type: 'HIGH_RESPONSE_TIME',
        message: `Response time exceeded 1000ms: ${responseTime}ms`,
        timestamp: now,
        severity: 'WARNING',
      });
    }

    // Error rate alert
    const errorRate = (this.metrics.responses.errors / this.metrics.requests) * 100;
    if (errorRate > 5) {
      this.metrics.alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `Error rate exceeded 5%: ${errorRate.toFixed(2)}%`,
        timestamp: now,
        severity: 'CRITICAL',
      });
    }

    // Memory alert
    if (this.metrics.performance.peak_memory > 500) {
      this.metrics.alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        message: `Memory usage exceeded 500MB: ${this.metrics.performance.peak_memory}MB`,
        timestamp: now,
        severity: 'WARNING',
      });
    }

    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }
  }

  saveMetrics() {
    const filename = `metrics-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = `./logs/${filename}`;

    // Ensure logs directory exists
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs');
    }

    // Convert Map to Object for JSON serialization
    const metricsData = {
      ...this.metrics,
      endpoints: Object.fromEntries(this.metrics.endpoints),
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(filepath, JSON.stringify(metricsData, null, 2));
  }

  getMetrics() {
    return {
      ...this.metrics,
      endpoints: Object.fromEntries(this.metrics.endpoints),
      timestamp: new Date().toISOString(),
    };
  }

  getHealthStatus() {
    const errorRate =
      this.metrics.requests > 0 ? (this.metrics.responses.errors / this.metrics.requests) * 100 : 0;

    const status = {
      status: 'healthy',
      uptime: this.metrics.system.uptime,
      response_time: this.metrics.performance.avg_response_time,
      error_rate: Math.round(errorRate * 100) / 100,
      memory_usage: this.metrics.performance.peak_memory,
      cpu_usage: this.metrics.system.cpu_usage,
      active_alerts: this.metrics.alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp).getTime();
        const now = Date.now();
        return now - alertTime < 300000; // Last 5 minutes
      }).length,
    };

    // Determine overall health
    if (errorRate > 10 || this.metrics.performance.avg_response_time > 2000) {
      status.status = 'critical';
    } else if (errorRate > 5 || this.metrics.performance.avg_response_time > 1000) {
      status.status = 'warning';
    }

    return status;
  }
}

module.exports = PerformanceMonitor;
