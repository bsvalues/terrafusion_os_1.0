/**
 * Error Tracking Service
 *
 * A centralized service for handling, tracking, and reporting errors
 * throughout the TaxI_AI platform. This service categorizes errors,
 * logs them appropriately, and provides mechanisms for monitoring
 * error patterns.
 */

import { IStorage } from '../storage';
import { logger } from '../utils/logger';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  DATABASE = 'database',
  NETWORK = 'network',
  AGENT = 'agent',
  GIS = 'gis',
  SECURITY = 'security',
  VALIDATION = 'validation',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
  TASK_PROCESSING = 'task_processing',
  CONVERSION = 'conversion',
  LOGGING = 'logging',
  LIFECYCLE = 'lifecycle',
}

// Error source components
export enum ErrorSource {
  AGENT_SYSTEM = 'agent_system',
  GIS_SYSTEM = 'gis_system',
  DATABASE = 'database',
  API = 'api',
  UI = 'ui',
  AUTHENTICATION = 'authentication',
  EXTERNAL_SERVICE = 'external_service',
  AGENT = 'agent',
  INTERNAL = 'internal',
  SYSTEM = 'system',
}

// Structured error interface
export interface StructuredError {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  source: ErrorSource;
  timestamp: Date;
  details?: any;
  stackTrace?: string;
  userId?: number;
  correlationId?: string;
  agentId?: string;
  resolved?: boolean;
}

/**
 * Error Tracking Service class
 */
export class ErrorTrackingService {
  private storage: IStorage;
  private errorBuffer: StructuredError[] = [];
  private bufferSize: number = 50;
  private flushInterval: number = 60000; // 1 minute
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(storage: IStorage, options?: { bufferSize?: number; flushInterval?: number }) {
    this.storage = storage;

    if (options) {
      this.bufferSize = options.bufferSize || this.bufferSize;
      this.flushInterval = options.flushInterval || this.flushInterval;
    }

    // Start periodic flushing
    this.startPeriodicFlush();
  }

