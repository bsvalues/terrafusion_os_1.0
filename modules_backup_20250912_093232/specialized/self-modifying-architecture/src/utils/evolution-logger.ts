/**
 * 📊 Evolution Logger - Self-Modifying Architecture Component
 * Comprehensive logging and monitoring for evolutionary processes
 */

export class EvolutionLogger {
  private logs: LogEntry[] = [];

  constructor() {
    console.log('📊 Evolution Logger initialized');
  }

  public log(level: LogLevel, message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: context || {},
      component: 'EvolutionLogger',
    };

    this.logs.push(entry);
    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  public getLogs(filter?: LogFilter): LogEntry[] {
    if (!filter) return this.logs;

    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.component && log.component !== filter.component) return false;
      if (filter.since && log.timestamp < filter.since) return false;
      return true;
    });
  }

  public clearLogs(): void {
    this.logs = [];
    console.log('📊 Evolution logs cleared');
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context: any;
  component: string;
}

interface LogFilter {
  level?: LogLevel;
  component?: string;
  since?: Date;
}
