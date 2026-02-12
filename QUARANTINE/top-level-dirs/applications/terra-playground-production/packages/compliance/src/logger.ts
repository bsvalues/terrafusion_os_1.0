/**
 * Logger for the compliance module
 *
 * Provides structured logging capabilities with appropriate
 * security and privacy controls for compliance-related logs.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  component: string;
  data?: Record<string, any>;
}

export interface LogStorage {
  store(entry: LogEntry): Promise<void>;
  query(filter: Partial<LogEntry>, limit?: number): Promise<LogEntry[]>;
}

/**
 * Logger implementation for compliance modules
 */
export class Logger {
  private component: string;
  private storage?: LogStorage;
  private handlers: ((entry: LogEntry) => void)[] = [];

  constructor(component: string, storage?: LogStorage) {
    this.component = component;
    this.storage = storage;
  }

  /**
   * Add a log handler to process log entries
   */
  public addHandler(handler: (entry: LogEntry) => void): void {
    this.handlers.push(handler);
  }

  /**
   * Log a debug message
   */
  public debug(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   */
  public info(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   */
  public error(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Create a log entry and process it
   */
  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      component: this.component,
      data,
    };

    // Process the log entry
    this.process(entry);
  }

  /**
   * Process a log entry
   */
  private async process(entry: LogEntry): Promise<void> {
    // Call all handlers
    for (const handler of this.handlers) {
      try {
        handler(entry);
      } catch (error) {
        console.error('Error in log handler:', error);
      }
    }

    // Store the log entry if storage is configured
    if (this.storage) {
      try {
        await this.storage.store(entry);
      } catch (error) {
        console.error('Error storing log entry:', error);
      }
    }
  }
}

/**
 * Create a new logger instance
 */
export function createLogger(component: string, storage?: LogStorage): Logger {
  return new Logger(component, storage);
}

/**
 * In-memory log storage for testing and development
 */
export class InMemoryLogStorage implements LogStorage {
  private logs: LogEntry[] = [];

  /**
   * Store a log entry
   */
  public async store(entry: LogEntry): Promise<void> {
    this.logs.push(entry);
  }

  /**
   * Query log entries
   */
  public async query(filter: Partial<LogEntry>, limit?: number): Promise<LogEntry[]> {
    let results = this.logs;

    // Apply filters
    if (filter.level) {
      results = results.filter(entry => entry.level === filter.level);
    }

    if (filter.component) {
      results = results.filter(entry => entry.component === filter.component);
    }

    // Apply limit
    if (limit && limit > 0) {
      results = results.slice(0, limit);
    }

    return results;
  }

  /**
   * Clear all logs
   */
  public clear(): void {
    this.logs = [];
  }
}
