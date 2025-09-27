#!/usr/bin/env node

/**
 * Terrafusion Health Check Endpoints
 * Production Deployment Swarm Delta - Health Monitoring System
 * Comprehensive health check endpoints for all Terrafusion components
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  port: 3001,
  healthCheckInterval: 30000, // 30 seconds
  alertThresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
    responseTime: 5000,
  },
  apps: [
    'terra-agent',
    'terra-flow',
    'web-audit-tracker',
    'terra-levy',
    'terra-miner',
    'terra-fusion-sync',
    'gispro',
    'costforge-ai',
    'property-workbench',
    'terra-insight',
    'terra-fusion-dashboard',
    'terra-fusion-assessor',
    'marketplace',
    'terra-collections',
  ],
};

// Health Check Manager
class HealthCheckManager {
  constructor() {
    this.healthData = {
      status: 'unknown',
      lastCheck: null,
      uptime: process.uptime(),
      version: '1.0.0',
    };
    this.alertsHistory = [];
    this.metricsHistory = [];
    this.startTime = Date.now();
  }

  // Get system metrics
  async getSystemMetrics() {
    return new Promise(resolve => {
      const metrics = {
        timestamp: new Date().toISOString(),
        cpu: {
          usage: 0,
          load: os.loadavg(),
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          percentage: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2),
        },
        disk: {
          usage: 0,
          percentage: 0,
        },
        network: {
          interfaces: os.networkInterfaces(),
        },
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
      };

      // Get CPU usage
      exec(
        "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F'%' '{print $1}'",
        (error, stdout) => {
          if (!error) {
            metrics.cpu.usage = parseFloat(stdout.trim()) || 0;
          }

          // Get disk usage
          exec('df -h / | awk \'NR==2{printf "%s %s", $5, $4}\'', (error, stdout) => {
            if (!error) {
              const diskInfo = stdout.trim().split(' ');
              metrics.disk.percentage = parseFloat(diskInfo[0]?.replace('%', '')) || 0;
              metrics.disk.available = diskInfo[1] || 'Unknown';
            }
            resolve(metrics);
          });
        }
      );
    });
  }

  // Check application health
  async checkApplicationHealth() {
    const scriptDir = __dirname;
    const appsDir = path.join(scriptDir, 'complete-deployment', 'applications');
    const appHealth = {
      total: CONFIG.apps.length,
      healthy: 0,
      unhealthy: 0,
      applications: [],
    };

    for (let i = 0; i < CONFIG.apps.length; i++) {
      const appName = CONFIG.apps[i];
      const appNumber = String(i + 1).padStart(2, '0');
      const appDir = path.join(appsDir, `${appNumber}-${appName}`);
      const distDir = path.join(appDir, 'dist');

      const appStatus = {
        name: appName,
        id: i + 1,
        status: 'unknown',
        path: appDir,
        lastCheck: new Date().toISOString(),
      };

      try {
        // Check if app directory exists
        if (fs.existsSync(appDir)) {
          // Check if dist directory exists and has files
          if (fs.existsSync(distDir)) {
            const distFiles = fs.readdirSync(distDir);
            if (distFiles.length > 0) {
              appStatus.status = 'healthy';
              appStatus.distFiles = distFiles.length;
              appHealth.healthy++;
            } else {
              appStatus.status = 'unhealthy';
              appStatus.issue = 'Empty dist directory';
              appHealth.unhealthy++;
            }
          } else {
            appStatus.status = 'unhealthy';
            appStatus.issue = 'Missing dist directory';
            appHealth.unhealthy++;
          }

          // Get app size
          try {
            const stats = fs.statSync(appDir);
            appStatus.lastModified = stats.mtime;
          } catch (e) {
            // Silent fail for stats
          }
        } else {
          appStatus.status = 'missing';
          appStatus.issue = 'Application directory not found';
          appHealth.unhealthy++;
        }
      } catch (error) {
        appStatus.status = 'error';
        appStatus.issue = error.message;
        appHealth.unhealthy++;
      }

      appHealth.applications.push(appStatus);
    }

    appHealth.healthScore = ((appHealth.healthy / appHealth.total) * 100).toFixed(2);
    return appHealth;
  }

  // Perform comprehensive health check
  async performHealthCheck() {
    console.log(`[${new Date().toISOString()}] Performing health check...`);

    try {
      const systemMetrics = await this.getSystemMetrics();
      const appHealth = await this.checkApplicationHealth();

      // Determine overall status
      let overallStatus = 'healthy';
      const alerts = [];

      // Check system thresholds
      if (systemMetrics.cpu.usage > CONFIG.alertThresholds.cpu) {
        overallStatus = 'warning';
        alerts.push(`High CPU usage: ${systemMetrics.cpu.usage}%`);
      }

      if (parseFloat(systemMetrics.memory.percentage) > CONFIG.alertThresholds.memory) {
        overallStatus = 'warning';
        alerts.push(`High memory usage: ${systemMetrics.memory.percentage}%`);
      }

      if (systemMetrics.disk.percentage > CONFIG.alertThresholds.disk) {
        overallStatus = 'warning';
        alerts.push(`High disk usage: ${systemMetrics.disk.percentage}%`);
      }

      // Check application health
      if (appHealth.unhealthy > 0) {
        overallStatus = appHealth.unhealthy > 7 ? 'critical' : 'warning';
        alerts.push(`${appHealth.unhealthy} applications unhealthy`);
      }

      this.healthData = {
        status: overallStatus,
        lastCheck: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        system: systemMetrics,
        applications: appHealth,
        alerts: alerts,
        responseTime: Date.now() - this.startTime,
      };

      // Store alerts
      if (alerts.length > 0) {
        this.alertsHistory.push({
          timestamp: new Date().toISOString(),
          alerts: alerts,
          status: overallStatus,
        });
      }

      // Store metrics history (keep last 100)
      this.metricsHistory.push({
        timestamp: new Date().toISOString(),
        cpu: systemMetrics.cpu.usage,
        memory: parseFloat(systemMetrics.memory.percentage),
        disk: systemMetrics.disk.percentage,
        apps_healthy: appHealth.healthy,
      });

      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }

      console.log(`[${new Date().toISOString()}] Health check completed. Status: ${overallStatus}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Health check failed:`, error);
      this.healthData.status = 'critical';
      this.healthData.error = error.message;
    }
  }

  // Start periodic health checks
  startPeriodicHealthChecks() {
    // Initial check
    this.performHealthCheck();

    // Schedule periodic checks
    setInterval(() => {
      this.performHealthCheck();
    }, CONFIG.healthCheckInterval);

    console.log(`Health checks scheduled every ${CONFIG.healthCheckInterval / 1000} seconds`);
  }
}

// HTTP Server for health endpoints
class HealthServer {
  constructor(healthManager) {
    this.healthManager = healthManager;
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      switch (pathname) {
        case '/health':
          this.handleHealthCheck(req, res);
          break;
        case '/health/detailed':
          this.handleDetailedHealth(req, res);
          break;
        case '/health/system':
          this.handleSystemHealth(req, res);
          break;
        case '/health/apps':
          this.handleAppsHealth(req, res);
          break;
        case '/health/alerts':
          this.handleAlerts(req, res);
          break;
        case '/health/metrics':
          this.handleMetrics(req, res);
          break;
        case '/health/status':
          this.handleStatusPage(req, res);
          break;
        default:
          this.handle404(req, res);
          break;
      }
    } catch (error) {
      this.handleError(req, res, error);
    }
  }

  handleHealthCheck(req, res) {
    const quickHealth = {
      status: this.healthManager.healthData.status,
      timestamp: new Date().toISOString(),
      version: this.healthManager.healthData.version,
      uptime: this.healthManager.healthData.uptime,
      apps_healthy: this.healthManager.healthData.applications?.healthy || 0,
      total_apps: CONFIG.apps.length,
    };

    const statusCode =
      quickHealth.status === 'healthy' ? 200 : quickHealth.status === 'warning' ? 200 : 503;

    this.sendJSON(res, quickHealth, statusCode);
  }

  handleDetailedHealth(req, res) {
    this.sendJSON(res, this.healthManager.healthData);
  }

  handleSystemHealth(req, res) {
    const systemHealth = {
      system: this.healthManager.healthData.system,
      timestamp: new Date().toISOString(),
    };
    this.sendJSON(res, systemHealth);
  }

  handleAppsHealth(req, res) {
    const appsHealth = {
      applications: this.healthManager.healthData.applications,
      timestamp: new Date().toISOString(),
    };
    this.sendJSON(res, appsHealth);
  }

  handleAlerts(req, res) {
    const alertsData = {
      current_alerts: this.healthManager.healthData.alerts || [],
      alerts_history: this.healthManager.alertsHistory,
      timestamp: new Date().toISOString(),
    };
    this.sendJSON(res, alertsData);
  }

  handleMetrics(req, res) {
    const metricsData = {
      current_metrics: {
        cpu: this.healthManager.healthData.system?.cpu?.usage || 0,
        memory: this.healthManager.healthData.system?.memory?.percentage || 0,
        disk: this.healthManager.healthData.system?.disk?.percentage || 0,
        apps_healthy: this.healthManager.healthData.applications?.healthy || 0,
      },
      metrics_history: this.healthManager.metricsHistory,
      timestamp: new Date().toISOString(),
    };
    this.sendJSON(res, metricsData);
  }

  handleStatusPage(req, res) {
    const html = this.generateStatusHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  generateStatusHTML() {
    const health = this.healthManager.healthData;
    const statusColor =
      health.status === 'healthy' ? 'green' : health.status === 'warning' ? 'orange' : 'red';

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Terrafusion Health Status</title>
    <meta http-equiv="refresh" content="30">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                 color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .status { background: white; margin: 20px 0; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; }
        .healthy { background-color: #4CAF50; }
        .warning { background-color: #FF9800; }
        .critical { background-color: #F44336; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .apps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
        .app-card { background: white; padding: 10px; border-radius: 8px; border-left: 4px solid #4CAF50; }
        .app-card.unhealthy { border-left-color: #F44336; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Terrafusion Production Health Dashboard</h1>
            <div class="status-badge ${health.status}">${health.status.toUpperCase()}</div>
            <div class="timestamp">Last updated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="status">
            <h2>System Metrics</h2>
            <div class="metric">
                <strong>CPU Usage:</strong> ${health.system?.cpu?.usage || 0}%
            </div>
            <div class="metric">
                <strong>Memory Usage:</strong> ${health.system?.memory?.percentage || 0}%
            </div>
            <div class="metric">
                <strong>Disk Usage:</strong> ${health.system?.disk?.percentage || 0}%
            </div>
            <div class="metric">
                <strong>Uptime:</strong> ${Math.floor((health.uptime || 0) / 3600)}h ${Math.floor(((health.uptime || 0) % 3600) / 60)}m
            </div>
        </div>

        <div class="status">
            <h2>Applications Status (${health.applications?.healthy || 0}/${health.applications?.total || 14} Healthy)</h2>
            <div class="apps-grid">
                ${(health.applications?.applications || [])
                  .map(
                    app => `
                    <div class="app-card ${app.status !== 'healthy' ? 'unhealthy' : ''}">
                        <strong>${app.name}</strong><br>
                        Status: ${app.status}<br>
                        ${app.issue ? `Issue: ${app.issue}` : ''}
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>

        ${
          health.alerts && health.alerts.length > 0
            ? `
        <div class="status">
            <h2>Active Alerts</h2>
            <ul>
                ${health.alerts.map(alert => `<li style="color: red;">${alert}</li>`).join('')}
            </ul>
        </div>
        `
            : ''
        }
    </div>
</body>
</html>`;
  }

  handle404(req, res) {
    const endpoints = [
      '/health - Basic health status',
      '/health/detailed - Detailed health information',
      '/health/system - System metrics only',
      '/health/apps - Applications health only',
      '/health/alerts - Current and historical alerts',
      '/health/metrics - Performance metrics',
      '/health/status - HTML status page',
    ];

    const response = {
      error: 'Endpoint not found',
      available_endpoints: endpoints,
      timestamp: new Date().toISOString(),
    };

    this.sendJSON(res, response, 404);
  }

  handleError(req, res, error) {
    console.error('Health endpoint error:', error);
    const response = {
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
    this.sendJSON(res, response, 500);
  }

  sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  start() {
    this.server.listen(CONFIG.port, () => {
      console.log(`\n🏥 Terrafusion Health Check Endpoints running on port ${CONFIG.port}`);
      console.log(`\nAvailable endpoints:`);
      console.log(`  http://localhost:${CONFIG.port}/health - Basic health status`);
      console.log(
        `  http://localhost:${CONFIG.port}/health/detailed - Detailed health information`
      );
      console.log(`  http://localhost:${CONFIG.port}/health/system - System metrics only`);
      console.log(`  http://localhost:${CONFIG.port}/health/apps - Applications health only`);
      console.log(
        `  http://localhost:${CONFIG.port}/health/alerts - Current and historical alerts`
      );
      console.log(`  http://localhost:${CONFIG.port}/health/metrics - Performance metrics`);
      console.log(`  http://localhost:${CONFIG.port}/health/status - HTML status page`);
      console.log(`\n🌐 Visit http://localhost:${CONFIG.port}/health/status for dashboard\n`);
    });
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting Terrafusion Health Check System...');

  const healthManager = new HealthCheckManager();
  const healthServer = new HealthServer(healthManager);

  // Start health monitoring
  healthManager.startPeriodicHealthChecks();

  // Start HTTP server
  healthServer.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📊 Shutting down health check system...');
    process.exit(0);
  });
}

export { HealthCheckManager, HealthServer, CONFIG };
