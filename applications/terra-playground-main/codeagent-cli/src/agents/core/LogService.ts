/**
 * LogService.ts
 *
 * Provides logging functionality for agents
 */

// Logging levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Log entry structure
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: Record<string, any>;
}

// Global log listener type
type LogListener = (entry: LogEntry) => void;

/**
 * LogService for agent logging
 */
export class LogService {
  private component: string;
  private minLevel: LogLevel;
  private static listeners: LogListener[] = [];
  private static entries: LogEntry[] = [];
  private static maxEntries: number = 1000;

  /**
   * Constructor
   * @param component Component name for logs
   * @param minLevel Minimum log level to record (defaults to INFO)
   */
  constructor(component: string, minLevel: LogLevel = LogLevel.INFO) {
    this.component = component;
    this.minLevel = minLevel;
  }

  /**
   * Add a global log listener
   * @param listener Function to call for each log entry
   */
  public static addListener(listener: LogListener): void {
    LogService.listeners.push(listener);
  }

  /**
   * Remove a global log listener
   * @param listener Listener to remove
   */
  public static removeListener(listener: LogListener): void {
    const index = LogService.listeners.indexOf(listener);
    if (index !== -1) {
      LogService.listeners.splice(index, 1);
    }
  }

  /**
   * Clear all global log listeners
   */
  public static clearListeners(): void {
    LogService.listeners = [];
  }

  /**
   * Get recent log entries
   * @param count Maximum number of entries to return
   */
  public static getEntries(count: number = 100): LogEntry[] {
    return LogService.entries.slice(-Math.min(count, LogService.entries.length));
  }

  /**
   * Set maximum number of log entries to keep
   * @param maxEntries Maximum number of entries
   */
  public static setMaxEntries(maxEntries: number): void {
    LogService.maxEntries = maxEntries;
    // Trim entries if needed
    if (LogService.entries.length > maxEntries) {
      LogService.entries = LogService.entries.slice(-maxEntries);
    }
  }

  /**
   * Clear all log entries
   */
  public static clearEntries(): void {
    LogService.entries = [];
  }

  /**
   * Log a message at DEBUG level
   * @param message Message to log
   * @param metadata Optional metadata
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log a message at INFO level
   * @param message Message to log
   * @param metadata Optional metadata
   */
  public info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a message at WARN level
   * @param message Message to log
   * @param metadata Optional metadata
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log a message at ERROR level
   * @param message Message to log
   * @param metadata Optional metadata
   */
  public error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Set minimum log level for this instance
   * @param level Minimum log level
   */
  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Get minimum log level for this instance
   */
  public getMinLevel(): LogLevel {
    return this.minLevel;
  }

  /**
   * Internal method to log a message
   * @param level Log level
   * @param message Message to log
   * @param metadata Optional metadata
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    // Skip if below minimum level
    if (level < this.minLevel) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component: this.component,
      message,
      metadata,
    };

    // Add to entries
    LogService.entries.push(entry);

    // Trim if needed
    if (LogService.entries.length > LogService.maxEntries) {
      LogService.entries.shift();
    }

    // Notify listeners
    for (const listener of LogService.listeners) {
      try {
        listener(entry);
      } catch (error) {
        // Avoid crashing if a listener fails
        console.error(
          `Error in log listener: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Also output to console
    this.consoleOutput(entry);
  }

  /**
   * Output a log entry to the console
   * @param entry Log entry to output
   */
  private consoleOutput(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const component = entry.component;
    const message = entry.message;
    const metadataStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`[${timestamp}] [${component}] ${message}${metadataStr}`);
        break;
      case LogLevel.INFO:
        console.info(`[${timestamp}] [${component}] ${message}${metadataStr}`);
        break;
      case LogLevel.WARN:
        console.warn(`[${timestamp}] [${component}] ${message}${metadataStr}`);
        break;
      case LogLevel.ERROR:
        console.error(`[${timestamp}] [${component}] ${message}${metadataStr}`);
        break;
    }
  }
}
