/**
 * 📊 Research Logger - Advanced logging system for autonomous research
 * 
 * Comprehensive logging and monitoring system for AI-driven research activities,
 * providing detailed tracking of discoveries, breakthroughs, and research progress.
 */

import * as winston from 'winston';
import * as path from 'path';

export interface ResearchLogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: any;
  researchId?: string;
  projectId?: string;
  breakthroughLevel?: number;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  BREAKTHROUGH = 'breakthrough',
  DISCOVERY = 'discovery'
}

export interface LoggerConfig {
  logLevel: LogLevel;
  logDirectory: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableBreakthroughAlerts: boolean;
  rotationSettings: LogRotationSettings;
}

export interface LogRotationSettings {
  maxSize: string;
  maxFiles: number;
  datePattern: string;
}

/**
 * 🔍 Research Logger - Specialized logging for autonomous research
 */
export class ResearchLogger {
  private winston: winston.Logger;
  private component: string;
  private config: LoggerConfig;

  constructor(component: string, config?: Partial<LoggerConfig>) {
    this.component = component;
    this.config = this.mergeConfig(config);
    this.winston = this.createWinstonLogger();
  }

  /**
   * 📝 Log Info - Standard information logging
   */
  info(message: string, metadata?: any, researchId?: string): void {
    this.log(LogLevel.INFO, message, metadata, researchId);
  }

  /**
   * ⚠️ Log Warning - Warning level logging
   */
  warn(message: string, metadata?: any, researchId?: string): void {
    this.log(LogLevel.WARN, message, metadata, researchId);
  }

  /**
   * ❌ Log Error - Error level logging
   */
  error(message: string, error?: any, researchId?: string): void {
    const metadata = error ? { error: error.toString(), stack: error.stack } : undefined;
    this.log(LogLevel.ERROR, message, metadata, researchId);
  }

  /**
   * 🐛 Log Debug - Debug level logging
   */
  debug(message: string, metadata?: any, researchId?: string): void {
    this.log(LogLevel.DEBUG, message, metadata, researchId);
  }

  /**
   * 🌟 Log Breakthrough - Special logging for breakthrough discoveries
   */
  breakthrough(message: string, breakthroughLevel: number, metadata?: any, researchId?: string): void {
    this.log(LogLevel.BREAKTHROUGH, message, metadata, researchId, breakthroughLevel);
    
    if (this.config.enableBreakthroughAlerts) {
      this.sendBreakthroughAlert(message, breakthroughLevel, researchId);
    }
  }

  /**
   * 💡 Log Discovery - Special logging for research discoveries
   */
  discovery(message: string, significance: number, metadata?: any, researchId?: string): void {
    this.log(LogLevel.DISCOVERY, message, { ...metadata, significance }, researchId);
  }

  /**
   * 📊 Log Research Progress - Track research project progress
   */
  researchProgress(
    projectId: string, 
    progress: number, 
    phase: string, 
    insights: string[], 
    metadata?: any
  ): void {
    this.log(
      LogLevel.INFO, 
      `Research Progress: ${phase} - ${(progress * 100).toFixed(1)}%`,
      { 
        ...metadata, 
        progress, 
        phase, 
        insights,
        progressType: 'research_tracking'
      },
      projectId
    );
  }

  /**
   * 🔬 Log Experiment - Track experimental procedures
   */
  experiment(
    experimentId: string,
    action: string,
    results: any,
    confidence: number,
    metadata?: any
  ): void {
    this.log(
      LogLevel.INFO,
      `Experiment ${action}: ${experimentId}`,
      {
        ...metadata,
        experimentId,
        action,
        results,
        confidence,
        logType: 'experiment'
      }
    );
  }

  /**
   * 🧠 Log AI Decision - Track AI decision-making processes
   */
  aiDecision(
    decision: string,
    reasoning: string,
    confidence: number,
    alternatives: string[],
    metadata?: any
  ): void {
    this.log(
      LogLevel.INFO,
      `AI Decision: ${decision}`,
      {
        ...metadata,
        decision,
        reasoning,
        confidence,
        alternatives,
        logType: 'ai_decision'
      }
    );
  }

  /**
   * 📈 Log Performance Metrics - Track system performance
   */
  performance(
    metric: string,
    value: number,
    unit: string,
    threshold?: number,
    metadata?: any
  ): void {
    const level = threshold && value > threshold ? LogLevel.WARN : LogLevel.DEBUG;
    
    this.log(
      level,
      `Performance Metric: ${metric} = ${value} ${unit}`,
      {
        ...metadata,
        metric,
        value,
        unit,
        threshold,
        logType: 'performance'
      }
    );
  }

