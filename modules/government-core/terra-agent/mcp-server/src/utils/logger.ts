/**
 * Logger utility for TerraAgent MCP Server
 * Production-grade logging with structured output
 */

import winston from 'winston';
import { ConfigManager } from '../config/config-manager.js';

export class Logger {
  private static instance: Logger;
  private winston: winston.Logger;
  private config: any;

  private constructor() {
    this.config = ConfigManager.getInstance().getConfig().logging;
    this.winston = this.createLogger();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogger(): winston.Logger {
    const formats = [];

    // Add timestamp
    formats.push(winston.format.timestamp());

    // Add error stack traces
    formats.push(winston.format.errors({ stack: true }));

    // Format based on configuration
    if (this.config.format === 'json') {
      formats.push(winston.format.json());
    } else {
      formats.push(
        winston.format.printf((info: any) => {
          const { timestamp, level, message, ...meta } = info;
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
        })
      );
    }

    const transports: winston.transport[] = [
      new winston.transports.Console({
        level: this.config.level,
        format: winston.format.combine(...formats),
      }),
    ];

    // Add file transport if configured
    if (this.config.file) {
      transports.push(
        new winston.transports.File({
          filename: this.config.file,
          level: this.config.level,
          format: winston.format.combine(...formats),
        })
      );
    }

    return winston.createLogger({
      level: this.config.level,
      transports,
      defaultMeta: {
        service: 'terra-agent-mcp-server',
      },
    });
  }

  public debug(message: string, meta?: any): void {
    this.winston.debug(message, meta);
  }

  public info(message: string, meta?: any): void {
    this.winston.info(message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.winston.warn(message, meta);
  }

  public error(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      this.winston.error(message, { error: error.message, stack: error.stack });
    } else {
      this.winston.error(message, error);
    }
  }

  public child(meta: any): Logger {
    const childLogger = new Logger();
    childLogger.winston = this.winston.child(meta);
    return childLogger;
  }
}
