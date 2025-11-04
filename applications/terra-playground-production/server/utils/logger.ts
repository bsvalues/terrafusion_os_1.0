/**
 * Server-side logging utility
 *
 * A centralized logging system with consistent formatting,
 * configurable log levels, and structured log output.
 */

// Define log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// Map log level strings to numeric values
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  none: LogLevel.NONE,
};

// Default log level
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;

/**
 * Logger class with support for different log levels and structured output
 */
export class Logger {
  private level: LogLevel;
  private context: string;

  /**
   * Create a new logger instance
   */
  constructor(context: string) {
    this.context = context;
    this.level = this.getLogLevelFromEnv();
  }

  /**
   * Set the current log level
   * @param level Log level to set
   */
  public setLevel(level: LogLevel | string): void {
    if (typeof level === 'string') {
      const levelValue = LOG_LEVEL_MAP[level.toLowerCase()];
      if (levelValue !== undefined) {
        this.level = levelValue;
      }
    } else if (typeof level === 'number' && level >= LogLevel.DEBUG && level <= LogLevel.NONE) {
      this.level = level;
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
   * @param message Message to log
   * @param data Additional data to include
   */
  public debug(message: string, metadata?: Record<string, unknown>): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[${this.context}] DEBUG: ${message}`, metadata || '');
    }
  }

  /**
   * Log an informational message
   * @param message Message to log
   * @param data Additional data to include
   */
  public info(message: string, metadata?: Record<string, unknown>): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[${this.context}] INFO: ${message}`, metadata || '');
    }
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param data Additional data to include
   */
  public warn(message: string, metadata?: Record<string, unknown>): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[${this.context}] WARN: ${message}`, metadata || '');
    }
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param error Error object or additional data
   */
  public error(message: string, metadata?: Record<string, unknown>): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[${this.context}] ERROR: ${message}`, metadata || '');
    }
  }

  /**
   * Get log level from environment variable
   */
  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL;

    if (envLevel && LOG_LEVEL_MAP[envLevel.toLowerCase()] !== undefined) {
      return LOG_LEVEL_MAP[envLevel.toLowerCase()];
    }

    return DEFAULT_LOG_LEVEL;
  }
}

// Export singleton instance
export const logger = new Logger('app');
