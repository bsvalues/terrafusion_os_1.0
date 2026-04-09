/**
 * Security Service
 * 
 * This service provides security-related functionality for the application,
 * including input validation, rate limiting, and security logging.
 */

import { IStorage } from '../storage';
import { AuditLog, InsertAuditLog } from '../../shared/schema';

// Security Event Types
export type SecurityEventType = 
  | 'authentication'
  | 'authorization'
  | 'input_validation'
  | 'rate_limit'
  | 'xss_detection'
  | 'sql_injection_detection'
  | 'system_access';

// Security Event Severities
export type SecurityEventSeverity = 'info' | 'warning' | 'error' | 'critical';

// Security Event Interface
export interface SecurityEvent {
  eventType: SecurityEventType;
  component: string;
  userId?: number;
  ipAddress?: string;
  details: any;
  severity: SecurityEventSeverity;
}

// Rate Limit Configuration
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

// Security Service Interface
export interface ISecurityService {
  // Input validation
  validateInput(input: any, schema: any): boolean;
  sanitizeInput(input: any): any;
  
  // Rate limiting
  checkRateLimit(key: string, config: RateLimitConfig): boolean;
  
  // Security logging
  logSecurityEvent(event: SecurityEvent): Promise<AuditLog>;
  
  // XSS detection
  detectXssPayload(input: string): boolean;
  
  // SQL injection detection
  detectSqlInjectionPattern(input: string): boolean;
  
  // Numeric value limits
  validateNumericRange(value: number, min: number, max: number): boolean;
}

// Security Service Implementation
export class SecurityService implements ISecurityService {
  private storage: IStorage;
  private rateLimitStore: Map<string, {count: number, resetTime: number}>;
  
  constructor(storage?: IStorage) {
    this.storage = storage || {
      createAuditLog: async (log: InsertAuditLog): Promise<AuditLog> => {
        console.log('Mock audit log created:', log);
        return {
          id: 0,
          action_type: log.action_type,
          user_id: log.user_id,
          target_type: log.target_type,
          target_id: log.target_id,
          details: log.details,
          created_at: log.created_at
        };
      }
    } as IStorage;
    this.rateLimitStore = new Map();
  }
  
  /**
   * Validate input against a schema
   * 
   * @param input - The input to validate
   * @param schema - The schema to validate against
   */
  validateInput(input: any, schema: any): boolean {
    try {
      // In a real implementation, this would use a schema validation library like Zod or Joi
      // For demo purposes, we'll do a simple check
      
      if (!input || !schema) {
        return false;
      }
      
      // Check if all required fields exist
      for (const field of Object.keys(schema)) {
        if (schema[field].required && 
            (input[field] === undefined || input[field] === null)) {
          return false;
        }
      }
      
      // Type checking for fields
      for (const field of Object.keys(input)) {
        if (schema[field] && schema[field].type) {
          const expectedType = schema[field].type;
          const actualType = typeof input[field];
          
          if (expectedType === 'array' && !Array.isArray(input[field])) {
            return false;
          } else if (expectedType !== 'array' && expectedType !== actualType) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating input:', error);
      return false;
    }
  }
  
  /**
   * Sanitize input
   * 
   * @param input - The input to sanitize
   */
  sanitizeInput(input: any): any {
    try {
      // In a real implementation, this would use a sanitization library
      // For demo purposes, we'll do a simple sanitization
      
      if (typeof input === 'string') {
        // Sanitize string input
        return this.sanitizeString(input);
      } else if (typeof input === 'object' && input !== null) {
        // Sanitize object or array
        if (Array.isArray(input)) {
          return input.map(item => this.sanitizeInput(item));
        } else {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(input)) {
            sanitized[key] = this.sanitizeInput(value);
          }
          return sanitized;
        }
      } else {
        // Return primitives as is
        return input;
      }
    } catch (error) {
      console.error('Error sanitizing input:', error);
      return input;
    }
  }
  
  /**
   * Sanitize a string
   * 
   * @param input - The string to sanitize
   */
  private sanitizeString(input: string): string {
    // Replace HTML tags
    let sanitized = input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Replace single quotes
    sanitized = sanitized.replace(/'/g, '&#39;');
    
    // Replace double quotes
    sanitized = sanitized.replace(/"/g, '&quot;');
    
    return sanitized;
  }
  
  /**
   * Check if a request exceeds rate limits
   * 
   * @param key - The rate limit key (e.g., IP address, user ID)
   * @param config - The rate limit configuration
   */
  checkRateLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = this.rateLimitStore.get(key);
    
    if (!record) {
      // First request from this key
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }
    
    if (now > record.resetTime) {
      // Window has reset
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }
    
    if (record.count >= config.maxRequests) {
      // Rate limit exceeded
      return false;
    }
    
    // Increment counter
    record.count += 1;
    this.rateLimitStore.set(key, record);
    return true;
  }
  
  /**
   * Log a security event
   * 
   * @param event - The security event to log
   */
  async logSecurityEvent(event: SecurityEvent): Promise<AuditLog> {
    // Create an audit log for the security event
    const auditLog: InsertAuditLog = {
      action_type: `security_${event.eventType}`,
      user_id: event.userId,
      target_type: 'security',
      target_id: null,
      details: {
        ...event.details,
        severity: event.severity,
        component: event.component,
        ipAddress: event.ipAddress
      },
      created_at: new Date()
    };
    
    // Log critical events to console as well
    if (event.severity === 'critical') {
      console.error(`CRITICAL SECURITY EVENT: ${event.eventType} in ${event.component}`, event.details);
    }
    
    // Create audit log in storage
    return this.storage.createAuditLog(auditLog);
  }
  
  /**
   * Detect XSS payloads in input
   * 
   * @param input - The input to check
   */
  detectXssPayload(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }
    
    // Check for common XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript\s*:/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onload\s*=/gi,
      /onmouseover\s*=/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Detect SQL injection patterns in input
   * 
   * @param input - The input to check
   */
  detectSqlInjectionPattern(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }
    
    // Check for common SQL injection patterns
    const sqlInjectionPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i,
      /exec(\s|\+)+(s|x)p\w+/i,
      /insert|update|delete|drop|alter|truncate/i
    ];
    
    return sqlInjectionPatterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Validate that a numeric value is within a specified range
   * 
   * @param value - The value to check
   * @param min - The minimum allowed value
   * @param max - The maximum allowed value
   */
  validateNumericRange(value: number, min: number, max: number): boolean {
    if (typeof value !== 'number' || isNaN(value)) {
      return false;
    }
    
    return value >= min && value <= max;
  }
}