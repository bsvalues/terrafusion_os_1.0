/**
 * 📊 Terrafusion OS 1.0 - Enhanced Logger
 * Production-grade logging with structured output and performance monitoring
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  metadata?: any;
  quantumCoherence?: number;
  agentId?: string;
  performanceMetrics?: any;
}

export class Logger {
  private module: string;
  private minLevel: LogLevel = LogLevel.INFO;
  private logBuffer: LogEntry[] = [];

  constructor(module: string, minLevel: LogLevel = LogLevel.INFO) {
    this.module = module;
    this.minLevel = minLevel;
  }

  debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, metadata?: any): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  critical(message: string, metadata?: any): void {
    this.log(LogLevel.CRITICAL, message, metadata);
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      metadata
    };

    this.logBuffer.push(entry);
    this.outputLog(entry);

    // Keep buffer size manageable
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-500);
    }
  }

  private outputLog(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const levelColors = ['\x1b[36m', '\x1b[32m', '\x1b[33m', '\x1b[31m', '\x1b[35m'];
    const resetColor = '\x1b[0m';

    const coloredLevel = `${levelColors[entry.level]}[${levelNames[entry.level]}]${resetColor}`;
    const output = `${entry.timestamp} ${coloredLevel} [${entry.module}] ${entry.message}`;

    if (entry.level >= LogLevel.ERROR) {
      console.error(output, entry.metadata || '');
    } else {
      console.log(output, entry.metadata || '');
    }
  }

  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }
}

export default Logger;
