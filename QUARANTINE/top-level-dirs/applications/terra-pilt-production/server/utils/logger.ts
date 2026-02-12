import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private logLevel: LogLevel;
  private logDir: string;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    switch (level) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  private writeToFile(filename: string, message: string): void {
    const filePath = path.join(this.logDir, filename);
    const logEntry = `${message}\n`;
    
    try {
      fs.appendFileSync(filePath, logEntry, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(level: LogLevel, levelName: string, message: string, meta?: any): void {
    if (level <= this.logLevel) {
      const formattedMessage = this.formatMessage(levelName, message, meta);
      
      console.log(formattedMessage);
      
      const today = new Date().toISOString().split('T')[0];
      this.writeToFile(`app-${today}.log`, formattedMessage);
      
      if (level === LogLevel.ERROR) {
        this.writeToFile(`error-${today}.log`, formattedMessage);
      }
    }
  }

  error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
  }

  security(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = this.formatMessage('SECURITY', message, meta);
    
    console.log(formattedMessage);
    
    const today = new Date().toISOString().split('T')[0];
    this.writeToFile(`security-${today}.log`, formattedMessage);
    this.writeToFile(`app-${today}.log`, formattedMessage);
  }

  audit(action: string, userId?: string, meta?: any): void {
    const auditData = {
      action,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      ...meta
    };
    
    const message = `Audit: ${action}`;
    const formattedMessage = this.formatMessage('AUDIT', message, auditData);
    
    console.log(formattedMessage);
    
    const today = new Date().toISOString().split('T')[0];
    this.writeToFile(`audit-${today}.log`, formattedMessage);
  }
}

export const logger = new Logger();