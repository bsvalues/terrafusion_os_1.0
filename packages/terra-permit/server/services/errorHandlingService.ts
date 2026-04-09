/**
 * Error Handling Service
 * This service provides advanced error handling capabilities including retry mechanisms,
 * error classification, and logging for the application.
 */

export enum ErrorSeverity {
  LOW = 'low',       // Non-critical errors that don't affect core functionality
  MEDIUM = 'medium', // Errors that affect some functionality but allow the system to continue
  HIGH = 'high',     // Critical errors that may require immediate attention
  FATAL = 'fatal'    // Errors that prevent the system from functioning
}

export enum ErrorCategory {
  DATABASE = 'database',         // Database connection or query errors
  AUTHENTICATION = 'auth',       // Authentication or authorization errors
  EXTERNAL_API = 'external_api', // External API connection or response errors
  VALIDATION = 'validation',     // Data validation errors
  PROCESSING = 'processing',     // Data processing errors
  SYSTEM = 'system',             // System-level errors
  NETWORK = 'network',           // Network-related errors
  UNKNOWN = 'unknown'            // Uncategorized errors
}

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: Record<string, any>;
  handled: boolean;
  retryCount?: number;
}

/**
 * Options for retry operations
 */
export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableErrors?: ErrorCategory[];
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  onSuccess?: (result: any, attempts: number) => void;
  onFailure?: (error: Error, attempts: number) => void;
}

/**
 * ErrorHandlingService provides advanced error handling capabilities
 */
