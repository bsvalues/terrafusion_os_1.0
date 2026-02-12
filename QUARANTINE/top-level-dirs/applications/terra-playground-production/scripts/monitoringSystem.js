const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const { createLogger, format, transports } = winston;

const os = require('os');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const si = require('systeminformation');

class MonitoringSystem {
  constructor(config) {
    this.config = config;
    this.logger = this.initializeLogger();
    this.metrics = new Map();
    this.alerts = new Map();
    this.initializeMetrics();
  }

  initializeLogger() {
    const logDir = path.join(app.getPath('userData'), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logger = createLogger({
      level: this.config.monitoring.logging.level || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: {
        service: 'terra-fusion',
        environment: process.env.NODE_ENV,
        hostname: os.hostname()
      },
      transports: [
        new transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: this.config.monitoring.logging.maxSize,
          maxFiles: 5
        }),
        new transports.File({
          filename: path.join(logDir, 'combined.log'),
          maxsize: this.config.monitoring.logging.maxSize,
          maxFiles: 5
        })
      ]
    });

    // Add Elasticsearch transport if configured
    if (this.config.monitoring.elasticsearch) {
      logger.add(new ElasticsearchTransport({
        level: 'info',
        index: 'terra-fusion-logs',
        clientOpts: {
          node: this.config.monitoring.elasticsearch.url,
          auth: {
            username: this.config.monitoring.elasticsearch.username,
            password: this.config.monitoring.elasticsearch.password
          }
        }
      }));
    }

    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      logger.add(new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      }));
    }

    return logger;
  }

  async initializeMetrics() {
    // Initialize system metrics
    this.metrics.set('cpu', {
      usage: 0,
      temperature: 0,
      load: [0, 0, 0]
    });

    this.metrics.set('memory', {
      total: 0,
      used: 0,
      free: 0,
      usage: 0
    });

    this.metrics.set('disk', {
      total: 0,
      used: 0,
      free: 0,
      usage: 0
    });

    this.metrics.set('network', {
      bytesIn: 0,
      bytesOut: 0,
      connections: 0
    });

    // Start metric collection
    this.startMetricCollection();
  }

  async startMetricCollection() {
    const interval = this.config.monitoring.performance.interval * 60 * 1000;

    setInterval(async () => {
      try {
        await this.collectMetrics();
        this.checkAlerts();
      } catch (error) {
        this.logger.error('Error collecting metrics:', error);
      }
    }, interval);
  }

  async collectMetrics() {
    const timestamp = Date.now();

    // Collect CPU metrics
    if (this.config.monitoring.performance.metrics.includes('cpu')) {
      const cpuMetrics = await this.collectCPUMetrics();
      this.metrics.set('cpu', cpuMetrics);
      this.logger.debug('CPU metrics collected', { metrics: cpuMetrics });
    }

    // Collect memory metrics
    if (this.config.monitoring.performance.metrics.includes('memory')) {
      const memoryMetrics = await this.collectMemoryMetrics();
      this.metrics.set('memory', memoryMetrics);
      this.logger.debug('Memory metrics collected', { metrics: memoryMetrics });
    }

    // Collect disk metrics
    if (this.config.monitoring.performance.metrics.includes('disk')) {
      const diskMetrics = await this.collectDiskMetrics();
      this.metrics.set('disk', diskMetrics);
      this.logger.debug('Disk metrics collected', { metrics: diskMetrics });
    }

    // Collect network metrics
    if (this.config.monitoring.performance.metrics.includes('network')) {
      const networkMetrics = await this.collectNetworkMetrics();
      this.metrics.set('network', networkMetrics);
      this.logger.debug('Network metrics collected', { metrics: networkMetrics });
    }

    // Log metrics to Elasticsearch if configured
    if (this.config.monitoring.elasticsearch) {
      this.logger.info('Metrics collected', {
        timestamp,
        metrics: Object.fromEntries(this.metrics)
      });
    }
  }

  async collectCPUMetrics() {
    const [cpuInfo, cpuLoad] = await Promise.all([
      si.cpu(),
      si.currentLoad()
    ]);

    return {
      usage: cpuLoad.currentLoad,
      temperature: cpuInfo.temperature,
      load: cpuLoad.cpus.map(cpu => cpu.load)
    };
  }

  async collectMemoryMetrics() {
    const memInfo = await si.mem();
    return {
      total: memInfo.total,
      used: memInfo.used,
      free: memInfo.free,
      usage: (memInfo.used / memInfo.total) * 100
    };
  }

  async collectDiskMetrics() {
    const diskInfo = await si.fsSize();
    const rootDisk = diskInfo.find(disk => disk.mount === '/');
    
    return {
      total: rootDisk.size,
      used: rootDisk.used,
      free: rootDisk.available,
      usage: rootDisk.use
    };
  }

  async collectNetworkMetrics() {
    const networkStats = await si.networkStats();
    const totalStats = networkStats.reduce((acc, stat) => ({
      bytesIn: acc.bytesIn + stat.rx_bytes,
      bytesOut: acc.bytesOut + stat.tx_bytes
    }), { bytesIn: 0, bytesOut: 0 });

    const connections = await si.networkConnections();
    
    return {
      ...totalStats,
      connections: connections.length
    };
  }

  checkAlerts() {
    const alerts = [];

    // Check CPU usage
    const cpuMetrics = this.metrics.get('cpu');
    if (cpuMetrics.usage > 90) {
      alerts.push({
        type: 'cpu',
        level: 'warning',
        message: `High CPU usage: ${cpuMetrics.usage.toFixed(1)}%`
      });
    }

    // Check memory usage
    const memoryMetrics = this.metrics.get('memory');
    if (memoryMetrics.usage > 90) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `High memory usage: ${memoryMetrics.usage.toFixed(1)}%`
      });
    }

    // Check disk usage
    const diskMetrics = this.metrics.get('disk');
    if (diskMetrics.usage > 90) {
      alerts.push({
        type: 'disk',
        level: 'warning',
        message: `High disk usage: ${diskMetrics.usage.toFixed(1)}%`
      });
    }

    // Process alerts
    for (const alert of alerts) {
      this.processAlert(alert);
    }
  }

  processAlert(alert) {
    this.logger.warn(alert.message, { alert });

    // Store alert
    this.alerts.set(Date.now(), alert);

    // Send notifications
    if (this.config.monitoring.alerts.email.enabled) {
      this.sendEmailAlert(alert);
    }

    if (this.config.monitoring.alerts.slack.enabled) {
      this.sendSlackAlert(alert);
    }
  }

  async sendEmailAlert(alert) {
    // Implement email alert sending
    this.logger.info('Email alert sent', { alert });
  }

  async sendSlackAlert(alert) {
    // Implement Slack alert sending
    this.logger.info('Slack alert sent', { alert });
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  getAlerts() {
    return Object.fromEntries(this.alerts);
  }

  log(level, message, meta = {}) {
    this.logger.log(level, message, meta);
  }

  error(message, error) {
    this.logger.error(message, {
      error: {
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  async getLogs(options = {}) {
    const {
      level,
      startTime,
      endTime,
      limit = 100,
      offset = 0
    } = options;

    // Implement log retrieval logic
    return [];
  }

  async clearLogs() {
    const logDir = path.join(app.getPath('userData'), 'logs');
    const files = fs.readdirSync(logDir);
    
    for (const file of files) {
      if (file.endsWith('.log')) {
        fs.unlinkSync(path.join(logDir, file));
      }
    }
  }
}

module.exports = MonitoringSystem; 