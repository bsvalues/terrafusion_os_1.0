import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { UserRole } from '@shared/schema';
import 'express-session';

// Extend express-session
declare module 'express-session' {
  interface SessionData {
    userId: number;
    activeOrganizationId: number;
  }
}

// Current user session interface
export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  organizationId: number; // Current active organization
  organizationName: string;
  organizationSlug: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
      userId?: number;
    }
  }
}

// Simple token storage for development - in production use Redis or a proper token store
const tokenStore: Map<string, { userId: number, expires: Date }> = new Map();

// Export the token store for use in routes
export function getTokenStore(): Map<string, { userId: number, expires: Date }> {
  return tokenStore;
}

// Generate a simple token - in production use a proper JWT or secure token generator
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

// Helper function to set an auth token
export function setAuthToken(userId: number): string {
  const token = generateToken();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days expiry
  
  // Store the token
  tokenStore.set(token, { 
    userId, 
    expires
  });
  
  console.log(`Auth token created for user ${userId}: ${token.substring(0, 10)}...`);
  return token;
}

// Helper function to clear an auth token
export function clearAuthToken(token: string): boolean {
  return tokenStore.delete(token);
}

// Helper function to get user ID from token
export function getUserIdFromToken(token: string): number | null {
  const tokenData = tokenStore.get(token);
  
  if (tokenData && tokenData.expires > new Date()) {
    return tokenData.userId;
  }
  
  return null;
}

// Flag to check if authentication should be bypassed
// Setting to true for demonstration purposes
export let isAuthDisabled = true; // Authentication is disabled for easier demonstration

// Function to temporarily disable authentication for testing
export function disableAuth(disable: boolean = true): void {
  isAuthDisabled = disable;
  console.log(`Authentication ${disable ? 'disabled' : 'enabled'} for testing`);
  // Force a small delay to ensure all routes recognize the change
  return;
}

// Authentication middleware
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    // If authentication is disabled for testing, bypass all checks
    if (isAuthDisabled) {
      console.log('Auth bypassed: Test mode enabled - authentication disabled');
      // Set a default test user (user ID 1)
      req.userId = 1;
      
      // Try to set a mock user object with admin permissions
      try {
        const testUser = await storage.getUser(1);
        if (testUser) {
          // Get first organization
          const memberships = await storage.getUserOrganizations(testUser.id);
          if (memberships.length > 0) {
            const organization = await storage.getOrganization(memberships[0].organizationId);
            if (organization) {
              req.currentUser = {
                id: testUser.id,
                username: testUser.username,
                email: testUser.email,
                firstName: testUser.firstName || undefined,
                lastName: testUser.lastName || undefined,
                avatarUrl: testUser.avatarUrl || undefined,
                organizationId: organization.id,
                organizationName: organization.name,
                organizationSlug: organization.slug,
                role: memberships[0].role as UserRole
              };
            }
          }
        }
      } catch (error) {
        console.log('Error setting up test user, but proceeding anyway:', error);
      }
      
      return next();
    }
    
    // Debug session info
    console.log('Session debug:', { 
      hasSession: !!req.session,
      sessionID: req.sessionID,
      userId: req.session?.userId,
      cookie: req.session?.cookie
    });
    
    // Normal token-based auth implementation
    let userId = 0; // Initialize with 0 (invalid), will be set later
    
    // Check authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokenData = tokenStore.get(token);
      
      if (tokenData && tokenData.expires > new Date()) {
        userId = tokenData.userId;
        console.log(`User authenticated via Bearer token: ${userId}`);
      }
    }
    
    // Check custom header next
    if (!userId && req.headers['x-auth-token']) {
      const token = req.headers['x-auth-token'] as string;
      
      console.log(`Auth Debug: Received X-Auth-Token: ${token}`);
      console.log(`Auth Debug: Current token store has ${tokenStore.size} tokens`);
      
      // Check if token exists in store
      const tokenData = tokenStore.get(token);
      
      if (tokenData) {
        console.log(`Auth Debug: Token found in store for user ${tokenData.userId}, expires: ${tokenData.expires}`);
        
        if (tokenData.expires > new Date()) {
          userId = tokenData.userId;
          console.log(`User authenticated via X-Auth-Token: ${userId}`);
        } else {
          console.log(`Auth Debug: Token expired at ${tokenData.expires}`);
        }
      } else {
        console.log(`Auth Debug: Token not found in token store`);
        // Print token store keys for debugging
        console.log(`Auth Debug: Token store keys: ${Array.from(tokenStore.keys()).map(k => k.substring(0, 10))}...`);
      }
    }
    
    // Check for auth token in cookies
    if (!userId && req.cookies && req.cookies['x-auth-token']) {
      const token = req.cookies['x-auth-token'];
      const tokenData = tokenStore.get(token);
      
      if (tokenData && tokenData.expires > new Date()) {
        userId = tokenData.userId;
        console.log(`User authenticated via cookie token: ${userId}`);
      }
    }
    
    // Fall back to session if available
    if (!userId && req.session && req.session.userId) {
      userId = req.session.userId;
      console.log(`User authenticated via session: ${userId}`);
    }
    
    // Fall back to testing header if available
    if (!userId && req.headers['x-userid']) {
      const headerUserId = parseInt(req.headers['x-userid'] as string);
      if (!isNaN(headerUserId)) {
        userId = headerUserId;
        console.log(`User authenticated via X-UserId header: ${userId}`);
      }
    }
    
    // If no valid auth method found, return unauthorized
    if (!userId) {
      return res.status(401).json({ message: 'You must be logged in to access this resource' });
    }
    
    // Set userId in session for future requests
    if (req.session) {
      req.session.userId = userId;
    }

    // Fetch the user by ID
    const user = await storage.getUser(userId);
    
    if (!user) {
      // Clear invalid session
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'Invalid user session' });
    }

    // Fetch the user's active organization
    const activeOrgId = req.session.activeOrganizationId || null;
    
    // Fetch the user's organizations (memberships)
    const memberships = await storage.getUserOrganizations(user.id);
    
    if (memberships.length === 0) {
      return res.status(403).json({ 
        message: 'You do not belong to any organization. Please contact an administrator.'
      });
    }

    // Determine which organization to use
    let activeMembership = memberships[0]; // Default to first org
    
    // If active org is set in session and user is a member, use that
    if (activeOrgId) {
      const foundMembership = memberships.find(m => m.organizationId === activeOrgId);
      if (foundMembership) {
        activeMembership = foundMembership;
      }
    }

    // Get the organization details
    const organization = await storage.getOrganization(activeMembership.organizationId);
    
    if (!organization) {
      return res.status(403).json({ 
        message: 'Organization not found. Please contact an administrator.'
      });
    }

    // Add current user info to the request
    req.currentUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      avatarUrl: user.avatarUrl || undefined,
      organizationId: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      role: activeMembership.role as UserRole
    };

    // Update session with active organization
    req.session.activeOrganizationId = organization.id;
    
    // Explicitly save the session after updating it
    req.session.save((err) => {
      if (err) {
        console.error('Failed to save session in auth middleware:', err);
        return res.status(500).json({ message: 'Session error' });
      }
      
      // Continue with the request after session is saved
      next();
    });
    
    // Don't call next() here, it will be called after session is saved
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
}

