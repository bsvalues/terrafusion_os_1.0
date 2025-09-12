import AppConfig from '../config/app-config';
import logger from './logger';

class Monitor {
    constructor() {
        this.metrics = {
            performance: {},
            errors: [],
            apiCalls: [],
            userActions: []
        };
        this.initialize();
    }

    initialize() {
        this.setupPerformanceMonitoring();
        this.setupErrorTracking();
        this.setupApiMonitoring();
        this.setupUserActionTracking();
    }

    setupPerformanceMonitoring() {
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                const timing = window.performance.timing;
                this.metrics.performance = {
                    pageLoad: timing.loadEventEnd - timing.navigationStart,
                    domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                    firstPaint: timing.responseEnd - timing.navigationStart,
                    networkLatency: timing.responseEnd - timing.requestStart
                };
                logger.info('Performance metrics captured', this.metrics.performance);
            });
        }

        if (window.performance && window.performance.memory) {
            setInterval(() => {
                this.metrics.performance.memory = {
                    usedJSHeapSize: window.performance.memory.usedJSHeapSize,
                    totalJSHeapSize: window.performance.memory.totalJSHeapSize
                };
            }, AppConfig.monitoring.memoryCheckInterval);
        }
    }

    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.metrics.errors.push({
                timestamp: new Date().toISOString(),
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno
            });
            logger.error('Error captured', { error: event });
        });
    }

    setupApiMonitoring() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                this.metrics.apiCalls.push({
                    timestamp: new Date().toISOString(),
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    duration: endTime - startTime,
                    status: response.status
                });
                return response;
            } catch (error) {
                logger.error('API call failed', { error, args });
                throw error;
            }
        };
    }

    setupUserActionTracking() {
        const trackableEvents = ['click', 'input', 'submit', 'change'];
        trackableEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                if (this.shouldTrackEvent(event)) {
                    this.metrics.userActions.push({
                        timestamp: new Date().toISOString(),
                        type: eventType,
                        target: event.target.id || event.target.className,
                        value: event.target.value
                    });
                }
            });
        });
    }

    shouldTrackEvent(event) {
        const target = event.target;
        return target.id || target.className || target.tagName === 'BUTTON';
    }

    getMetrics() {
        return {
            ...this.metrics,
            timestamp: new Date().toISOString()
        };
    }

    getPerformanceMetrics() {
        return this.metrics.performance;
    }

    getErrorMetrics() {
        return this.metrics.errors;
    }

    getApiMetrics() {
        return this.metrics.apiCalls;
    }

    getUserActionMetrics() {
        return this.metrics.userActions;
    }

    clearMetrics() {
        this.metrics = {
            performance: {},
            errors: [],
            apiCalls: [],
            userActions: []
        };
        logger.info('Metrics cleared');
    }

    exportMetrics(format = 'json') {
        const data = this.getMetrics();
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    convertToCSV(data) {
        const metrics = [];
        Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(item => {
                    metrics.push({ ...item, metricType: key });
                });
            } else if (typeof value === 'object') {
                metrics.push({ ...value, metricType: key });
            }
        });

        const headers = ['timestamp', 'metricType', 'value'];
        const rows = metrics.map(metric => [
            metric.timestamp || data.timestamp,
            metric.metricType,
            JSON.stringify(metric)
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

const monitor = new Monitor();
export default monitor; 