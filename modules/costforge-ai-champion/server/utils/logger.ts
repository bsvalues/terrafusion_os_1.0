/**
 * Logging Utility for CostForge AI Champion Backend
 * 
 * Provides structured logging with different levels and optional
 * external service integration for production monitoring.
 */

export interface LogContext {
  [key: string]: any;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext | Error): void {
    this.log('error', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext | Error): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      service: 'costforge-ai-champion-backend',
      ...(context && this.normalizeContext(context))
    };

    // Console output with color coding
    const colorCode = this.getColorCode(level);
    const resetCode = '\x1b[0m';
    
    console.log(
      `${colorCode}[${timestamp}] ${level.toUpperCase()}: ${message}${resetCode}`,
      context && Object.keys(this.normalizeContext(context)).length > 0 ? 
        '\n' + JSON.stringify(this.normalizeContext(context), null, 2) : ''
    );

    // In production, you might want to send logs to external services
    if (!this.isDevelopment && level === 'error') {
      this.sendToExternalService(logEntry);
    }
  }

  /**
   * Normalize context to handle Error objects and other complex types
   */
  private normalizeContext(context: LogContext | Error): LogContext {
    if (context instanceof Error) {
      return {
        error: {
          name: context.name,
          message: context.message,
          stack: context.stack
        }
      };
    }

    // Handle other object types
    const normalized: LogContext = {};
    for (const [key, value] of Object.entries(context)) {
      if (value instanceof Error) {
        normalized[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack
        };
      } else if (typeof value === 'object' && value !== null) {
        try {
          normalized[key] = JSON.parse(JSON.stringify(value));
        } catch {
          normalized[key] = '[Complex Object]';
        }
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  /**
   * Get ANSI color code for log level
   */
  private getColorCode(level: LogLevel): string {
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m'  // Gray
    };
    return colors[level] || '';
  }

  /**
   * Send critical logs to external monitoring service
   */
  private sendToExternalService(logEntry: any): void {
    // In production, implement integration with services like:
    // - Sentry
    // - LogRocket
    // - Datadog
    // - Custom logging endpoint
    
    // For now, just ensure the error is captured
    try {
      // Example: POST to monitoring service
      // fetch('https://your-monitoring-service.com/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // }).catch(() => {}); // Fail silently to avoid logging loops
    } catch {
      // Fail silently to avoid logging loops
    }
  }
}

export const logger = new Logger();