  /**
   * Track an error with the service
   */
  public trackError(
    error: Error | unknown,
    options: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      source?: ErrorSource;
      details?: any;
      userId?: number;
      correlationId?: string;
      agentId?: string;
    }
  ): StructuredError {
    const errorObject = error instanceof Error ? error : new Error(String(error));

    const structuredError: StructuredError = {
      message: errorObject.message,
      category: options.category || ErrorCategory.UNKNOWN,
      severity: options.severity || ErrorSeverity.MEDIUM,
      source: options.source || ErrorSource.SYSTEM,
      timestamp: new Date(),
      details: options.details,
      stackTrace: errorObject.stack,
      userId: options.userId,
      correlationId: options.correlationId,
      agentId: options.agentId,
      resolved: false,
    };

    // Log the error based on severity
    switch (structuredError.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error({
          component: 'ErrorTrackingService',
          message: `${structuredError.category.toUpperCase()} ERROR: ${structuredError.message}`,
          error: structuredError,
        });
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn({
          component: 'ErrorTrackingService',
          message: `${structuredError.category}: ${structuredError.message}`,
          error: structuredError,
        });
        break;
      case ErrorSeverity.LOW:
        logger.info({
          component: 'ErrorTrackingService',
          message: `Minor issue (${structuredError.category}): ${structuredError.message}`,
          error: structuredError,
        });
        break;
    }

    // Add to buffer
    this.errorBuffer.push(structuredError);

    // If buffer is full, flush to database
    if (this.errorBuffer.length >= this.bufferSize) {
      this.flushErrors();
    }

    // For critical errors, always flush immediately
    if (structuredError.severity === ErrorSeverity.CRITICAL) {
      this.flushErrors();
    }

    return structuredError;
  }

  /**
   * Track a database-related error
   */
  public trackDatabaseError(
    error: Error | unknown,
    details?: any,
    severity: ErrorSeverity = ErrorSeverity.HIGH
  ): StructuredError {
    return this.trackError(error, {
      category: ErrorCategory.DATABASE,
      severity,
      source: ErrorSource.DATABASE,
      details,
    });
  }

  /**
   * Track an agent-related error
   */
  public trackAgentError(
    error: Error | unknown,
    agentId: string,
    details?: any,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): StructuredError {
    return this.trackError(error, {
      category: ErrorCategory.AGENT,
      severity,
      source: ErrorSource.AGENT_SYSTEM,
      details,
      agentId,
    });
  }

  /**
   * Track a GIS-related error
   */
  public trackGisError(
    error: Error | unknown,
    details?: any,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): StructuredError {
    return this.trackError(error, {
      category: ErrorCategory.GIS,
      severity,
      source: ErrorSource.GIS_SYSTEM,
      details,
    });
  }

  /**
   * Track a security-related error
   */
  public trackSecurityError(
    error: Error | unknown,
    userId?: number,
    details?: any,
    severity: ErrorSeverity = ErrorSeverity.HIGH
  ): StructuredError {
    return this.trackError(error, {
      category: ErrorCategory.SECURITY,
      severity,
      source: ErrorSource.AUTHENTICATION,
      details,
      userId,
    });
  }

  /**
   * Flush buffered errors to database
   */
  public async flushErrors(): Promise<void> {
    if (this.errorBuffer.length === 0) {
      return;
    }

    const errorsToFlush = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      // Store errors in the database
      await Promise.all(
        errorsToFlush.map(async error => {
          await this.storage.createSystemActivity({
            activity: 'error_tracked',
            entityType: error.category,
            entityId: error.correlationId || `error-${error.timestamp.getTime()}`,
            component: error.source,
            details: JSON.stringify({
              message: error.message,
              severity: error.severity,
              source: error.source,
              timestamp: error.timestamp,
              details: error.details,
              stackTrace: error.stackTrace,
              userId: error.userId,
              agentId: error.agentId,
              resolved: error.resolved,
            }),
          });
        })
      );

      logger.info({
        component: 'ErrorTrackingService',
        message: `Flushed ${errorsToFlush.length} errors to database`,
      });
    } catch (error) {
      // If we can't store errors, log it but don't create infinite loop
      logger.error({
        component: 'ErrorTrackingService',
        message: 'Failed to flush errors to database',
        error,
      });
    }
  }

  /**
   * Start periodic flushing of errors
   */
  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushErrors();
    }, this.flushInterval);
  }

  /**
   * Stop periodic flushing
   */
  public stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get error summary statistics
   */
  public async getErrorStats(): Promise<{
    totalErrors: number;
    categoryCounts: Record<ErrorCategory, number>;
    severityCounts: Record<ErrorSeverity, number>;
    sourceCounts: Record<ErrorSource, number>;
    recentErrors: number;
    resolvedCount: number;
    unresolvedCount: number;
  }> {
    try {
      // Get system activities related to errors
      const errorActivities = await this.storage.getSystemActivitiesByType('error_tracked');

      // Parse details from activities
      const errors = errorActivities
        .map(activity => {
          try {
            return JSON.parse(activity.details);
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      // Calculate statistics
      const categoryCounts: Record<ErrorCategory, number> = {
        [ErrorCategory.DATABASE]: 0,
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.AGENT]: 0,
        [ErrorCategory.GIS]: 0,
        [ErrorCategory.SECURITY]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.SYSTEM]: 0,
        [ErrorCategory.UNKNOWN]: 0,
        [ErrorCategory.TASK_PROCESSING]: 0,
        [ErrorCategory.CONVERSION]: 0,
        [ErrorCategory.LOGGING]: 0,
        [ErrorCategory.LIFECYCLE]: 0,
      };

      const severityCounts: Record<ErrorSeverity, number> = {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      };

      const sourceCounts: Record<ErrorSource, number> = {
        [ErrorSource.AGENT_SYSTEM]: 0,
        [ErrorSource.GIS_SYSTEM]: 0,
        [ErrorSource.DATABASE]: 0,
        [ErrorSource.API]: 0,
        [ErrorSource.UI]: 0,
        [ErrorSource.AUTHENTICATION]: 0,
        [ErrorSource.EXTERNAL_SERVICE]: 0,
        [ErrorSource.AGENT]: 0,
        [ErrorSource.INTERNAL]: 0,
        [ErrorSource.SYSTEM]: 0,
      };

      let resolvedCount = 0;
      let unresolvedCount = 0;

      // Calculate counts
      errors.forEach(error => {
        if (error.category && categoryCounts[error.category] !== undefined) {
          categoryCounts[error.category]++;
        } else {
          categoryCounts[ErrorCategory.UNKNOWN]++;
        }

        if (error.severity && severityCounts[error.severity] !== undefined) {
          severityCounts[error.severity]++;
        } else {
          severityCounts[ErrorSeverity.MEDIUM]++;
        }

        if (error.source && sourceCounts[error.source] !== undefined) {
          sourceCounts[error.source]++;
        } else {
          sourceCounts[ErrorSource.SYSTEM]++;
        }

        if (error.resolved) {
          resolvedCount++;
        } else {
          unresolvedCount++;
        }
      });

      // Get count of recent errors (within last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentErrors = errors.filter(error => {
        const errorDate = new Date(error.timestamp);
        return errorDate > oneDayAgo;
      }).length;

      return {
        totalErrors: errors.length,
        categoryCounts,
        severityCounts,
        sourceCounts,
        recentErrors,
        resolvedCount,
        unresolvedCount,
      };
    } catch (error) {
      logger.error({
        component: 'ErrorTrackingService',
        message: 'Failed to get error statistics',
        error,
      });

      // Return empty stats in case of error
      return {
        totalErrors: 0,
        categoryCounts: {
          [ErrorCategory.DATABASE]: 0,
          [ErrorCategory.NETWORK]: 0,
          [ErrorCategory.AGENT]: 0,
          [ErrorCategory.GIS]: 0,
          [ErrorCategory.SECURITY]: 0,
          [ErrorCategory.VALIDATION]: 0,
          [ErrorCategory.SYSTEM]: 0,
          [ErrorCategory.UNKNOWN]: 0,
          [ErrorCategory.TASK_PROCESSING]: 0,
          [ErrorCategory.CONVERSION]: 0,
          [ErrorCategory.LOGGING]: 0,
          [ErrorCategory.LIFECYCLE]: 0,
        },
        severityCounts: {
          [ErrorSeverity.LOW]: 0,
          [ErrorSeverity.MEDIUM]: 0,
          [ErrorSeverity.HIGH]: 0,
          [ErrorSeverity.CRITICAL]: 0,
        },
        sourceCounts: {
          [ErrorSource.AGENT_SYSTEM]: 0,
          [ErrorSource.GIS_SYSTEM]: 0,
          [ErrorSource.DATABASE]: 0,
          [ErrorSource.API]: 0,
          [ErrorSource.UI]: 0,
          [ErrorSource.AUTHENTICATION]: 0,
          [ErrorSource.EXTERNAL_SERVICE]: 0,
          [ErrorSource.AGENT]: 0,
          [ErrorSource.INTERNAL]: 0,
          [ErrorSource.SYSTEM]: 0,
        },
        recentErrors: 0,
        resolvedCount: 0,
        unresolvedCount: 0,
      };
    }
  }

  /**
   * Resolve an error by ID
   */
  public async resolveError(errorId: string): Promise<boolean> {
    try {
      const activity = await this.storage.getSystemActivityById(errorId);

      if (!activity) {
        return false;
      }

      try {
        const errorDetails = JSON.parse(activity.details);
        errorDetails.resolved = true;

        await this.storage.updateSystemActivity(errorId, {
          details: JSON.stringify(errorDetails),
        });

        return true;
      } catch (error) {
        logger.error({
          component: 'ErrorTrackingService',
          message: `Failed to parse error details for ID ${errorId}`,
          error,
        });
        return false;
      }
    } catch (error) {
      logger.error({
        component: 'ErrorTrackingService',
        message: `Failed to resolve error with ID ${errorId}`,
        error,
      });
      return false;
    }
  }
}

// Export a singleton instance
export const errorTrackingService = (storage: IStorage) => new ErrorTrackingService(storage);