export class ErrorHandlingService {
  private errorLog: ErrorLogEntry[] = [];
  private readonly MAX_LOG_SIZE = 1000; // Maximum number of error logs to keep
  private readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffFactor: 2,
    retryableErrors: [
      ErrorCategory.DATABASE,
      ErrorCategory.EXTERNAL_API,
      ErrorCategory.NETWORK
    ]
  };
  
  constructor() {
    // Register global error handler for uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH, { uncaught: true });
      // Don't exit the process, just log the error
    });
    
    // Register global error handler for unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logError(
        reason instanceof Error ? reason : new Error(String(reason)),
        ErrorCategory.SYSTEM,
        ErrorSeverity.HIGH,
        { unhandledRejection: true }
      );
    });
  }
  
  /**
   * Log an error with detailed information
   * @param error The error to log
   * @param category The category of the error
   * @param severity The severity of the error
   * @param context Additional context for the error
   * @returns The generated error log entry
   */
  logError(
    error: Error,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, any> = {}
  ): ErrorLogEntry {
    const entry: ErrorLogEntry = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      category,
      severity,
      context,
      handled: false
    };
    
    // Add to the log
    this.errorLog.unshift(entry);
    
    // Trim the log if it exceeds the maximum size
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(0, this.MAX_LOG_SIZE);
    }
    
    // Log to console based on severity
    this.consoleLogError(entry);
    
    return entry;
  }
  
  /**
   * Wrap an async function with retry logic
   * @param fn The async function to execute with retry
   * @param options Retry options
   * @returns A wrapped function that will retry on failure
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    // Merge options with defaults
    const retryOptions: RetryOptions = {
      ...this.DEFAULT_RETRY_OPTIONS,
      ...options
    };
    
    let attempt = 0;
    let lastError: Error;
    
    while (attempt <= retryOptions.maxRetries) {
      try {
        const result = await fn();
        
        // Call success callback if provided
        if (attempt > 0 && retryOptions.onSuccess) {
          retryOptions.onSuccess(result, attempt);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Determine if this error is retryable
        const errorCategory = this.categorizeError(lastError);
        const isRetryable = !retryOptions.retryableErrors || 
          retryOptions.retryableErrors.includes(errorCategory);
        
        // If not retryable or we're out of retries, throw
        if (!isRetryable || attempt >= retryOptions.maxRetries) {
          if (retryOptions.onFailure) {
            retryOptions.onFailure(lastError, attempt);
          }
          
          // Log the error with retry context
          this.logError(lastError, errorCategory, ErrorSeverity.MEDIUM, {
            retryAttempts: attempt,
            finalFailure: true
          });
          
          throw lastError;
        }
        
        // Calculate delay using exponential backoff
        const delay = Math.min(
          retryOptions.initialDelayMs * Math.pow(retryOptions.backoffFactor, attempt),
          retryOptions.maxDelayMs
        );
        
        // Log the retry attempt
        this.logError(lastError, errorCategory, ErrorSeverity.LOW, {
          retryAttempt: attempt + 1,
          retryDelay: delay
        });
        
        // Call retry callback if provided
        if (retryOptions.onRetry) {
          retryOptions.onRetry(lastError, attempt + 1, delay);
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
        
        attempt++;
      }
    }
    
    // This should never happen due to the loop condition, but TypeScript needs it
    throw lastError!;
  }
  
  /**
   * Get all error logs
   * @param limit Maximum number of logs to return (default: 100)
   * @param category Filter by error category
   * @param severity Filter by error severity
   * @returns Array of error log entries
   */
  getErrorLogs(
    limit: number = 100,
    category?: ErrorCategory,
    severity?: ErrorSeverity
  ): ErrorLogEntry[] {
    let filteredLogs = this.errorLog;
    
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }
    
    return filteredLogs.slice(0, limit);
  }
  
  /**
   * Mark an error as handled
   * @param errorId The ID of the error to mark as handled
   * @returns True if the error was found and marked, false otherwise
   */
  markErrorHandled(errorId: string): boolean {
    const error = this.errorLog.find(log => log.id === errorId);
    
    if (error) {
      error.handled = true;
      return true;
    }
    
    return false;
  }
  
  /**
   * Categorize an error based on its properties and message
   * @param error The error to categorize
   * @returns The error category
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Database errors
    if (
      message.includes('database') ||
      message.includes('db') ||
      message.includes('sql') ||
      message.includes('query') ||
      message.includes('connection') ||
      stack.includes('postgres') ||
      stack.includes('pg') ||
      stack.includes('drizzle')
    ) {
      return ErrorCategory.DATABASE;
    }
    
    // Authentication errors
    if (
      message.includes('auth') ||
      message.includes('permission') ||
      message.includes('access') ||
      message.includes('token') ||
      message.includes('login') ||
      message.includes('password') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    ) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    // External API errors
    if (
      message.includes('api') ||
      message.includes('fetch') ||
      message.includes('http') ||
      message.includes('request') ||
      message.includes('response') ||
      message.includes('status') ||
      message.includes('openai') ||
      message.includes('pinecone')
    ) {
      return ErrorCategory.EXTERNAL_API;
    }
    
    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('schema') ||
      message.includes('required') ||
      message.includes('constraint')
    ) {
      return ErrorCategory.VALIDATION;
    }
    
    // Network errors
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('socket') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    ) {
      return ErrorCategory.NETWORK;
    }
    
    // Processing errors
    if (
      message.includes('process') ||
      message.includes('parse') ||
      message.includes('format') ||
      message.includes('convert')
    ) {
      return ErrorCategory.PROCESSING;
    }
    
    // Default to unknown
    return ErrorCategory.UNKNOWN;
  }
  
  /**
   * Generate a unique error ID
   * @returns A unique error ID
   */
  private generateErrorId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  /**
   * Log an error to the console based on its severity
   * @param entry The error log entry to console log
   */
  private consoleLogError(entry: ErrorLogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.severity.toUpperCase()}] [${entry.category}]`;
    
    switch (entry.severity) {
      case ErrorSeverity.FATAL:
        console.error(`${prefix} FATAL ERROR: ${entry.message}`);
        if (entry.stack) {
          console.error(entry.stack);
        }
        console.error('Context:', entry.context);
        break;
        
      case ErrorSeverity.HIGH:
        console.error(`${prefix} ERROR: ${entry.message}`);
        if (entry.stack) {
          console.error(entry.stack);
        }
        console.error('Context:', entry.context);
        break;
        
      case ErrorSeverity.MEDIUM:
        console.warn(`${prefix} WARNING: ${entry.message}`);
        if (entry.context && Object.keys(entry.context).length > 0) {
          console.warn('Context:', entry.context);
        }
        break;
        
      case ErrorSeverity.LOW:
        console.info(`${prefix} INFO: ${entry.message}`);
        break;
    }
  }
}

export const errorHandlingService = new ErrorHandlingService();