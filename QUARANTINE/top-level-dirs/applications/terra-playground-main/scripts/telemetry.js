const { app } = require('electron');
const log = require('electron-log');
const os = require('os');
const path = require('path');
const fs = require('fs');
const https = require('https');

class Telemetry {
  constructor() {
    this.telemetryData = {
      appVersion: app.getVersion(),
      os: {
        platform: process.platform,
        version: os.release(),
        arch: process.arch
      },
      hardware: {
        cpu: os.cpus()[0].model,
        cores: os.cpus().length,
        memory: os.totalmem(),
        freeMemory: os.freemem()
      },
      usage: {
        startTime: Date.now(),
        sessions: [],
        features: {},
        errors: [],
        performance: {}
      }
    };

    this.setupLogging();
    this.startPeriodicCollection();
  }

  setupLogging() {
    log.transports.file.level = 'info';
    this.logger = log;
  }

  startPeriodicCollection() {
    // Collect system metrics every 5 minutes
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5 * 60 * 1000);

    // Send telemetry data every hour
    setInterval(() => {
      this.sendTelemetryData();
    }, 60 * 60 * 1000);
  }

  collectSystemMetrics() {
    const metrics = {
      timestamp: Date.now(),
      cpu: {
        usage: this.getCPUUsage(),
        temperature: this.getCPUTemperature()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      disk: this.getDiskMetrics(),
      network: this.getNetworkMetrics()
    };

    this.telemetryData.usage.performance[Date.now()] = metrics;
  }

  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length
    };
  }

  getCPUTemperature() {
    // Platform-specific temperature reading
    try {
      if (process.platform === 'win32') {
        const temp = require('node-wmi').query('Win32_PerfFormattedData_Counters_ThermalZoneInformation');
        return temp[0].Temperature;
      } else if (process.platform === 'linux') {
        const temp = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8');
        return parseInt(temp) / 1000;
      }
    } catch (error) {
      this.logger.error('Error reading CPU temperature:', error);
    }
    return null;
  }

  getDiskMetrics() {
    const drive = process.cwd().split(path.sep)[0];
    const stats = fs.statfsSync(drive);
    return {
      total: stats.blocks * stats.bsize,
      free: stats.bfree * stats.bsize,
      used: (stats.blocks - stats.bfree) * stats.bsize
    };
  }

  getNetworkMetrics() {
    // Implement network metrics collection
    return {
      bytesIn: 0,
      bytesOut: 0,
      connections: 0
    };
  }

  trackFeatureUsage(featureName) {
    if (!this.telemetryData.usage.features[featureName]) {
      this.telemetryData.usage.features[featureName] = {
        count: 0,
        lastUsed: null,
        averageDuration: 0
      };
    }

    const feature = this.telemetryData.usage.features[featureName];
    feature.count++;
    feature.lastUsed = Date.now();
  }

  trackError(error, context = {}) {
    this.telemetryData.usage.errors.push({
      timestamp: Date.now(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context
    });
  }

  trackSession() {
    this.telemetryData.usage.sessions.push({
      start: Date.now(),
      end: null,
      duration: null
    });
  }

  endSession() {
    const currentSession = this.telemetryData.usage.sessions[this.telemetryData.usage.sessions.length - 1];
    if (currentSession) {
      currentSession.end = Date.now();
      currentSession.duration = currentSession.end - currentSession.start;
    }
  }

  async sendTelemetryData() {
    try {
      const data = JSON.stringify(this.telemetryData);
      const options = {
        hostname: 'telemetry.terrafusion.com',
        port: 443,
        path: '/api/telemetry',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
          this.logger.info('Telemetry data sent successfully');
          // Clear sent data
          this.clearSentData();
        } else {
          this.logger.error('Failed to send telemetry data:', res.statusCode);
        }
      });

      req.on('error', (error) => {
        this.logger.error('Error sending telemetry data:', error);
      });

      req.write(data);
      req.end();
    } catch (error) {
      this.logger.error('Error in sendTelemetryData:', error);
    }
  }

  clearSentData() {
    // Clear old data that has been successfully sent
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    this.telemetryData.usage.errors = this.telemetryData.usage.errors.filter(
      error => error.timestamp > oneWeekAgo
    );

    this.telemetryData.usage.performance = Object.fromEntries(
      Object.entries(this.telemetryData.usage.performance)
        .filter(([timestamp]) => parseInt(timestamp) > oneWeekAgo)
    );
  }

  getAnalyticsReport() {
    return {
      appVersion: this.telemetryData.appVersion,
      os: this.telemetryData.os,
      hardware: this.telemetryData.hardware,
      usage: {
        totalSessions: this.telemetryData.usage.sessions.length,
        averageSessionDuration: this.calculateAverageSessionDuration(),
        mostUsedFeatures: this.getMostUsedFeatures(),
        errorRate: this.calculateErrorRate(),
        performance: this.getPerformanceMetrics()
      }
    };
  }

  calculateAverageSessionDuration() {
    const completedSessions = this.telemetryData.usage.sessions.filter(s => s.duration);
    if (completedSessions.length === 0) return 0;
    
    const totalDuration = completedSessions.reduce((sum, session) => sum + session.duration, 0);
    return totalDuration / completedSessions.length;
  }

  getMostUsedFeatures() {
    return Object.entries(this.telemetryData.usage.features)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        count: data.count,
        lastUsed: data.lastUsed
      }));
  }

  calculateErrorRate() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentErrors = this.telemetryData.usage.errors.filter(
      error => error.timestamp > oneHourAgo
    ).length;
    
    const recentSessions = this.telemetryData.usage.sessions.filter(
      session => session.start > oneHourAgo
    ).length;

    return recentSessions > 0 ? recentErrors / recentSessions : 0;
  }

  getPerformanceMetrics() {
    const recentMetrics = Object.entries(this.telemetryData.usage.performance)
      .slice(-10)
      .map(([, metrics]) => metrics);

    return {
      averageCPUUsage: this.calculateAverage(recentMetrics.map(m => m.cpu.usage.total)),
      averageMemoryUsage: this.calculateAverage(recentMetrics.map(m => m.memory.used)),
      averageDiskUsage: this.calculateAverage(recentMetrics.map(m => m.disk.used))
    };
  }

  calculateAverage(numbers) {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

module.exports = Telemetry; 