// Role-based access control middleware
export function hasRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // If authentication is disabled for testing, bypass role checks
    if (isAuthDisabled) {
      console.log('Role check bypassed: Test mode enabled - authentication disabled');
      return next();
    }
    
    // Check if user is authenticated first
    if (!req.currentUser) {
      return res.status(401).json({ message: 'You must be logged in to access this resource' });
    }

    // Check if user has one of the required roles
    if (!roles.includes(req.currentUser.role)) {
      return res.status(403).json({ 
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}

// Organization access middleware - checks if user can access a specific organization
export function canAccessOrganization(organizationIdParam: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If authentication is disabled for testing, bypass organization access checks
      if (isAuthDisabled) {
        console.log('Organization access check bypassed: Test mode enabled - authentication disabled');
        return next();
      }
      
      // Check if user is authenticated first
      if (!req.currentUser) {
        return res.status(401).json({ message: 'You must be logged in to access this resource' });
      }

      const organizationId = parseInt(req.params[organizationIdParam]);
      
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: 'Invalid organization ID' });
      }

      // Check if user's current organization matches requested organization
      if (req.currentUser.organizationId !== organizationId) {
        // Check if the user is a member of the requested organization
        const memberships = await storage.getUserOrganizations(req.currentUser.id);
        const membership = memberships.find(m => m.organizationId === organizationId);
        
        if (!membership) {
          return res.status(403).json({ 
            message: 'You do not have access to this organization'
          });
        }

        // User is a member of this organization, update current context
        const organization = await storage.getOrganization(organizationId);
        if (!organization) {
          return res.status(404).json({ message: 'Organization not found' });
        }

        // Update current user context
        req.currentUser.organizationId = organization.id;
        req.currentUser.organizationName = organization.name;
        req.currentUser.organizationSlug = organization.slug;
        req.currentUser.role = membership.role as UserRole;

        // Update session with new active organization
        req.session.activeOrganizationId = organization.id;
        
        // Explicitly save the session after updating organization
        req.session.save((err) => {
          if (err) {
            console.error('Failed to save session in organization middleware:', err);
            return res.status(500).json({ message: 'Session error' });
          }
          
          // Continue once session is saved
          next();
        });
        return; // Don't proceed past this point until session is saved
      }

      next();
    } catch (error) {
      console.error('Organization access middleware error:', error);
      return res.status(500).json({ message: 'Organization access error' });
    }
  };
}