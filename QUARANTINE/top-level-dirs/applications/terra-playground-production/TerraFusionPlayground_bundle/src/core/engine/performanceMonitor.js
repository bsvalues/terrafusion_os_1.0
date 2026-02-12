const os = require('os');
const v8 = require('v8');
const { EventEmitter } = require('events');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

class PerformanceMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            metricsInterval: 60000, // 1 minute
            alertThresholds: {
                cpu: 80, // 80% CPU usage
                memory: 80, // 80% memory usage
                disk: 90, // 90% disk usage
                responseTime: 1000 // 1 second
            },
            metricsHistory: 24 * 60, // 24 hours of minute-level metrics
            ...config
        };

        this.metrics = {
            cpu: [],
            memory: [],
            disk: [],
            responseTime: [],
            modelPerformance: new Map()
        };

        this.alerts = new Set();
        this.initialized = false;
    }

    async initialize() {
        try {
            await this.setupMetricsCollection();
            this.initialized = true;
            this.startMetricsCollection();
        } catch (error) {
            throw new Error(`Failed to initialize PerformanceMonitor: ${error.message}`);
        }
    }

    async setupMetricsCollection() {
        // Create metrics directory if it doesn't exist
        const metricsDir = path.join(process.cwd(), 'data', 'metrics');
        await fs.mkdir(metricsDir, { recursive: true });
    }

    startMetricsCollection() {
        this.metricsInterval = setInterval(async () => {
            try {
                await this.collectMetrics();
                this.checkThresholds();
                await this.saveMetrics();
            } catch (error) {
                this.emit('error', error);
            }
        }, this.config.metricsInterval);
    }

    async collectMetrics() {
        const timestamp = Date.now();
        
        // CPU metrics
        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
        this.metrics.cpu.push({ timestamp, value: cpuUsage });

        // Memory metrics
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
        this.metrics.memory.push({ timestamp, value: memoryUsage });

        // Disk metrics
        const diskUsage = await this.getDiskUsage();
        this.metrics.disk.push({ timestamp, value: diskUsage });

        // V8 heap metrics
        const heapStats = v8.getHeapStatistics();
        this.metrics.heap = {
            totalHeapSize: heapStats.total_heap_size,
            usedHeapSize: heapStats.used_heap_size,
            heapSizeLimit: heapStats.heap_size_limit
        };

        // Trim old metrics
        this.trimMetrics();
    }

    async getDiskUsage() {
        const { stdout } = await promisify(require('child_process').exec)('df -h / | tail -n 1');
        const usage = parseInt(stdout.split(/\s+/)[4]);
        return usage;
    }

    trimMetrics() {
        const cutoff = Date.now() - (this.config.metricsHistory * 60 * 1000);
        
        ['cpu', 'memory', 'disk', 'responseTime'].forEach(metric => {
            this.metrics[metric] = this.metrics[metric].filter(m => m.timestamp > cutoff);
        });
    }

    checkThresholds() {
        const latestMetrics = {
            cpu: this.metrics.cpu[this.metrics.cpu.length - 1]?.value,
            memory: this.metrics.memory[this.metrics.memory.length - 1]?.value,
            disk: this.metrics.disk[this.metrics.disk.length - 1]?.value
        };

        Object.entries(latestMetrics).forEach(([metric, value]) => {
            if (value > this.config.alertThresholds[metric]) {
                this.emit('alert', {
                    type: metric,
                    value,
                    threshold: this.config.alertThresholds[metric],
                    timestamp: Date.now()
                });
            }
        });
    }

    async saveMetrics() {
        const metricsPath = path.join(process.cwd(), 'data', 'metrics', 'performance.json');
        await fs.writeFile(metricsPath, JSON.stringify(this.metrics, null, 2));
    }

    trackModelPerformance(modelId, startTime) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (!this.metrics.modelPerformance.has(modelId)) {
            this.metrics.modelPerformance.set(modelId, []);
        }

        this.metrics.modelPerformance.get(modelId).push({
            timestamp: endTime,
            duration
        });

        // Check if this model's performance is degrading
        this.checkModelPerformance(modelId);
    }

    checkModelPerformance(modelId) {
        const modelMetrics = this.metrics.modelPerformance.get(modelId);
        if (!modelMetrics || modelMetrics.length < 10) return;

        const recentMetrics = modelMetrics.slice(-10);
        const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;

        if (avgDuration > this.config.alertThresholds.responseTime) {
            this.emit('modelAlert', {
                modelId,
                avgDuration,
                threshold: this.config.alertThresholds.responseTime,
                timestamp: Date.now()
            });
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            alerts: Array.from(this.alerts)
        };
    }

    getModelMetrics(modelId) {
        return this.metrics.modelPerformance.get(modelId) || [];
    }

    async cleanup() {
        clearInterval(this.metricsInterval);
        await this.saveMetrics();
    }
}

module.exports = PerformanceMonitor; 