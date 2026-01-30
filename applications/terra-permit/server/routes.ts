import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import spreadsheetParser from "./services/spreadsheetParser";
import permitClassifier from "./services/permitClassifier";
import templateGenerator from "./services/templateGenerator";
import exportService from "./services/exportService";
import collaborationService from "./services/collaborationService";
import { aiService } from "./services/aiService";
import { contextualAiService } from "./services/contextualAiService";
import { recommendationService } from "./services/recommendationService";
import { z } from "zod";
import { WebSocketServer } from "ws";
import { log } from "./vite";
import { isAuthenticated, hasRole, canAccessOrganization, setAuthToken, clearAuthToken, getTokenStore, getUserIdFromToken, disableAuth, isAuthDisabled } from "./middleware/auth";
import * as schema from "@shared/schema";
import { UserRole, insertUserSchema, insertOrganizationSchema, Permit, organizations } from "@shared/schema";
import { registerAIRoutes } from "./routes/aiRoutes";
import { registerMCPRoutes } from "./routes/mcpRoutes";
import { registerEventRoutes } from "./routes/eventRoutes";
import { registerChatbotRoutes } from "./routes/chatbotRoutes";
import { registerRecommendationRoutes } from "./routes/recommendationRoutes";
import { registerPacsRoutes } from "./routes/pacsRoutes";
import circuitBreakerRoutes from "./routes/circuitBreakerRoutes";
import dynLoaderRoutes from "./routes/dynLoaderRoutes";
import deploymentRoutes from "./routes/deployment";
import enhancedDeploymentRoutes from "./routes/enhancedDeployment";
import neuralPermitRoutes from "./routes/neuralPermitRoutes";
import { db, checkDatabaseConnection } from "./db";

// Middleware to check for OpenAI API key for AI-related routes
const checkOpenAIApiKey = (req: Request, res: Response, next: NextFunction) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ 
      message: 'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.' 
    });
  }
  next();
};

// Helper function to validate OpenAI API key format
const isValidOpenAIKey = (key: string): boolean => {
  // Basic validation - OpenAI keys typically start with "sk-" and are 51 characters long
  return !!key && typeof key === 'string' && key.startsWith('sk-') && key.length > 30;
};

// Initialize some test circuit breakers for demonstration
import { circuitBreakerService } from './services/circuitBreakerService';

// Register test circuit breakers
circuitBreakerService.register('auth-service', 
  async (args: any) => {
    // This service simulates authentication requests
    console.log('Executing auth-service circuit breaker with args:', args);
    
    // Check if force fail is requested
    if (args && args.forceFail === true) {
      console.log('Auth service forced to fail');
      // For test purposes, we want to directly force open the circuit after a forced failure
      const breaker = circuitBreakerService.get('auth-service');
      if (breaker) {
        console.log('Immediately forcing auth-service circuit to open due to forced failure');
        // The breaker.open is an event emitter in opossum, not a function
        (breaker as any).fire('open');
        
        // Return with a reject error - this should go to the fallback
        throw new Error('Breaker is open');
      }
      throw new Error('Auth service forced failure');
    }
    
    // For testing purposes, we'll make it occasionally fail
    if (Math.random() < 0.3) { // 30% failure rate
      console.log('Auth service random failure');
      throw new Error('Auth service test error');
    }
    
    console.log('Auth service success');
    return { success: true, user: { id: 1, name: 'Test User' } };
  },
  { 
    errorThresholdPercentage: 1, // Extremely low threshold (1%) to make it open after a single failure
    resetTimeout: 30000 // 30 seconds to stay open so test can verify it
  }
);

