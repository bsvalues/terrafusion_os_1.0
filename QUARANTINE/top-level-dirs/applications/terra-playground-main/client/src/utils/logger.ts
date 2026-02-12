/**
 * Client-side logger utility
 *
 * Provides structured logging with different log levels and consistent formatting.
 * Designed to work well with the server-side logger for consistent logging patterns.
 */

// Log levels
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// Current log level - can be controlled by env vars or localstorage
const DEFAULT_LOG_LEVEL = LogLevel.INFO;

/**
 * Logger class with support for different log levels
 */
class Logger {
  private level: LogLevel;

  /**
   * Create a new logger
   */
  constructor() {
    // Determine log level from localStorage or environment
    this.level = this.getLogLevelFromConfig();
  }

  /**
   * Set the current log level
   */
  public setLevel(level: LogLevel | string): void {
    if (typeof level === 'string') {
      const levelMap: Record<string, LogLevel> = {
        debug: LogLevel.DEBUG,
        info: LogLevel.INFO,
        warn: LogLevel.WARN,
        error: LogLevel.ERROR,
        none: LogLevel.NONE,
      };
      this.level = levelMap[level.toLowerCase()] ?? DEFAULT_LOG_LEVEL;
    } else {
      this.level = level;
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('logLevel', this.level.toString());
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Get the current log level
   */
  public getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Log a debug message
   */
  public debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      this.log('debug', message, data);
    }
  }

  /**
   * Log an info message
   */
  public info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      this.log('info', message, data);
    }
  }

  /**
   * Log a warning message
   */
  public warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      this.log('warn', message, data);
    }
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: any): void {
    if (this.level <= LogLevel.ERROR) {
      // Format error object if provided
      let formattedError = error;
      if (error instanceof Error) {
        formattedError = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      }

      this.log('error', message, formattedError);
    }
  }

  /**
   * Internal method to log a message with a consistent format
   */
  private log(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logObj = {
      timestamp,
      level,
      message,
      data: data !== undefined ? data : null,
    };

    // Use appropriate console method based on level
    switch (level) {
      case 'debug':
        console.debug(message, data);
        break;
      case 'info':
        console.info(message, data);
        break;
      case 'warn':
        console.warn(message, data);
        break;
      case 'error':
        console.error(message, data);
        break;
      default:
    }

    // Emit a custom event for log aggregation if needed
    try {
      const logEvent = new CustomEvent('app:log', { detail: logObj });
      window.dispatchEvent(logEvent);
    } catch (e) {
      // Ignore event dispatch errors
    }
  }

  /**
   * Get log level from configuration (localStorage or env)
   */
  private getLogLevelFromConfig(): LogLevel {
    try {
      // Try localStorage first
      const storedLevel = localStorage.getItem('logLevel');
      if (storedLevel !== null) {
        const level = parseInt(storedLevel, 10);
        if (!isNaN(level) && level >= LogLevel.DEBUG && level <= LogLevel.NONE) {
          return level;
        }
      }

      // Fall back to environment variable
      if (typeof import.meta.env.VITE_LOG_LEVEL === 'string') {
        const levelMap: Record<string, LogLevel> = {
          debug: LogLevel.DEBUG,
          info: LogLevel.INFO,
          warn: LogLevel.WARN,
          error: LogLevel.ERROR,
          none: LogLevel.NONE,
        };

        const envLevel = (import.meta.env.VITE_LOG_LEVEL as string).toLowerCase();
        if (levelMap[envLevel] !== undefined) {
          return levelMap[envLevel];
        }
      }
    } catch (e) {
      // Ignore any errors and use default
    }

    return DEFAULT_LOG_LEVEL;
  }
}

// Export singleton instance
export const logger = new Logger();
