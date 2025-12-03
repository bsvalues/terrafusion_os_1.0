/**
 * TerraLevy Logger
 * Structured logging with FISMA-HIGH audit trail support
 */

import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'terralevy-api',
    version: '1.0.0',
    environment: config.nodeEnv,
  },
  redact: {
    paths: ['req.headers.authorization', 'password', 'ssn', 'taxId'],
    censor: '[REDACTED]',
  },
});

/**
 * Create a child logger with additional context
 */
export const createChildLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};

/**
 * Audit logger for FISMA-HIGH compliance
 */
export const auditLogger = logger.child({
  type: 'audit',
  compliance: 'FISMA-HIGH',
});

export type Logger = typeof logger;
