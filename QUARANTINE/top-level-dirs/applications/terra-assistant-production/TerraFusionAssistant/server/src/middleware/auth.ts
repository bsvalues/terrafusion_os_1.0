/**
 * Authentication Middleware
 * 
 * Handles user authentication and authorization for the API.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AUTH } from '../../../shared/config';
import { ApiError } from './error';

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Authenticate user from JWT token in authorization header or cookie
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from authorization header or cookie
    let token: string | undefined;
    
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If not in header, check for token in cookie
    if (!token && req.cookies && req.cookies[AUTH.cookieName]) {
      token = req.cookies[AUTH.cookieName];
    }
    
    // If no token, return unauthorized
    if (!token) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, AUTH.jwtSecret) as {
        id: string;
        email: string;
        role: string;
        [key: string]: any;
      };
      
      // Attach user to request
      req.user = decoded;
      next();
    } catch (error) {
      // Token verification failed
      return next(ApiError.unauthorized('Invalid or expired token'));
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - attaches user if token is valid but doesn't require it
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from authorization header or cookie
    let token: string | undefined;
    
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If not in header, check for token in cookie
    if (!token && req.cookies && req.cookies[AUTH.cookieName]) {
      token = req.cookies[AUTH.cookieName];
    }
    
    // If no token, continue without authentication
    if (!token) {
      return next();
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, AUTH.jwtSecret) as {
        id: string;
        email: string;
        role: string;
        [key: string]: any;
      };
      
      // Attach user to request
      req.user = decoded;
    } catch (error) {
      // Token verification failed, but continue without user
      console.warn('Invalid token provided, continuing without authentication');
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user has required role
 */
export function hasRole(
  roles: string | string[]
) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    // First make sure user is authenticated
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    
    // Check if user has required role
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    
    // User doesn't have required role
    return next(ApiError.forbidden('Insufficient permissions'));
  };
}