/**
 * Enhanced Logger for AI Swarm System
 * Provides structured logging with performance metrics
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: any;
  duration?: number;
}

export class Logger {
  private component: string;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(component: string, logLevel: LogLevel = LogLevel.INFO) {
    this.component = component;
    this.logLevel = logLevel;
  }

  public debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  public info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  public warn(message: string, metadata?: any): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  public error(message: string, metadata?: any): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  public timeStart(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.info(`${operation} completed`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component: this.component,
      message,
      metadata,
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with colors
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const colors = ['\x1b[36m', '\x1b[32m', '\x1b[33m', '\x1b[31m'];
    const reset = '\x1b[0m';

    const timestamp = entry.timestamp.toISOString().substr(11, 12);
    const levelStr = levelNames[level].padEnd(5);
    const componentStr = this.component.padEnd(20);

    console.log(
      `${colors[level]}[${timestamp}] ${levelStr} ${componentStr}${reset} ${message}${metadata ? ' ' + JSON.stringify(metadata) : ''}`
    );
  }

  public getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }
}
