/**
 * TerraFusion OS Logging Utility
 * Centralized logging system for the TerraFusion platform
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  category?: string;
  metadata?: Record<string, unknown>;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public debug(message: string, category?: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, category, metadata);
  }

  public info(message: string, category?: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, category, metadata);
  }

  public warn(message: string, category?: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, category, metadata);
  }

  public error(message: string, category?: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, category, metadata);
  }

  private log(
    level: LogLevel,
    message: string,
    category?: string,
    metadata?: Record<string, unknown>
  ): void {
    if (level < this.logLevel) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      category,
      metadata,
    };

    this.logs.push(logEntry);

    // Output to console in development
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      const levelStr = Object.keys(LogLevel)[Object.values(LogLevel).indexOf(level)];
      const categoryStr = category ? `[${category}] ` : '';
      const timestamp = logEntry.timestamp.toISOString();

      // eslint-disable-next-line no-console
      console.log(`${timestamp} ${levelStr}: ${categoryStr}${message}`);

      if (metadata) {
        // eslint-disable-next-line no-console
        console.log('Metadata:', metadata);
      }
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
