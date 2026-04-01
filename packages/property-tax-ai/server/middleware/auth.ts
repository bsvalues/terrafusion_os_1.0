import { Request, Response, NextFunction } from 'express';
import { TokenScope } from './auth-middleware';

// Interface for AuthRequest
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role: string;
    scope: string[];
  };
}

// Authentication middleware - bypassed for Windows Auth integration
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Bypassing token validation - will be replaced with Windows Auth
  // Set default user for development
  (req as AuthRequest).user = {
    userId: 1,
    username: 'county_admin',
    role: 'admin',
    scope: ['admin', 'read', 'write']
  };
  next();
}

// Authorization middleware - bypassed for Windows Auth integration
export function authorize(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Bypassing scope checks - will be replaced with Windows Auth
    next();
  };
}

// Check API key middleware - bypassed for Windows Auth integration
export function checkApiKey(req: Request, res: Response, next: NextFunction) {
  // Bypassing API key validation - will be replaced with Windows Auth
  next();
}

// Export default middleware
export default { authenticate, authorize, checkApiKey };