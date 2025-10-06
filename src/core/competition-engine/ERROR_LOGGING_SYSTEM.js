/**
 * Terrafusion Error Logging System
 * Infrastructure Intelligence, Infinite Scale
 * Comprehensive error tracking and monitoring
 */

class TerraFusionErrorLogger {
    constructor(config = {}) {
        this.config = {
            endpoint: config.endpoint || 'https://api.terrafusionmarket.io/errors',
            apiKey: config.apiKey || process.env.TF_ERROR_API_KEY,
            environment: config.environment || this.detectEnvironment(),
            userId: config.userId || null,
            sessionId: this.generateSessionId(),
            maxRetries: config.maxRetries || 3,
            batchSize: config.batchSize || 10,
            flushInterval: config.flushInterval || 5000, // 5 seconds
            enableConsoleLog: config.enableConsoleLog !== false,
            enableLocalStorage: config.enableLocalStorage !== false,
            sensitivePatterns: config.sensitivePatterns || [
                /api[_-]?key/gi,
                /password/gi,
                /token/gi,
                /secret/gi,
                /ssn/gi,
                /credit[_-]?card/gi
            ]
        };
        
        this.errorQueue = [];
        this.retryQueue = [];
        this.errorStats = {
            total: 0,
            critical: 0,
            error: 0,
            warning: 0,
            info: 0
        };
        
        this.init();
    }
    
    init() {
        // Set up global error handlers
        this.setupErrorHandlers();
        
        // Load any persisted errors
        this.loadPersistedErrors();
        
        // Set up batch processing
        this.startBatchProcessor();
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('🛡️ Terrafusion Error Logging System Initialized');
    }
    