circuitBreakerService.register('database-service', 
  async (args: any) => {
    // This service simulates database operations
    console.log('Executing database-service circuit breaker with args:', args);
    
    // Check if force fail is requested
    if (args && args.forceFail === true) {
      console.log('Database service forced to fail');
      // For test purposes, we want to directly force open the circuit after a forced failure
      const breaker = circuitBreakerService.get('database-service');
      if (breaker) {
        console.log('Immediately forcing database-service circuit to open due to forced failure');
        // The breaker.open is an event emitter in opossum, not a function
        (breaker as any).fire('open');
        
        // Return with a reject error - this should go to the fallback
        throw new Error('Breaker is open');
      }
      throw new Error('Database service forced failure');
    }
    
    // For testing purposes, we'll make it occasionally fail
    if (Math.random() < 0.2) { // 20% failure rate
      console.log('Database service random failure');
      throw new Error('Database service test error');
    }
    
    console.log('Database service success');
    return { success: true, data: { id: args.id || 1, name: 'Test Record' } };
  },
  { 
    errorThresholdPercentage: 1, // Extremely low threshold (1%) to make it open after a single failure
    resetTimeout: 30000 // 30 seconds to stay open so test can verify it
  }
);

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', async (_req: Request, res: Response) => {
    try {
      // Check database connection
      const dbConnected = await checkDatabaseConnection();
      
      // Check additional services
      const aiAvailable = !!process.env.OPENAI_API_KEY;
      
      // Return comprehensive health status
      res.status(200).json({
        status: 'healthy',
        database: dbConnected ? 'connected' : 'disconnected',
        services: {
          ai: aiAvailable ? 'available' : 'unavailable',
          collaboration: 'available'  // WebSocket service status
        },
        version: '1.0',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Detailed system status endpoint - admin only
  app.get('/api/system/status', isAuthenticated, hasRole([UserRole.ADMIN]), async (_req: Request, res: Response) => {
    try {
      // Collect detailed system information
      const dbStatus = await checkDatabaseConnection();
      const memoryUsage = process.memoryUsage();
      
      res.status(200).json({
        uptime: process.uptime(),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
        },
        database: dbStatus ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('System status check failed:', error);
      res.status(500).json({ error: 'Failed to retrieve system status' });
    }
  });
  // Testing/Development Routes
  if (process.env.NODE_ENV !== 'production') {
    // Route to toggle authentication for testing
    app.post('/api/test/toggle-auth', (req: Request, res: Response) => {
      const { disable } = req.body;
      disableAuth(disable === true);
      return res.status(200).json({ 
        message: `Authentication ${isAuthDisabled ? 'disabled' : 'enabled'} for testing`,
        authDisabled: isAuthDisabled
      });
    });
    
    // Route to get current authentication status
    app.get('/api/test/auth-status', (req: Request, res: Response) => {
      return res.status(200).json({
        authDisabled: isAuthDisabled,
        message: `Authentication is currently ${isAuthDisabled ? 'disabled' : 'enabled'}`
      });
    });
    
    // Route to test circuit breaker functionality
    // This simulates services that may intermittently fail
    const failureRates: Record<string, number> = {
      'auth': 0.5,      // 50% failure rate
      'database': 0.7,  // 70% failure rate
      'ai': 0.3,        // 30% failure rate
      'default': 0.4    // 40% failure rate
    };
    
    // Circuit breaker state
    const circuitBreakers: Record<string, { 
      failures: number, 
      isOpen: boolean, 
      lastFailure: number,
      resetTimeout: number 
    }> = {};
    
    app.get('/api/test/circuit-breaker/:service', (req: Request, res: Response) => {
      const service = req.params.service || 'default';
      const failureRate = failureRates[service] || failureRates.default;
      
      // Handle request parameters
      const reset = req.query.reset === 'true';
      const forceSuccess = req.query.forceSuccess === 'true';
      const forceFail = req.query.forceFail === 'true';
      
      // Initialize circuit breaker for this service if not exists
      if (!circuitBreakers[service]) {
        circuitBreakers[service] = {
          failures: 0,
          isOpen: false,
          lastFailure: 0,
          resetTimeout: 10000 // 10 seconds before auto-reset
        };
      }
      
      const breaker = circuitBreakers[service];
      
      // Reset circuit breaker if requested
      if (reset) {
        breaker.failures = 0;
        breaker.isOpen = false;
        breaker.lastFailure = 0;
        console.log(`Circuit breaker for ${service} reset to closed state`);
        return res.status(200).json({
          status: 'success',
          message: `Circuit breaker for ${service} has been reset`
        });
      }
      
      // Force success if requested (useful for testing recovery)
      // This bypasses the circuit breaker state check
      if (forceSuccess) {
        // Always reset failures and close the circuit when forcing success
        breaker.failures = 0;
        breaker.isOpen = false;
        console.log(`Circuit breaker for ${service} reset and closed after forced success`);
        
        return res.status(200).json({
          status: 'success',
          message: `${service} service responded successfully (forced)`
        });
      }
      
      // Check if circuit is open
      if (breaker.isOpen) {
        // Check if it's time to try again (half-open state)
        const now = Date.now();
        if (now - breaker.lastFailure > breaker.resetTimeout) {
          // Reset to half-open state
          breaker.isOpen = false;
          breaker.failures = 0;
          console.log(`Circuit breaker for ${service} reset to half-open state`);
        } else {
          return res.status(503).json({
            status: 'error',
            message: `Circuit breaker open for ${service}. Service unavailable.`
          });
        }
      }
      
      // Force failure if requested
      if (forceFail) {
        // Increment failure counter
        breaker.failures++;
        breaker.lastFailure = Date.now();
        
        // If too many failures, open the circuit
        if (breaker.failures >= 3) { // Open after 3 failures
          breaker.isOpen = true;
          console.log(`Circuit breaker for ${service} opened after ${breaker.failures} failures`);
        }
        
        return res.status(500).json({
          status: 'error',
          message: `${service} service failed (failure ${breaker.failures}, forced)`,
        });
      }
      
      // Simulate random failures based on failure rate
      if (Math.random() < failureRate) {
        // Increment failure counter
        breaker.failures++;
        breaker.lastFailure = Date.now();
        
        // If too many failures, open the circuit
        if (breaker.failures >= 3) { // Open after 3 failures
          breaker.isOpen = true;
          console.log(`Circuit breaker for ${service} opened after ${breaker.failures} failures`);
        }
        
        return res.status(500).json({
          status: 'error',
          message: `${service} service failed (failure ${breaker.failures})`,
        });
      }
      
      // Success response
      // Reset failure count if successful in half-open state
      if (breaker.failures > 0) {
        breaker.failures = 0;
        console.log(`Circuit breaker for ${service} reset failures after successful request`);
      }
      
      return res.status(200).json({
        status: 'success',
        message: `${service} service responded successfully`
      });
    });
    
    console.log('Test routes registered');
  }
  
  // Authentication Routes
  
  // Register a new user
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      // Validate user data
      const userSchema = insertUserSchema.extend({
        password: z.string().min(8),
        confirmPassword: z.string()
      }).refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
      });
      
      const userData = userSchema.parse(req.body);
      const { confirmPassword, password, ...userToCreate } = userData;
      
      // Check if username or email already exists
      const existingByUsername = await storage.getUserByUsername(userToCreate.username);
      if (existingByUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      const existingByEmail = await storage.getUserByEmail(userToCreate.email);
      if (existingByEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      // Create the user
      // In a real app, you'd hash the password before storing it
      const user = await storage.createUser({
        ...userToCreate,
        password: password // This should be hashed in production
      });
      
      // Create a personal organization for this user
      const orgSlug = userToCreate.username.toLowerCase().replace(/\s+/g, '-');
      const organization = await storage.createOrganization({
        name: `${userToCreate.firstName}'s Workspace`,
        slug: orgSlug,
        ownerId: user.id
      });
      
      // Add user to organization as admin
      await storage.addUserToOrganization(user.id, organization.id, UserRole.ADMIN);
      
      // Set up session with user data
      req.session.userId = user.id;
      req.session.activeOrganizationId = organization.id;
      
      // Generate an auth token
      const authToken = setAuthToken(user.id);
      
      // Set auth token related headers and cookies
      res.header('X-Auth-Token', authToken);
      
      // Set a "logged in" cookie as a fallback
      res.cookie('x-logged-in', 'true', {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Allow JS to read this cookie
        path: '/',
        sameSite: 'lax', 
        secure: false // Don't require HTTPS
      });
      
      // Set the auth token as a cookie
      res.cookie('x-auth-token', authToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Allow client-side access for debug
        path: '/',
        sameSite: 'lax',
        secure: false // For development
      });
      
      // Return the created user (excluding sensitive data)
      const { password: pwd, ...safeUser } = user;
      return res.status(201).json({
        user: safeUser,
        organization,
        authToken: authToken, // Include auth token in response
        headers: {
          'x-auth-token': authToken
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid user data', 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: `Failed to register user: ${(error as Error).message}` });
    }
  });
  
  // Dev bypass login - simple route for development without password check
  app.post('/api/auth/dev-login', async (req: Request, res: Response) => {
    try {
      console.log('DEV LOGIN - Attempting dev bypass login');
      
      // First, check if user exists with ID 1
      const user = await storage.getUser(1);
      
      if (!user) {
        // If no user exists with ID 1, create a test user
        console.log('DEV LOGIN - No user found with ID 1. Creating a default test user...');
        
        // Create default organization if needed
        const allOrgs = await db.select().from(schema.organizations).limit(1);
        
        let organizationId: number;
        
        if (allOrgs.length === 0) {
          // Create a default organization
          const organization = await storage.createOrganization({
            name: 'Dev Organization',
            slug: 'dev-org',
            plan: 'free',
            isActive: true
          });
          
          organizationId = organization.id;
          console.log(`DEV LOGIN - Created default organization with ID ${organizationId}`);
        } else {
          organizationId = allOrgs[0].id;
          console.log(`DEV LOGIN - Using existing organization with ID ${organizationId}`);
        }
        
        // Create test user with password
        const crypto = require('crypto');
        const hashedPassword = crypto.createHash('sha256').update('password').digest('hex');
        
        const newUser = await storage.createUser({
          username: 'dev',
          email: 'dev@example.com',
          password: hashedPassword
        });
        
        console.log(`DEV LOGIN - Created dev user with ID ${newUser.id}`);
        
        // Add user to organization
        await storage.addUserToOrganization(newUser.id, organizationId, UserRole.ADMIN);
        console.log(`DEV LOGIN - Added user to organization with role ADMIN`);
        
        // Handle dev login with the newly created user
        return handleDevLogin(newUser.id, req, res);
      }
      
      // Otherwise, proceed with existing user
      console.log(`DEV LOGIN - Found existing user with ID ${user.id}`);
      return handleDevLogin(user.id, req, res);
      
    } catch (error) {
      console.error('DEV LOGIN - Error in dev login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ message: 'Dev login failed', error: errorMessage });
    }
  });
  
  // Helper function to handle dev login
  async function handleDevLogin(userId: number, req: Request, res: Response) {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`DEV LOGIN - User with ID ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get organizations
    const memberships = await storage.getUserOrganizations(userId);
    if (memberships.length === 0) {
      console.error(`DEV LOGIN - User ${userId} has no organization memberships`);
      return res.status(403).json({ message: 'User does not belong to any organization' });
    }
    
    // Use first organization
    const organizationId = memberships[0].organizationId;
    const organization = await storage.getOrganization(organizationId);
    
    if (!organization) {
      console.error(`DEV LOGIN - Organization ${organizationId} not found`);
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Create auth token
    const authToken = setAuthToken(userId);
    
    // Set session
    req.session.userId = userId;
    req.session.activeOrganizationId = organizationId;
    
    console.log(`DEV LOGIN - User ${user.username} (ID: ${userId}) successfully logged in`);
    console.log(`DEV LOGIN - Auth token: ${authToken.substring(0, 10)}...`);
    
    // Save session
    req.session.save((err) => {
      if (err) {
        console.error('DEV LOGIN - Failed to save session:', err);
      } else {
        console.log(`DEV LOGIN - Session saved with ID: ${req.sessionID}`);
      }
      
      // Set the auth token as a cookie too
      res.cookie('x-auth-token', authToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days,
        httpOnly: false, // Allow client-side access for debug
        path: '/',
        sameSite: 'lax',
        secure: false // For development
      });
      
      // Set a "logged in" cookie as a fallback to help track session state
      res.cookie('x-logged-in', 'true', {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Allow JS to read this cookie
        path: '/',
        sameSite: 'lax', 
        secure: false // Don't require HTTPS
      });
      
      // Also add the session ID as a separate cookie for troubleshooting
      res.cookie('debug-sid', req.sessionID, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Allow JS to read this cookie
        path: '/',
        sameSite: 'lax',
        secure: false
      });
      
      // Add auth token to response headers
      res.header('X-Auth-Token', authToken);
      
      // Return user data (excluding sensitive fields)
      const { password, ...userWithoutPassword } = user; 
      const role = memberships[0].role;
      
      return res.status(200).json({
        user: userWithoutPassword,
        organization,
        role,
        authToken: authToken,
        headers: {
          'x-auth-token': authToken
        },
        message: 'Dev login successful'
      });
    });
  }
  
  // Regular login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const loginSchema = z.object({
        username: z.string(),
        password: z.string()
      });
      
      const { username, password: loginPassword } = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // In a real app, you'd verify the password hash
      // For this prototype, we'll do a simple check
      if (user.password !== loginPassword) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Get user's organizations
      const memberships = await storage.getUserOrganizations(user.id);
      if (memberships.length === 0) {
        return res.status(403).json({ 
          message: 'Your account exists but doesn\'t belong to any organization. Please contact an administrator.'
        });
      }
      
      // Set session data
      req.session.userId = user.id;
      req.session.activeOrganizationId = memberships[0].organizationId;
      
      console.log('Login successful - Setting session:', { 
        sessionID: req.sessionID,
        userId: req.session.userId,
        cookie: req.session.cookie
      });
      
      // Explicitly save the session to ensure it's persisted
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            console.log('Session saved successfully with ID:', req.sessionID);
            resolve();
          }
        });
      });
      
      // Create an auth token (our custom token-based approach)
      const authToken = setAuthToken(user.id);
      
      // Add auth token to response headers
      res.header('X-Auth-Token', authToken);
      
      // Log token information for debugging
      const tokenStore = getTokenStore();
      console.log(`Login - Created auth token: ${authToken.substring(0, 10)}... for user ${user.id}`);
      console.log(`Login - Token store size: ${tokenStore.size}`);
      console.log(`Login - Token store keys: ${Array.from(tokenStore.keys()).map(k => k.substring(0, 10))}...`);
      
      // Set a "logged in" cookie as a fallback to help track session state
      // Using super permissive settings specifically for Replit environment
      res.cookie('x-logged-in', 'true', {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Allow JS to read this cookie
        path: '/',
        sameSite: 'lax' as const, // Type cast to avoid TS errors
        secure: false // Don't require HTTPS
      });
      
      // Set the auth token as a cookie too
      res.cookie('x-auth-token', authToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Allow JS to read this cookie
        path: '/',
        sameSite: 'lax' as const,
        secure: false
      });
      
      // Also add the session ID as a separate cookie for troubleshooting
      res.cookie('debug-sid', req.sessionID, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Allow JS to read this cookie
        path: '/',
        sameSite: 'lax' as const,
        secure: false
      });
      
      // Get the active organization details
      const organization = await storage.getOrganization(memberships[0].organizationId);
      
      // Return user and organization data (excluding sensitive data)
      const { password: userPwd, ...safeUser } = user;
      return res.status(200).json({
        user: safeUser,
        organization,
        role: memberships[0].role,
        authToken: authToken, // Include the auth token directly in the response
        headers: {
          'x-auth-token': authToken // Also include in headers field for clients that check there
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid login data', 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: `Login failed: ${(error as Error).message}` });
    }
  });
  
  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    // Clear all tracking cookies with the same settings
    const cookieOptions = {
      path: '/',
      sameSite: 'lax' as const, // Type cast to avoid TS errors
      secure: false,
      httpOnly: false,
      domain: req.hostname
    };
    
    // Get the auth token from header or cookie
    const authToken = req.headers['x-auth-token'] as string || req.cookies['x-auth-token'];
    
    // If we have an auth token, clear it from the token store
    if (authToken) {
      clearAuthToken(authToken);
    }
    
    // Clear our custom cookies
    res.clearCookie('x-logged-in', cookieOptions);
    res.clearCookie('debug-sid', cookieOptions);
    res.clearCookie('x-auth-token', cookieOptions);
    
    // Also try clearing the session cookie directly
    res.clearCookie('permits-session', {
      ...cookieOptions,
      httpOnly: true
    });
    
    // Clear the session
    req.session.destroy(() => {
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  // Get current user profile
  app.get('/api/auth/me', isAuthenticated, (req: Request, res: Response) => {
    const user = req.currentUser;
    return res.status(200).json(user);
  });
  
  // Organization Routes
  
  // Get user's organizations
  app.get('/api/organizations', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser!.id;
      const memberships = await storage.getUserOrganizations(userId);
      
      // Get full organization details for each membership
      const organizations = await Promise.all(
        memberships.map(async (m) => {
          const org = await storage.getOrganization(m.organizationId);
          return {
            ...org,
            role: m.role
          };
        })
      );
      
      return res.status(200).json(organizations);
    } catch (error) {
      return res.status(500).json({ message: `Failed to fetch organizations: ${(error as Error).message}` });
    }
  });
  
  // Create a new organization
  app.post('/api/organizations', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser!.id;
      
      // Validate organization data
      const orgSchema = insertOrganizationSchema;
      const orgData = orgSchema.parse({
        ...req.body,
        ownerId: userId
      });
      
      // Create the organization
      const organization = await storage.createOrganization(orgData);
      
      // Add the creator as an admin
      await storage.addUserToOrganization(userId, organization.id, UserRole.ADMIN);
      
      return res.status(201).json(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid organization data', 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: `Failed to create organization: ${(error as Error).message}` });
    }
  });
  
  // Switch active organization
  app.post('/api/organizations/:id/switch', isAuthenticated, canAccessOrganization('id'), (req: Request, res: Response) => {
    // The canAccessOrganization middleware already updated the session and currentUser
    return res.status(200).json({
      message: 'Organization switched successfully',
      organization: {
        id: req.currentUser!.organizationId,
        name: req.currentUser!.organizationName,
        slug: req.currentUser!.organizationSlug
      },
      role: req.currentUser!.role
    });
  });
  
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
      // Accept excel files only and other common document types
      const allowedMimes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
        'application/pdf',
        'application/vnd.oasis.opendocument.spreadsheet'
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only Excel, CSV, and common document formats are allowed.'));
      }
    }
  });

  // Upload and process a spreadsheet
  app.post('/api/permits/upload', isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Get user and organization IDs from the authenticated user
      if (!req.currentUser) {
        return res.status(401).json({ message: 'You must be logged in to upload permits' });
      }
      
      const userId = req.currentUser.id;
      const organizationId = req.currentUser.organizationId;

      log(`Received file upload: ${req.file.originalname}, size: ${req.file.size} bytes, mimetype: ${req.file.mimetype}`, 'routes');

      // Create an upload record first
      const uploadRecord = await storage.createUpload({
        fileName: req.file.originalname,
        totalPermits: 0,
        enterPermits: 0,
        skipPermits: 0,
        userId,
        organizationId
      });

      // Parse the spreadsheet
      const rawData = await spreadsheetParser.parseBuffer(req.file.buffer);
      
      // Check if we got any data
      if (!rawData || rawData.length === 0) {
        log(`No valid data rows found in uploaded file: ${req.file.originalname}`, 'routes');
        
        // Return an empty result with proper message
        return res.status(400).json({
          message: 'The uploaded file contains no valid data. Please check your file format and ensure it has headers that include ParcelNumber/Parcel Number and other required fields.',
          uploadId: uploadRecord.id,
          permits: [],
          summary: {
            totalCount: 0,
            enterCount: 0,
            skipCount: 0
          }
        });
      }
      
      // Map raw data to permit schema using column mapping
      let permits, classifiedPermits;
      
      try {
        permits = await spreadsheetParser.mapToPermits(rawData, uploadRecord.id);
      } catch (error) {
        // Special handling for mapping errors
        const mappingError = error as Error;
        log(`Error mapping permit data: ${mappingError.message}`, 'routes');
        
        if (mappingError.message && mappingError.message.includes('Parcel Number is required')) {
          return res.status(400).json({
            message: 'Your file is missing required Parcel Number data. Please ensure your spreadsheet has a ParcelNumber or "Parcel Number" column.',
            uploadId: uploadRecord.id,
            permits: [],
            summary: {
              totalCount: 0,
              enterCount: 0,
              skipCount: 0
            }
          });
        }
        
        // Re-throw other errors to be caught by the general error handler
        throw mappingError;
      }
      
      // Use contextual AI to classify permits if OpenAI API key is available
      if (process.env.OPENAI_API_KEY) {
        try {
          // Use advanced AI to classify permits with contextual awareness
          classifiedPermits = await aiService.classifyPermitsWithAI(permits, true);
        } catch (error) {
          const aiError = error as Error;
          log(`AI classification failed, using rule-based fallback: ${aiError.message}`, 'routes');
          // If AI fails, use permitClassifier directly (rule-based fallback)
          classifiedPermits = permitClassifier.classifyPermits(permits);
        }
      } else {
        // No OpenAI key, use rule-based classification
        log('No OpenAI API key available, using rule-based classification', 'routes');
        classifiedPermits = permitClassifier.classifyPermits(permits);
      }
      
      // Save classified permits
      const savedPermits = await storage.createPermits(classifiedPermits);
      
      // Create history entries for each new permit
      // We'll use a default system user ID (1) for the automatic upload
      const systemUserId = 1;
      for (const permit of savedPermits) {
        await storage.createPermitHistory({
          permitId: permit.id,
          userId: systemUserId,
          action: 'create',
          detail: {
            initialState: {
              parcelNumber: permit.parcelNumber,
              neighborhoodCode: permit.neighborhoodCode,
              permitDescription: permit.permitDescription,
              value: permit.value,
              issueDate: permit.issueDate,
              enterPermit: permit.enterPermit,
              reason: permit.reason
            },
            description: 'Permit created via file upload'
          }
        });
      }
      
      // Update the upload record with summary stats
      const summary = permitClassifier.getSummary(classifiedPermits);
      await storage.updateUploadCounts(
        uploadRecord.id,
        summary.totalCount,
        summary.enterCount,
        summary.skipCount
      );
      
      log(`Successfully processed ${summary.totalCount} permits (Enter: ${summary.enterCount}, Skip: ${summary.skipCount})`, 'routes');
      
      // Return the classified permits and summary
      return res.status(200).json({
        uploadId: uploadRecord.id,
        permits: savedPermits,
        summary,
        message: summary.totalCount > 0 
          ? "AI successfully analyzed and classified your permit data" 
          : undefined
      });
    } catch (error: any) {
      log(`Error processing file: ${error.message}`, 'routes');
      
      // Provide a more user-friendly error message
      const errorMessage = error.message;
      let userMessage = `Error processing file: ${errorMessage}`;
      
      // Add helpful message for common errors
      if (errorMessage.includes('Parcel Number is required')) {
        userMessage = 'Your file is missing required Parcel Number data. Our AI tried to extract this information but was unsuccessful.';
      } else if (errorMessage.includes('no worksheets')) {
        userMessage = 'Your file appears to be empty or in an unsupported format. Try a different file format or download our template.';
      }
      
      return res.status(500).json({ message: userMessage });
    }
  });

  // Get all uploads for the user's current organization
  app.get('/api/uploads', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get uploads for the user's current organization
      const organizationId = req.currentUser!.organizationId;
      const uploads = await storage.getUploadsByOrganization(organizationId);
      return res.status(200).json(uploads);
    } catch (error) {
      return res.status(500).json({ message: `Failed to fetch uploads: ${(error as Error).message}` });
    }
  });

  // Get permits for a specific upload
  app.get('/api/uploads/:id/permits', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const uploadIdSchema = z.object({ id: z.coerce.number().positive() });
      const { id } = uploadIdSchema.parse({ id: req.params.id });
      
      const upload = await storage.getUpload(id);
      if (!upload) {
        return res.status(404).json({ message: 'Upload not found' });
      }
      
      // Check if the upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to this upload' });
      }
      
      const permits = await storage.getPermitsByUploadId(id);
      const summary = permitClassifier.getSummary(permits);
      
      return res.status(200).json({
        uploadId: id,
        uploadInfo: upload,
        permits,
        summary
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid upload ID format' });
      }
      return res.status(500).json({ message: `Failed to fetch permits: ${(error as Error).message}` });
    }
  });

  // Generate and download permit template
  app.get('/api/templates/permit', async (req: Request, res: Response) => {
    try {
      // Check for token in query parameters
      const token = req.query.token as string;
      
      // If token is provided in query, authenticate with it
      if (token) {
        const userId = getUserIdFromToken(token);
        if (userId) {
          // Set user in request for downstream middleware
          req.userId = userId;
        }
      }
      
      // Still call isAuthenticated for session-based auth if no token or invalid token
      if (!req.userId) {
        const authenticateMiddleware = isAuthenticated as any;
        const middlewareResult = await new Promise((resolve) => {
          authenticateMiddleware(req, res, () => resolve(true));
        });
        
        // If middleware didn't call next(), authentication failed
        if (middlewareResult !== true) {
          return; // Response already sent by middleware
        }
      }
      
      // Generate the template file
      const filePath = await templateGenerator.generateTemplate();
      
      // Send file as download
      res.download(filePath, 'permit_template.xlsx', (err) => {
        if (err) {
          console.error('Error sending template file:', err);
        }
      });
    } catch (error) {
      console.error('Error generating template:', error);
      return res.status(500).json({ message: `Failed to generate template: ${(error as Error).message}` });
    }
  });
  
  // Export permits from a specific upload as Excel file
  app.get('/api/uploads/:id/export', async (req: Request, res: Response) => {
    try {
      // Check for token in query parameters
      const token = req.query.token as string;
      
      // If token is provided in query, authenticate with it
      if (token) {
        const userId = getUserIdFromToken(token);
        if (userId) {
          // Set user in request for downstream middleware
          req.userId = userId;
        }
      }
      
      // Still call isAuthenticated for session-based auth if no token or invalid token
      if (!req.userId) {
        const authenticateMiddleware = isAuthenticated as any;
        const middlewareResult = await new Promise((resolve) => {
          authenticateMiddleware(req, res, () => resolve(true));
        });
        
        // If middleware didn't call next(), authentication failed
        if (middlewareResult !== true) {
          return; // Response already sent by middleware
        }
      }
      
      const uploadIdSchema = z.object({ id: z.coerce.number().positive() });
      const { id } = uploadIdSchema.parse({ id: req.params.id });
      
      const upload = await storage.getUpload(id);
      if (!upload) {
        return res.status(404).json({ message: 'Upload not found' });
      }
      
      // Check if the upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to this upload' });
      }
      
      const permits = await storage.getPermitsByUploadId(id);
      if (permits.length === 0) {
        return res.status(404).json({ message: 'No permits found for this upload' });
      }
      
      // Generate the Excel file
      const filePath = await exportService.exportPermitsToExcel(permits, id);
      
      // Send file as download
      const filename = `permits_${upload.fileName.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Error sending exported file:', err);
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid upload ID format' });
      }
      console.error('Error exporting permits:', error);
      return res.status(500).json({ message: `Failed to export permits: ${(error as Error).message}` });
    }
  });

  // Collaboration endpoints
  // Get all active collaboration sessions
  app.get('/api/collaboration/sessions', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get all sessions
      const allSessions = collaborationService.getSessions();
      
      // If user is not an admin or manager, filter sessions to only show those associated with uploads
      // from the user's organization
      if (req.currentUser!.role !== UserRole.ADMIN && req.currentUser!.role !== UserRole.MANAGER) {
        // Get uploads for the user's organization
        const organizationId = req.currentUser!.organizationId;
        const orgUploads = await storage.getUploadsByOrganization(organizationId);
        const orgUploadIds = new Set(orgUploads.map(upload => upload.id));
        
        // Filter sessions to only include those for uploads in the user's organization
        const filteredSessions = allSessions.filter(session => 
          orgUploadIds.has(session.uploadId)
        );
        
        return res.status(200).json(filteredSessions);
      }
      
      // Admin/Manager can see all sessions
      return res.status(200).json(allSessions);
    } catch (error) {
      return res.status(500).json({ message: `Failed to fetch collaboration sessions: ${(error as Error).message}` });
    }
  });
  
  // Get a specific collaboration session
  app.get('/api/collaboration/sessions/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.id;
      const session = collaborationService.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Collaboration session not found' });
      }
      
      // Check if the user has access to this session's upload
      const upload = await storage.getUpload(session.uploadId);
      if (!upload) {
        return res.status(404).json({ message: 'Associated upload not found' });
      }
      
      // Check if the user is an admin/manager or if the upload belongs to the user's organization
      const isAdmin = req.currentUser!.role === UserRole.ADMIN || req.currentUser!.role === UserRole.MANAGER;
      const hasAccess = upload.organizationId === req.currentUser!.organizationId;
      
      if (!isAdmin && !hasAccess) {
        return res.status(403).json({ message: 'You do not have access to this collaboration session' });
      }
      
      return res.status(200).json(session);
    } catch (error) {
      return res.status(500).json({ message: `Failed to fetch collaboration session: ${(error as Error).message}` });
    }
  });
  
  // Get comments for a specific permit
  app.get('/api/permits/:id/comments', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const permitIdSchema = z.object({ id: z.coerce.number().positive() });
      const { id } = permitIdSchema.parse({ id: req.params.id });
      
      // Check if the permit exists
      const permit = await storage.getPermit(id);
      if (!permit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      
      // Get upload to check organization access
      const upload = await storage.getUpload(permit.uploadId);
      if (!upload) {
        return res.status(404).json({ message: 'Associated upload not found' });
      }
      
      // Check if the permit's upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to this permit' });
      }
      
      const comments = collaborationService.getCommentsForPermit(id);
      return res.status(200).json(comments);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid permit ID format' });
      }
      return res.status(500).json({ message: `Failed to fetch permit comments: ${(error as Error).message}` });
    }
  });
  
  // Get history for a specific permit
  app.get('/api/permits/:id/history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const permitIdSchema = z.object({ id: z.coerce.number().positive() });
      const { id } = permitIdSchema.parse({ id: req.params.id });
      
      // Check if the permit exists
      const permit = await storage.getPermit(id);
      if (!permit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      
      // Get upload to check organization access
      const upload = await storage.getUpload(permit.uploadId);
      if (!upload) {
        return res.status(404).json({ message: 'Associated upload not found' });
      }
      
      // Check if the permit's upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to this permit' });
      }
      
      const history = await storage.getPermitHistoriesByPermitId(id);
      return res.status(200).json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid permit ID format' });
      }
      return res.status(500).json({ message: `Failed to fetch permit history: ${(error as Error).message}` });
    }
  });
  
  // Get history for all permits in an upload
  app.get('/api/uploads/:id/history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const uploadIdSchema = z.object({ id: z.coerce.number().positive() });
      const { id } = uploadIdSchema.parse({ id: req.params.id });
      
      // Check if the upload exists
      const upload = await storage.getUpload(id);
      if (!upload) {
        return res.status(404).json({ message: 'Upload not found' });
      }
      
      // Check if the upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to this upload' });
      }
      
      const history = await storage.getPermitHistoriesByUploadId(id);
      return res.status(200).json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid upload ID format' });
      }
      return res.status(500).json({ message: `Failed to fetch upload history: ${(error as Error).message}` });
    }
  });
  
  // Add an endpoint to update a permit with history tracking
  app.patch('/api/permits/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const permitIdSchema = z.object({ id: z.coerce.number().positive() });
      const { id } = permitIdSchema.parse({ id: req.params.id });
      
      // Validate update data
      const permitUpdateSchema = z.object({
        parcelNumber: z.string().optional(),
        neighborhoodCode: z.string().optional(),
        permitDescription: z.string().optional(),
        value: z.string().optional(),
        issueDate: z.string().optional(),
        enterPermit: z.boolean().optional(),
        reason: z.string().optional(),
        userId: z.number().positive(), // Required for history tracking
        actionDetail: z.string() // Description of the change
      });
      
      const permitData = permitUpdateSchema.parse(req.body);
      
      // Extract history fields from the update
      const { userId, actionDetail, ...permitUpdate } = permitData;
      
      // Check if permit exists
      const existingPermit = await storage.getPermit(id);
      if (!existingPermit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      
      // Get the upload to check organization access
      const upload = await storage.getUpload(existingPermit.uploadId);
      if (!upload) {
        return res.status(404).json({ message: 'Associated upload not found' });
      }
      
      // Check if the permit's upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to update this permit' });
      }
      
      // Update the permit
      const updatedPermit = await storage.updatePermit(id, permitUpdate);
      
      // Determine which fields have been changed
      const changedFields: Record<string, any> = {};
      const previousValues: Record<string, any> = {};
      
      Object.keys(permitUpdate).forEach(key => {
        const typedKey = key as keyof typeof permitUpdate;
        // Only record if values are actually different
        if (permitUpdate[typedKey] !== existingPermit[typedKey as keyof typeof existingPermit]) {
          changedFields[key] = permitUpdate[typedKey];
          previousValues[key] = existingPermit[typedKey as keyof typeof existingPermit];
        }
      });
      
      // Only create history entry if there were actual changes
      if (Object.keys(changedFields).length > 0) {
        await storage.createPermitHistory({
          permitId: id,
          userId,
          action: 'update',
          detail: {
            changes: changedFields,
            description: actionDetail,
            previousState: previousValues
          }
        });
        
        // Log details about the update
        log(`Permit #${id} updated by user #${userId}: ${Object.keys(changedFields).join(', ')}`, 'routes');
      }
      
      return res.status(200).json(updatedPermit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid permit update data', 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: `Failed to update permit: ${(error as Error).message}` });
    }
  });
  
  // Settings Routes
  
  // Save OpenAI API key
  app.post('/api/settings/openai-key', isAuthenticated, hasRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
    try {
      const keySchema = z.object({
        apiKey: z.string().min(1)
      });
      
      const { apiKey } = keySchema.parse(req.body);
      
      // Validate OpenAI key format
      if (!isValidOpenAIKey(apiKey)) {
        return res.status(400).json({ 
          message: 'Invalid OpenAI API key format. Keys should start with "sk-" and be at least 30 characters long.' 
        });
      }
      
      // Set the API key in environment
      process.env.OPENAI_API_KEY = apiKey;
      
      // Return success
      return res.status(200).json({ 
        message: 'OpenAI API key configured successfully',
        isConfigured: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid API key data', 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: `Failed to configure OpenAI API key: ${(error as Error).message}` });
    }
  });
  
  // Check if OpenAI API key is configured
  app.get('/api/settings/openai-key/status', isAuthenticated, (_req: Request, res: Response) => {
    const isConfigured = !!process.env.OPENAI_API_KEY;
    return res.status(200).json({ isConfigured });
  });
  
  // Advanced AI Routes
  
  // Generate enhanced batch summary with AI insights
  app.get('/api/ai/batch-summary/:uploadId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const uploadIdSchema = z.object({ uploadId: z.coerce.number().positive() });
      const { uploadId } = uploadIdSchema.parse({ uploadId: req.params.uploadId });
      
      // Get upload and verify access
      const upload = await storage.getUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ message: 'Upload not found' });
      }
      
      // Check if the upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to this upload' });
      }
      
      // Get permits for this upload
      const permits = await storage.getPermitsByUploadId(uploadId);
      
      // Generate enhanced summary with AI
      const enhancedSummary = await aiService.generateEnhancedBatchSummary(permits);
      
      return res.status(200).json(enhancedSummary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid upload ID format' });
      }
      return res.status(500).json({ message: `Failed to generate enhanced summary: ${(error as Error).message}` });
    }
  });
  
  // Get enhanced explanation for a specific permit decision
  app.get('/api/ai/explain-permit/:permitId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const permitIdSchema = z.object({ permitId: z.coerce.number().positive() });
      const { permitId } = permitIdSchema.parse({ permitId: req.params.permitId });
      
      // Get permit
      const permit = await storage.getPermit(permitId);
      if (!permit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      
      // Get the upload to check access
      const upload = await storage.getUpload(permit.uploadId);
      if (!upload) {
        return res.status(404).json({ message: 'Associated upload not found' });
      }
      
      // Check if the permit's upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to this permit' });
      }
      
      // Generate enhanced explanation using RAG
      const explanation = await aiService.getEnhancedPermitExplanation(permit);
      
      return res.status(200).json(explanation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid permit ID format' });
      }
      return res.status(500).json({ message: `Failed to generate explanation: ${(error as Error).message}` });
    }
  });
  
  // Search for similar permits using vector similarity
  app.post('/api/ai/search-similar', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const searchSchema = z.object({
        query: z.string().min(3),
        limit: z.number().positive().optional().default(5)
      });
      
      const { query, limit } = searchSchema.parse(req.body);
      
      // Get organization ID from user
      const organizationId = req.currentUser!.organizationId;
      
      // Get all uploads for this organization
      const uploads = await storage.getUploadsByOrganization(organizationId);
      const uploadIds = uploads.map(u => u.id);
      
      // Get permits from all organizational uploads for search
      const allPermits: any[] = [];
      for (const uploadId of uploadIds) {
        const permits = await storage.getPermitsByUploadId(uploadId);
        allPermits.push(...permits);
      }
      
      // Ensure permits are vectorized first
      await aiService.vectorizePermitsForSearch(allPermits);
      
      // Search for similar permits
      const searchResults = await aiService.searchSimilarPermits(query, limit);
      
      return res.status(200).json(searchResults);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid search parameters', 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: `Search failed: ${(error as Error).message}` });
    }
  });
  
  // Answer a permit-related question using AI
  app.post('/api/ai/ask-question', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const questionSchema = z.object({
        question: z.string().min(5),
        permitIds: z.array(z.number()).optional()
      });
      
      const { question, permitIds } = questionSchema.parse(req.body);
      
      // If specific permit IDs were provided, fetch them for context
      let relevantPermits: any[] = [];
      if (permitIds && permitIds.length > 0) {
        for (const permitId of permitIds) {
          try {
            const permit = await storage.getPermit(permitId);
            if (permit) {
              // Verify organization access
              const upload = await storage.getUpload(permit.uploadId);
              if (upload && upload.organizationId === req.currentUser!.organizationId) {
                relevantPermits.push(permit);
              }
            }
          } catch (e) {
            // Skip if permit not found or not accessible
          }
        }
      }
      
      // Get answer using RAG
      const answer = await aiService.answerQuestion(question, relevantPermits);
      
      return res.status(200).json({ 
        question, 
        answer,
        usedPermitContext: relevantPermits.length > 0
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid question format', 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: `Failed to answer question: ${(error as Error).message}` });
    }
  });
  
  // Analyze permit history for insights
  app.get('/api/ai/analyze-upload-history/:uploadId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const uploadIdSchema = z.object({ uploadId: z.coerce.number().positive() });
      const { uploadId } = uploadIdSchema.parse({ uploadId: req.params.uploadId });
      
      // Get upload and verify access
      const upload = await storage.getUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ message: 'Upload not found' });
      }
      
      // Check if the upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to this upload' });
      }
      
      // Get permits for this upload
      const permits = await storage.getPermitsByUploadId(uploadId);
      
      // Get history for all permits in this upload
      const history = await storage.getPermitHistoriesByUploadId(uploadId);
      
      // Analyze history with contextual AI
      const analysis = await contextualAiService.analyzePermitHistory(permits, history);
      
      return res.status(200).json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid upload ID format' });
      }
      return res.status(500).json({ message: `Failed to analyze history: ${(error as Error).message}` });
    }
  });
  
  // Review classification consistency with AI
  app.get('/api/ai/review-consistency/:uploadId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const uploadIdSchema = z.object({ uploadId: z.coerce.number().positive() });
      const { uploadId } = uploadIdSchema.parse({ uploadId: req.params.uploadId });
      
      // Get upload and verify access
      const upload = await storage.getUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ message: 'Upload not found' });
      }
      
      // Check if the upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to this upload' });
      }
      
      // Get permits for this upload
      const permits = await storage.getPermitsByUploadId(uploadId);
      
      // Review classification consistency with contextual AI
      const consistencyReview = await contextualAiService.reviewClassificationConsistency(permits);
      
      return res.status(200).json(consistencyReview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid upload ID format' });
      }
      return res.status(500).json({ message: `Failed to review consistency: ${(error as Error).message}` });
    }
  });

  // LangChain API routes
  
  // Enhanced permit classification with LangChain
  app.post('/api/langchain/classify-permit', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const permitSchema = z.object({
        permitId: z.number().positive()
      });
      
      const { permitId } = permitSchema.parse(req.body);
      
      // Get permit
      const permit = await storage.getPermit(permitId);
      if (!permit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      
      // Import langchainService here to avoid circular dependencies
      const { langchainService } = await import('./services/langchainService');
      
      // Classify permit using LangChain
      const result = await langchainService.classifyPermit(permit);
      
      return res.json({
        permitId,
        originalClassification: {
          enterPermit: permit.enterPermit,
          reason: permit.reason
        },
        enhancedClassification: result
      });
    } catch (error) {
      log(`Error in LangChain classify permit endpoint: ${(error as Error).message}`, 'routes');
      return res.status(500).json({ message: `Error classifying permit: ${(error as Error).message}` });
    }
  });
  
  // Enhanced batch consistency review with LangChain
  app.get('/api/langchain/review-consistency/:uploadId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const uploadIdSchema = z.object({ uploadId: z.coerce.number().positive() });
      const { uploadId } = uploadIdSchema.parse({ uploadId: req.params.uploadId });
      
      // Get upload and verify access
      const upload = await storage.getUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ message: 'Upload not found' });
      }
      
      // Check if the upload belongs to the user's current organization
      if (upload.organizationId !== req.currentUser!.organizationId) {
        return res.status(403).json({ message: 'You do not have access to this upload' });
      }
      
      // Get permits for the upload
      const permits = await storage.getPermitsByUploadId(uploadId);
      if (!permits || permits.length === 0) {
        return res.status(404).json({ message: 'No permits found for this upload' });
      }
      
      // Import langchainService here to avoid circular dependencies
      const { langchainService } = await import('./services/langchainService');
      
      // Use LangChain to review consistency
      const consistency = await langchainService.reviewClassificationConsistency(permits);
      
      return res.json(consistency);
    } catch (error) {
      log(`Error in LangChain review consistency endpoint: ${(error as Error).message}`, 'routes');
      return res.status(500).json({ message: `Error reviewing consistency: ${(error as Error).message}` });
    }
  });
  
  // Enhanced permit explanation with LangChain
  app.get('/api/langchain/explain-permit/:permitId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const permitIdSchema = z.object({ permitId: z.coerce.number().positive() });
      const { permitId } = permitIdSchema.parse({ permitId: req.params.permitId });
      
      // Get permit
      const permit = await storage.getPermit(permitId);
      if (!permit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      
      // Import langchainService here to avoid circular dependencies
      const { langchainService } = await import('./services/langchainService');
      
      // Get enhanced explanation
      const explanation = await langchainService.explainPermitDecision(permit);
      
      return res.json(explanation);
    } catch (error) {
      log(`Error in LangChain explain permit endpoint: ${(error as Error).message}`, 'routes');
      return res.status(500).json({ message: `Error explaining permit: ${(error as Error).message}` });
    }
  });
  
  // LangChain Agent API routes
  
  // Deep permit analysis with LangChain agent
  app.get('/api/langchain/agent/analyze-permit/:permitId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const permitIdSchema = z.object({ permitId: z.coerce.number().positive() });
      const { permitId } = permitIdSchema.parse({ permitId: req.params.permitId });
      
      // Get permit
      const permit = await storage.getPermit(permitId);
      if (!permit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      
      // Import langchainAgentService here to avoid circular dependencies
      const { langchainAgentService } = await import('./services/langchainAgentService');
      
      // Analyze permit in depth
      const analysis = await langchainAgentService.analyzePermitInDepth(permitId);
      
      return res.json(analysis);
    } catch (error) {
      log(`Error in LangChain agent analyze permit endpoint: ${(error as Error).message}`, 'routes');
      return res.status(500).json({ message: `Error analyzing permit: ${(error as Error).message}` });
    }
  });
  
  // Neighborhood analysis with LangChain agent
  app.get('/api/langchain/agent/analyze-neighborhood/:code', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const codeSchema = z.object({ code: z.string().min(1) });
      const { code } = codeSchema.parse({ code: req.params.code });
      
      // Import langchainAgentService here to avoid circular dependencies
      const { langchainAgentService } = await import('./services/langchainAgentService');
      
      // Analyze neighborhood patterns
      const analysis = await langchainAgentService.analyzeNeighborhoodPatterns(code);
      
      return res.json(analysis);
    } catch (error) {
      log(`Error in LangChain agent analyze neighborhood endpoint: ${(error as Error).message}`, 'routes');
      return res.status(500).json({ message: `Error analyzing neighborhood: ${(error as Error).message}` });
    }
  });
  
  // Answer complex questions with LangChain agent
  app.post('/api/langchain/agent/ask-question', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const questionSchema = z.object({
        question: z.string().min(5),
        permitId: z.number().positive().optional()
      });
      
      const { question, permitId } = questionSchema.parse(req.body);
      
      // Import langchainAgentService here to avoid circular dependencies
      const { langchainAgentService } = await import('./services/langchainAgentService');
      
      // Answer complex question
      const answer = await langchainAgentService.answerComplexQuestion(question, permitId);
      
      return res.json(answer);
    } catch (error) {
      log(`Error in LangChain agent ask question endpoint: ${(error as Error).message}`, 'routes');
      return res.status(500).json({ message: `Error answering question: ${(error as Error).message}` });
    }
  });
  
  // LangChain Memory API routes
  
  // Process a message in a conversation with memory
  app.post('/api/langchain/conversation/message', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const messageSchema = z.object({
        sessionId: z.string().min(1),
        message: z.string().min(1),
        permitIds: z.array(z.number()).optional()
      });
      
      const { sessionId, message, permitIds } = messageSchema.parse(req.body);
      const userId = req.currentUser!.id.toString();
      
      // Import langchainMemoryService here to avoid circular dependencies
      const { langchainMemoryService } = await import('./services/langchainMemoryService');
      
      // Get permit context if provided
      let permitContext: Permit[] | undefined;
      if (permitIds && permitIds.length > 0) {
        permitContext = [];
        for (const permitId of permitIds) {
          const permit = await storage.getPermit(permitId);
          if (permit) {
            permitContext.push(permit);
          }
        }
      }
      
      // Process message
      const response = await langchainMemoryService.processMessage(sessionId, userId, message, permitContext);
      
      return res.json({
        sessionId,
        message,
        response,
        hasContext: !!permitContext
      });
    } catch (error) {
      log(`Error in LangChain memory message endpoint: ${(error as Error).message}`, 'routes');
      return res.status(500).json({ message: `Error processing message: ${(error as Error).message}` });
    }
  });
  
  // Reset a conversation
  app.post('/api/langchain/conversation/reset', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const resetSchema = z.object({
        sessionId: z.string().min(1),
        permitIds: z.array(z.number()).optional()
      });
      
      const { sessionId, permitIds } = resetSchema.parse(req.body);
      const userId = req.currentUser!.id.toString();
      
      // Import langchainMemoryService here to avoid circular dependencies
      const { langchainMemoryService } = await import('./services/langchainMemoryService');
      
      // Get permit context if provided
      let permitContext: Permit[] | undefined;
      if (permitIds && permitIds.length > 0) {
        permitContext = [];
        for (const permitId of permitIds) {
          const permit = await storage.getPermit(permitId);
          if (permit) {
            permitContext.push(permit);
          }
        }
      }
      
      // Reset conversation
      const success = await langchainMemoryService.resetConversation(sessionId, userId, permitContext);
      
      return res.json({
        sessionId,
        success,
        message: success ? 'Conversation reset successfully' : 'Failed to reset conversation'
      });
    } catch (error) {
      log(`Error in LangChain memory reset endpoint: ${(error as Error).message}`, 'routes');
      return res.status(500).json({ message: `Error resetting conversation: ${(error as Error).message}` });
    }
  });
  
  // Add context to a conversation
  app.post('/api/langchain/conversation/add-context', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const contextSchema = z.object({
        sessionId: z.string().min(1),
        permitIds: z.array(z.number()).min(1)
      });
      
      const { sessionId, permitIds } = contextSchema.parse(req.body);
      const userId = req.currentUser!.id.toString();
      
      // Import langchainMemoryService here to avoid circular dependencies
      const { langchainMemoryService } = await import('./services/langchainMemoryService');
      
      // Get permits
      const permitContext: Permit[] = [];
      for (const permitId of permitIds) {
        const permit = await storage.getPermit(permitId);
        if (permit) {
          permitContext.push(permit);
        }
      }
      
      if (permitContext.length === 0) {
        return res.status(404).json({ message: 'No valid permits found' });
      }
      
      // Add context
      const success = await langchainMemoryService.addConversationContext(sessionId, userId, permitContext);
      
      return res.json({
        sessionId,
        success,
        permitCount: permitContext.length,
        message: success ? 'Context added successfully' : 'Failed to add context'
      });
    } catch (error) {
      log(`Error in LangChain memory add context endpoint: ${(error as Error).message}`, 'routes');
      return res.status(500).json({ message: `Error adding conversation context: ${(error as Error).message}` });
    }
  });
  
  // Serve static files
  app.use('/public', (req, res, next) => {
    console.log(`Serving static file: ${req.path}`);
    next();
  }, (req: Request, res: Response, next) => {
    const staticFilePath = path.join(__dirname, 'public', req.path);
    res.sendFile(staticFilePath, (err) => {
      if (err) {
        console.error(`Error serving static file ${req.path}:`, err);
        next();
      }
    });
  });
  
  // Register AI enhancement routes
  registerAIRoutes(app);
  
  // Register Event-Driven Architecture routes
  registerEventRoutes(app);
  
  // Register Recommendation Engine routes
  registerRecommendationRoutes(app);
  
  // Register Circuit Breaker Routes
  app.use('/api/circuit-breaker', circuitBreakerRoutes);
  
  // Register DynLoader routes
  app.use('/api/dynloader', dynLoaderRoutes);
  
  // Register deployment automation routes
  app.use('/api', deploymentRoutes);
  
  // Register enhanced deployment routes
  app.use('/api', enhancedDeploymentRoutes);
  
  // Register neural permit network routes
  app.use('/api', neuralPermitRoutes);
  
  // Initialize quantum decision engine
  import('./services/quantumDecisionEngine.js').then(({ quantumDecisionEngine }) => {
    quantumDecisionEngine.initialize().then(() => {
      console.log('[Terrafusion-AI] Quantum Neural Permit Network activated');
    }).catch(console.error);
  });
  
  // Register Maintenance Chatbot routes
  registerChatbotRoutes(app);
  
  // Direct PACS health check (for troubleshooting)
  app.get('/api/pacs-health', async (_req: Request, res: Response) => {
    try {
      const url = `http://127.0.0.1:3001/health`;
      console.log(`Checking PACS health at ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({
          status: 'healthy',
          message: 'PACS integration is operational',
          fastapi_status: data,
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(503).json({
          status: 'unhealthy',
          message: `PACS FastAPI server returned status ${response.status}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('Error connecting to FastAPI server:', error);
      return res.status(503).json({
        status: 'unhealthy',
        message: `Failed to connect to PACS FastAPI server: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Register Model Content Protocol (MCP) routes
  registerMCPRoutes(app);
  
  // Register Property Assessment & Classification System (PACS) routes
  registerPacsRoutes(app);
  
  // 404 handler for API routes - must be placed after all API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ 
      status: 'error',
      message: 'API endpoint not found',
      path: req.originalUrl
    });
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize collaboration service with WebSocket server
  // This will set up both regular WebSocket server and Y.js WebSocket server
  collaborationService.initializeWebSocketServer(httpServer);
  
  return httpServer;
}