  /**
   * 🔄 Log Research Iteration - Track iterative research cycles
   */
  researchIteration(
    iteration: number,
    hypothesis: string,
    results: any,
    nextSteps: string[],
    metadata?: any
  ): void {
    this.log(
      LogLevel.INFO,
      `Research Iteration ${iteration}: ${hypothesis.substring(0, 100)}...`,
      {
        ...metadata,
        iteration,
        hypothesis,
        results,
        nextSteps,
        logType: 'research_iteration'
      }
    );
  }

  // Private implementation methods

  private log(
    level: LogLevel, 
    message: string, 
    metadata?: any, 
    researchId?: string, 
    breakthroughLevel?: number
  ): void {
    const logEntry: ResearchLogEntry = {
      timestamp: new Date(),
      level,
      component: this.component,
      message,
      metadata,
      ...(researchId !== undefined && { researchId }),
      ...(breakthroughLevel !== undefined && { breakthroughLevel })
    };

    // Use Winston for actual logging
    this.winston.log(level, message, {
      component: this.component,
      timestamp: logEntry.timestamp.toISOString(),
      metadata,
      researchId,
      breakthroughLevel
    });

    // Additional processing for special log types
    if (level === LogLevel.BREAKTHROUGH || level === LogLevel.DISCOVERY) {
      this.processSpecialLog(logEntry);
    }
  }

  private createWinstonLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.enableConsole) {
      transports.push(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, component, metadata }) => {
            const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
            return `${timestamp} [${level}] [${component}] ${message}${metaStr}`;
          })
        )
      }));
    }

    // File transport
    if (this.config.enableFile) {
      transports.push(new winston.transports.File({
        filename: path.join(this.config.logDirectory, 'research.log'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        maxsize: this.parseSize(this.config.rotationSettings.maxSize),
        maxFiles: this.config.rotationSettings.maxFiles
      }));

      // Separate file for breakthroughs
      transports.push(new winston.transports.File({
        filename: path.join(this.config.logDirectory, 'breakthroughs.log'),
        level: 'breakthrough',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));
    }

    return winston.createLogger({
      level: this.config.logLevel,
      transports,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    });
  }

  private mergeConfig(config?: Partial<LoggerConfig>): LoggerConfig {
    const defaultConfig: LoggerConfig = {
      logLevel: LogLevel.INFO,
      logDirectory: './logs',
      enableConsole: true,
      enableFile: true,
      enableBreakthroughAlerts: true,
      rotationSettings: {
        maxSize: '100MB',
        maxFiles: 10,
        datePattern: 'YYYY-MM-DD'
      }
    };

    return { ...defaultConfig, ...config };
  }

  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+)(MB|GB|KB)?$/i);
    if (!match || !match[1]) return 100 * 1024 * 1024; // Default 100MB

    const size = parseInt(match[1], 10);
    const unit = (match[2] || 'MB').toUpperCase();

    switch (unit) {
      case 'KB': return size * 1024;
      case 'MB': return size * 1024 * 1024;
      case 'GB': return size * 1024 * 1024 * 1024;
      default: return size;
    }
  }

  private processSpecialLog(logEntry: ResearchLogEntry): void {
    // Additional processing for breakthrough and discovery logs
    if (logEntry.level === LogLevel.BREAKTHROUGH) {
      this.archiveBreakthrough(logEntry);
    }

    if (logEntry.level === LogLevel.DISCOVERY) {
      this.trackDiscovery(logEntry);
    }
  }

  private archiveBreakthrough(logEntry: ResearchLogEntry): void {
    // Archive breakthrough for long-term analysis
    // Implementation would include database storage, notification systems, etc.
    console.log(`🌟 BREAKTHROUGH ARCHIVED: ${logEntry.message}`);
  }

  private trackDiscovery(logEntry: ResearchLogEntry): void {
    // Track discovery in research metrics
    // Implementation would include metrics collection, trend analysis, etc.
    console.log(`💡 DISCOVERY TRACKED: ${logEntry.message}`);
  }

  private sendBreakthroughAlert(message: string, level: number, researchId?: string): void {
    // Send breakthrough alert to monitoring systems
    // Implementation would include email, Slack, dashboard notifications, etc.
    console.log(`🚨 BREAKTHROUGH ALERT (Level ${level}): ${message} [Research: ${researchId}]`);
  }
}

export default ResearchLogger;