    detectEnvironment() {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'development';
            } else if (hostname.includes('staging') || hostname.includes('test')) {
                return 'staging';
            }
            return 'production';
        }
        return process.env.NODE_ENV || 'development';
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    setupErrorHandlers() {
        // Browser environment
        if (typeof window !== 'undefined') {
            // Unhandled errors
            window.addEventListener('error', (event) => {
                this.logError({
                    message: event.message,
                    source: event.filename,
                    line: event.lineno,
                    column: event.colno,
                    stack: event.error?.stack,
                    type: 'unhandled_error'
                }, 'error');
            });
            
            // Unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.logError({
                    message: event.reason?.message || event.reason,
                    stack: event.reason?.stack,
                    type: 'unhandled_promise_rejection'
                }, 'error');
            });
            
            // Console error override
            const originalError = console.error;
            console.error = (...args) => {
                this.logError({
                    message: args.join(' '),
                    type: 'console_error',
                    args: args
                }, 'error');
                originalError.apply(console, args);
            };
        }
        
        // Node.js environment
        if (typeof process !== 'undefined') {
            process.on('uncaughtException', (error) => {
                this.logError({
                    message: error.message,
                    stack: error.stack,
                    type: 'uncaught_exception'
                }, 'critical');
            });
            
            process.on('unhandledRejection', (reason, promise) => {
                this.logError({
                    message: reason?.message || reason,
                    stack: reason?.stack,
                    type: 'unhandled_rejection',
                    promise: promise.toString()
                }, 'error');
            });
        }
    }
    
    setupPerformanceMonitoring() {
        if (typeof window !== 'undefined' && window.performance) {
            // Monitor slow operations
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 3000) { // Operations taking more than 3 seconds
                        this.logError({
                            message: `Slow operation detected: ${entry.name}`,
                            duration: entry.duration,
                            type: 'performance_issue',
                            entryType: entry.entryType
                        }, 'warning');
                    }
                }
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
        }
    }
    
    sanitizeData(data) {
        // Deep clone to avoid modifying original
        const sanitized = JSON.parse(JSON.stringify(data));
        
        const sanitizeValue = (obj, key) => {
            if (typeof obj[key] === 'string') {
                // Check if key or value matches sensitive patterns
                for (const pattern of this.config.sensitivePatterns) {
                    if (pattern.test(key) || pattern.test(obj[key])) {
                        obj[key] = '[REDACTED]';
                        break;
                    }
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.sanitizeObject(obj[key]);
            }
        };
        
        const sanitizeObject = (obj) => {
            for (const key in obj) {
                sanitizeValue(obj, key);
            }
        };
        
        sanitizeObject(sanitized);
        return sanitized;
    }
    
    logError(errorData, severity = 'error') {
        const error = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            severity: severity,
            environment: this.config.environment,
            sessionId: this.config.sessionId,
            userId: this.config.userId,
            ...this.sanitizeData(errorData),
            context: this.getContext(),
            breadcrumbs: this.getBreadcrumbs()
        };
        
        // Update stats
        this.errorStats.total++;
        this.errorStats[severity]++;
        
        // Add to queue
        this.errorQueue.push(error);
        
        // Log to console if enabled
        if (this.config.enableConsoleLog) {
            const color = {
                critical: '\x1b[31m', // Red
                error: '\x1b[91m',    // Light Red
                warning: '\x1b[33m',  // Yellow
                info: '\x1b[36m'      // Cyan
            }[severity] || '\x1b[0m';
            
            console.log(`${color}[Terrafusion ${severity.toUpperCase()}]:\x1b[0m`, errorData.message);
        }
        
        // Store locally if enabled
        if (this.config.enableLocalStorage && typeof localStorage !== 'undefined') {
            this.persistError(error);
        }
        
        // Flush immediately for critical errors
        if (severity === 'critical') {
            this.flush();
        }
        
        return error.id;
    }
    
    generateErrorId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getContext() {
        const context = {
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            viewport: typeof window !== 'undefined' ? {
                width: window.innerWidth,
                height: window.innerHeight
            } : null,
            screen: typeof screen !== 'undefined' ? {
                width: screen.width,
                height: screen.height
            } : null,
            memory: typeof performance !== 'undefined' && performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
        
        return context;
    }
    
    breadcrumbs = [];
    maxBreadcrumbs = 20;
    
    addBreadcrumb(breadcrumb) {
        this.breadcrumbs.push({
            ...breadcrumb,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last N breadcrumbs
        if (this.breadcrumbs.length > this.maxBreadcrumbs) {
            this.breadcrumbs.shift();
        }
    }
    
    getBreadcrumbs() {
        return this.breadcrumbs;
    }
    
    startBatchProcessor() {
        setInterval(() => {
            if (this.errorQueue.length > 0) {
                this.flush();
            }
            
            // Retry failed errors
            if (this.retryQueue.length > 0) {
                this.retryErrors();
            }
        }, this.config.flushInterval);
    }
    
    async flush() {
        if (this.errorQueue.length === 0) return;
        
        const errors = this.errorQueue.splice(0, this.config.batchSize);
        
        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'X-Environment': this.config.environment,
                    'X-Session-ID': this.config.sessionId
                },
                body: JSON.stringify({ errors })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to send errors: ${response.status}`);
            }
            
            // Clear persisted errors on successful send
            this.clearPersistedErrors(errors.map(e => e.id));
            
        } catch (error) {
            // Add to retry queue
            errors.forEach(err => {
                err.retryCount = (err.retryCount || 0) + 1;
                if (err.retryCount <= this.config.maxRetries) {
                    this.retryQueue.push(err);
                }
            });
            
            if (this.config.enableConsoleLog) {
                console.warn('Failed to send errors to server:', error.message);
            }
        }
    }
    
    async retryErrors() {
        const errors = this.retryQueue.splice(0, this.config.batchSize);
        
        for (const error of errors) {
            this.errorQueue.push(error);
        }
    }
    
    persistError(error) {
        try {
            const stored = localStorage.getItem('tf_errors') || '[]';
            const errors = JSON.parse(stored);
            errors.push(error);
            
            // Keep only last 100 errors
            if (errors.length > 100) {
                errors.shift();
            }
            
            localStorage.setItem('tf_errors', JSON.stringify(errors));
        } catch (e) {
            // Ignore localStorage errors
        }
    }
    
    loadPersistedErrors() {
        if (typeof localStorage === 'undefined') return;
        
        try {
            const stored = localStorage.getItem('tf_errors');
            if (stored) {
                const errors = JSON.parse(stored);
                this.errorQueue.push(...errors);
                localStorage.removeItem('tf_errors');
            }
        } catch (e) {
            // Ignore localStorage errors
        }
    }
    
    clearPersistedErrors(errorIds) {
        if (typeof localStorage === 'undefined') return;
        
        try {
            const stored = localStorage.getItem('tf_errors');
            if (stored) {
                let errors = JSON.parse(stored);
                errors = errors.filter(e => !errorIds.includes(e.id));
                localStorage.setItem('tf_errors', JSON.stringify(errors));
            }
        } catch (e) {
            // Ignore localStorage errors
        }
    }
    
    // Public API methods
    
    critical(message, data = {}) {
        return this.logError({ message, ...data }, 'critical');
    }
    
    error(message, data = {}) {
        return this.logError({ message, ...data }, 'error');
    }
    
    warning(message, data = {}) {
        return this.logError({ message, ...data }, 'warning');
    }
    
    info(message, data = {}) {
        return this.logError({ message, ...data }, 'info');
    }
    
    // Track specific error types
    
    trackAPIError(endpoint, status, response) {
        return this.logError({
            message: `API Error: ${endpoint}`,
            type: 'api_error',
            endpoint,
            status,
            response: this.sanitizeData(response)
        }, status >= 500 ? 'error' : 'warning');
    }
    
    trackValidationError(field, value, rule) {
        return this.logError({
            message: `Validation failed for ${field}`,
            type: 'validation_error',
            field,
            value: this.sanitizeData({ value }), rule
        }, 'info');
    }
    
    trackPerformanceIssue(operation, duration, threshold) {
        return this.logError({
            message: `Performance issue: ${operation} took ${duration}ms`,
            type: 'performance_issue',
            operation,
            duration,
            threshold
        }, 'warning');
    }
    
    // Get error statistics
    
    getStats() {
        return {
            ...this.errorStats,
            queueLength: this.errorQueue.length,
            retryQueueLength: this.retryQueue.length,
            sessionId: this.config.sessionId,
            environment: this.config.environment
        };
    }
    
    // Clear all errors
    
    clear() {
        this.errorQueue = [];
        this.retryQueue = [];
        this.breadcrumbs = [];
        this.errorStats = {
            total: 0,
            critical: 0,
            error: 0,
            warning: 0,
            info: 0
        };
        
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('tf_errors');
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerraFusionErrorLogger;
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
    window.TerraFusionErrorLogger = TerraFusionErrorLogger;
    
    // Create global instance
    window.tfErrorLogger = new TerraFusionErrorLogger({
        endpoint: 'https://api.terrafusionmarket.io/errors',
        enableConsoleLog: true,
        enableLocalStorage: true
    });
    
    // Add convenience methods to window
    window.logError = (message, data) => window.tfErrorLogger.error(message, data);
    window.logWarning = (message, data) => window.tfErrorLogger.warning(message, data);
    window.logInfo = (message, data) => window.tfErrorLogger.info(message, data);
}