/**
 * Authentication Middleware
 * 
 * This middleware has been modified to bypass token verification for Windows Authentication integration.
 * A default admin user is assigned to all requests.
 */

import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../services/security';
import { storage } from '../storage';

// Create instances of services - kept for logging purposes only
const securityService = new SecurityService();

// Define token scope enum
export enum TokenScope {
  READ_ONLY = 'read_only',
  READ_WRITE = 'read_write',
  ADMIN = 'admin'
}

// Extend Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        role: string;
        scope: string[];
      };
    }
  }
}

/**
 * Verify JWT token middleware - BYPASSED for Windows Authentication integration
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  // Bypass token verification and assign default admin user
  req.user = {
    userId: 1,
    username: 'county_admin',
    role: 'admin',
    scope: [TokenScope.READ_ONLY, TokenScope.READ_WRITE, TokenScope.ADMIN].map(s => s.toString())
  };
  
  // Log the bypass for audit purposes
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  securityService.logSecurityEvent({
    eventType: 'authentication',
    component: 'auth-middleware',
    userId: 1, // Default admin user ID
    ipAddress: clientIp,
    details: {
      username: 'county_admin',
      role: 'admin',
      scope: [TokenScope.READ_ONLY, TokenScope.READ_WRITE, TokenScope.ADMIN].map(s => s.toString()),
      note: 'Token verification bypassed for Windows Authentication integration'
    },
    severity: 'info'
  }).catch(err => console.error('Failed to log token validation bypass:', err));
  
  // Continue to the next middleware or route handler
  next();
}

/**
 * Check if the user has the required scope - BYPASSED for Windows Authentication integration
 * @param requiredScope The scope required for access
 * @returns Middleware function
 */
export function requireScope(requiredScope: TokenScope) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Assign default admin user if not already set
      if (!req.user) {
        req.user = {
          userId: 1,
          username: 'county_admin',
          role: 'admin',
          scope: [TokenScope.READ_ONLY, TokenScope.READ_WRITE, TokenScope.ADMIN].map(s => s.toString())
        };
      }
      
      // Log authorization bypass for audit purposes
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      securityService.logSecurityEvent({
        eventType: 'authorization',
        component: 'auth-middleware',
        userId: req.user.userId,
        ipAddress: clientIp,
        details: {
          username: req.user.username,
          role: req.user.role,
          requiredScope,
          userScopes: req.user.scope,
          note: 'Scope check bypassed for Windows Authentication integration'
        },
        severity: 'info'
      }).catch(err => console.error('Failed to log authorization bypass:', err));
      
      // Continue to the next middleware or route handler - bypassing scope check
      next();
    } catch (error) {
      console.error('Error in requireScope middleware:', error);
      return res.status(500).json({
        message: 'Internal server error during authorization.'
      });
    }
  };
}

/**
 * Direct API key validation middleware - BYPASSED for Windows Authentication integration
 * This allows API key authentication as an alternative to JWT tokens
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    // Bypass API key validation and assign default admin user
    req.user = {
      userId: 1,
      username: 'county_admin',
      role: 'admin',
      scope: [TokenScope.READ_ONLY, TokenScope.READ_WRITE, TokenScope.ADMIN].map(s => s.toString())
    };
    
    // Log the API key bypass for audit purposes
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    securityService.logSecurityEvent({
      eventType: 'authentication',
      component: 'auth-middleware',
      userId: 1,
      ipAddress: clientIp,
      details: {
        note: 'API key validation bypassed for Windows Authentication integration'
      },
      severity: 'info'
    }).catch(err => console.error('Failed to log API key validation bypass:', err));
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error in validateApiKey middleware:', error);
    return res.status(500).json({
      message: 'Internal server error during API key validation.'
    });
  }
}

/**
 * Generate a test JWT token for development and testing purposes
 * MODIFIED for Windows Authentication integration
 * WARNING: This should only be used in development environments
 * @param userId The user ID to include in the token
 * @param role The user role (default: 'admin')
 * @returns A dummy token string
 */
export function generateTestToken(userId: number = 1, role: string = 'admin'): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test tokens cannot be generated in production environments');
  }
  
  // Log the test token generation for audit purposes
  securityService.logSecurityEvent({
    eventType: 'authentication',
    component: 'auth-middleware',
    userId: userId,
    ipAddress: 'localhost',
    details: {
      userId,
      role,
      note: 'Test token generation bypassed for Windows Authentication integration'
    },
    severity: 'info'
  }).catch(err => console.error('Failed to log test token generation:', err));
  
  // Return a dummy token string since token authentication is bypassed
  return 'windows-auth-integration-dummy-token-' + Date.now();
}