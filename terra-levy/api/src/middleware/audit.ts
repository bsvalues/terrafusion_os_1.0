/**
 * Audit Middleware - FISMA-HIGH Compliance
 * Logs all API requests with full audit trail
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { auditLogger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  userId?: string;
  action: string;
  resource: string;
  statusCode?: number;
  duration?: number;
  complianceLevel: 'FISMA-HIGH';
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auditEntry: AuditEntry;
    }
  }
}

export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!config.auditLogEnabled) {
    return next();
  }

  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || uuidv4();

  req.requestId = requestId;
  req.auditEntry = {
    id: uuidv4(),
    timestamp: new Date(),
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    userId: req.headers['x-audit-user'] as string,
    action: `${req.method} ${req.path}`,
    resource: extractResource(req.path),
    complianceLevel: 'FISMA-HIGH',
  };

  // Set request ID header for tracing
  res.setHeader('X-Request-ID', requestId);

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const auditEntry: AuditEntry = {
      ...req.auditEntry,
      statusCode: res.statusCode,
      duration,
    };

    // Log based on audit level
    if (config.auditLogLevel === 'forensic') {
      auditLogger.info({
        audit: auditEntry,
        requestBody: sanitizeBody(req.body),
        queryParams: req.query,
        headers: sanitizeHeaders(req.headers),
      }, `AUDIT: ${auditEntry.action}`);
    } else if (config.auditLogLevel === 'detailed') {
      auditLogger.info({
        audit: auditEntry,
        queryParams: req.query,
      }, `AUDIT: ${auditEntry.action}`);
    } else {
      auditLogger.info({ audit: auditEntry }, `AUDIT: ${auditEntry.action}`);
    }
  });

  next();
};

function extractResource(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[1] || 'root'; // e.g., /api/budget -> budget
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'ssn', 'taxId', 'bankAccount', 'creditCard'];
  const sanitized = { ...body as Record<string, unknown> };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  for (const header of sensitiveHeaders) {
    if (header in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}
