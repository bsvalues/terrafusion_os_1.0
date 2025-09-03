import AppConfig from '../config/app-config';

class Logger {
    constructor() {
        this.logs = [];
        this.maxEntries = AppConfig.logging.maxEntries;
        this.level = this.getLogLevel(AppConfig.logging.level);
        this.initialize();
    }

    initialize() {
        if (AppConfig.logging.persistLogs) {
            this.loadPersistedLogs();
        }
        this.setupErrorHandling();
    }

    getLogLevel(level) {
        const levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };
        return levels[level] || levels.info;
    }

    setupErrorHandling() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.error('Global Error', { message, source, lineno, colno, error });
        };

        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled Promise Rejection', { reason: event.reason });
        });
    }

    formatLogEntry(level, message, data = {}) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }

    log(level, message, data = {}) {
        if (this.getLogLevel(level) > this.level) return;

        const entry = this.formatLogEntry(level, message, data);
        this.logs.push(entry);

        if (this.logs.length > this.maxEntries) {
            this.logs.shift();
        }

        if (AppConfig.logging.persistLogs) {
            this.persistLogs();
        }

        this.consoleOutput(level, message, data);
    }

    consoleOutput(level, message, data) {
        const styles = {
            error: 'color: #FF6B6B',
            warn: 'color: #FFEEAD',
            info: 'color: #4ECDC4',
            debug: 'color: #45B7D1',
            trace: 'color: #96CEB4'
        };

        console.log(
            `%c[${level.toUpperCase()}] ${message}`,
            styles[level] || 'color: inherit',
            data
        );
    }

    error(message, data = {}) {
        this.log('error', message, data);
    }

    warn(message, data = {}) {
        this.log('warn', message, data);
    }

    info(message, data = {}) {
        this.log('info', message, data);
    }

    debug(message, data = {}) {
        this.log('debug', message, data);
    }

    trace(message, data = {}) {
        this.log('trace', message, data);
    }

    persistLogs() {
        try {
            localStorage.setItem('app_logs', JSON.stringify(this.logs));
        } catch (error) {
            console.error('Failed to persist logs:', error);
        }
    }

    loadPersistedLogs() {
        try {
            const persistedLogs = localStorage.getItem('app_logs');
            if (persistedLogs) {
                this.logs = JSON.parse(persistedLogs);
            }
        } catch (error) {
            console.error('Failed to load persisted logs:', error);
        }
    }

    clearLogs() {
        this.logs = [];
        if (AppConfig.logging.persistLogs) {
            localStorage.removeItem('app_logs');
        }
    }

    getLogs(level = null) {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return this.logs;
    }

    exportLogs(format = 'json') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(this.logs, null, 2);
            case 'csv':
                return this.convertToCSV(this.logs);
            case 'text':
                return this.convertToText(this.logs);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    convertToCSV(logs) {
        const headers = ['timestamp', 'level', 'message', 'data'];
        const rows = logs.map(log => [
            log.timestamp,
            log.level,
            log.message,
            JSON.stringify(log.data)
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    convertToText(logs) {
        return logs.map(log => 
            `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
        ).join('\n');
    }

    setLogLevel(level) {
        this.level = this.getLogLevel(level);
        this.info('Log level changed', { newLevel: level });
    }
}

const logger = new Logger();
export default logger; 