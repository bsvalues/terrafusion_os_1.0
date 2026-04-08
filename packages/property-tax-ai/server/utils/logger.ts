/**
 * Logging Utility
 * 
 * Provides structured logging for the application with severity levels,
 * component tagging, and optional metadata.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

interface LogOptions {
  component?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export class Logger {
  private static instance: Logger;
  private isProduction: boolean;
  
  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }
  
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * Log a message with the specified level
   */
  public log(level: LogLevel, message: string, options: LogOptions = {}): void {
    const timestamp = options.timestamp || new Date();
    const component = options.component || 'app';
    const metadata = options.metadata || {};
    
    const logEntry = {
      timestamp: timestamp.toISOString(),
      level,
      component,
      message,
      ...metadata
    };
    
    // In production, we would send to a logging service
    // For now, we just log to console with appropriate method
    switch (level) {
      case LogLevel.DEBUG:
        if (!this.isProduction) {
          console.debug(JSON.stringify(logEntry));
        }
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logEntry));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logEntry));
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(JSON.stringify(logEntry));
        break;
    }
    
    // For critical errors in production, we might want to notify
    if (level === LogLevel.CRITICAL && this.isProduction) {
      // Implement critical error notification
      // This could be an email, SMS, or monitoring service alert
    }
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string, options: LogOptions = {}): void {
    this.log(LogLevel.DEBUG, message, options);
  }
  
  /**
   * Log an info message
   */
  public info(message: string, options: LogOptions = {}): void {
    this.log(LogLevel.INFO, message, options);
  }
  
  /**
   * Log a warning message
   */
  public warn(message: string, options: LogOptions = {}): void {
    this.log(LogLevel.WARN, message, options);
  }
  
  /**
   * Log an error message
   */
  public error(message: string, options: LogOptions = {}): void {
    this.log(LogLevel.ERROR, message, options);
  }
  
  /**
   * Log a critical error message
   */
  public critical(message: string, options: LogOptions = {}): void {
    this.log(LogLevel.CRITICAL, message, options);
  }
  
  /**
   * Log an error object with context
   */
  public logError(error: unknown, component: string, metadata: Record<string, any> = {}): void {
    let message = 'An error occurred';
    let level = LogLevel.ERROR;
    
    if (error instanceof Error) {
      message = error.message;
      // Include stack trace in development
      if (!this.isProduction) {
        metadata.stack = error.stack;
      }
    } else if (typeof error === 'string') {
      message = error;
    }
    
    // Determine if it's a critical error based on metadata or error type
    if (metadata.critical) {
      level = LogLevel.CRITICAL;
    }
    
    this.log(level, message, { component, metadata });
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();