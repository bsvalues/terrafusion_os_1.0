/**
 * Authentication Service
 *
 * This service handles authentication and authorization for the MCP API,
 * including JWT token issuance, validation, and user permission management.
 */

import jwt from 'jsonwebtoken';
import { IStorage } from '../storage';
import { User } from '../../shared/schema';
import { ISecurityService, SecurityEvent } from './security';

// JWT Options
const JWT_OPTIONS = {
  expiresIn: '4h',
  issuer: 'benton-assessor-mcp',
};

// Default role permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'admin',
    'authenticated',
    'pacs.read',
    'pacs.write',
    'pacs.admin',
    'property.read',
    'property.write',
    'appeal.read',
    'appeal.write',
    'report.read',
    'report.write',
  ],
  assessor: [
    'authenticated',
    'pacs.read',
    'pacs.write',
    'property.read',
    'property.write',
    'appeal.read',
    'appeal.write',
    'report.read',
    'report.write',
  ],
  appraiser: [
    'authenticated',
    'pacs.read',
    'property.read',
    'property.write',
    'appeal.read',
    'report.read',
  ],
  clerk: ['authenticated', 'pacs.read', 'property.read', 'appeal.read', 'report.read'],
  taxpayer: ['authenticated', 'property.read', 'appeal.read', 'appeal.write'],
  agent: ['authenticated', 'pacs.read', 'property.read'],
};

// Auth Token
export interface AuthToken {
  userId: number;
  username: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
}

// Auth Service Interface
export interface IAuthService {
  // Token generation and validation
  generateToken(user: User): string;
  validateToken(token: string): AuthToken | null;

  // User authentication
  authenticateUser(
    username: string,
    password: string
  ): Promise<{ user: User; token: string } | null>;

  // Permission checking
  hasPermission(token: AuthToken, permission: string): boolean;
  hasAnyPermission(token: AuthToken, permissions: string[]): boolean;
  hasAllPermissions(token: AuthToken, permissions: string[]): boolean;

  // Validate MCP agent requests
  validateAgentRequest(agentId: number, apiKey: string): Promise<boolean>;

  // API key validation
  validateApiKey(
    apiKey: string,
    clientIp: string
  ): { userId: number; clientId: string; accessLevel: string } | null;
}

// Auth Service Implementation
export class AuthService implements IAuthService {
  private storage: IStorage;
  private securityService: ISecurityService;
  private jwtSecret: string;

  constructor(storage: IStorage, securityService: ISecurityService) {
    this.storage = storage;
    this.securityService = securityService;
    this.jwtSecret = process.env.JWT_SECRET || 'benton-county-mcp-jwt-secret-key';
  }

  /**
   * Generate a JWT token for a user
   *
   * @param user - The user to generate a token for
   */
  generateToken(user: User): string {
    // Get permissions for the user's roles
    const permissions = this.getPermissionsForRoles(user.roles || ['taxpayer']);

    // Create token payload
    const payload = {
      userId: user.userId,
      username: user.username,
      roles: user.roles || ['taxpayer'],
      permissions,
    };

    // Generate and return token
    return jwt.sign(payload, this.jwtSecret, JWT_OPTIONS);
  }

  /**
   * Validate a JWT token
   *
   * @param token - The token to validate
   */
  validateToken(token: string): AuthToken | null {
    try {
      // Verify token
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: JWT_OPTIONS.issuer,
      }) as AuthToken;

      // Log successful token validation
      this.securityService.logSecurityEvent({
        eventType: 'authentication',
        component: 'auth-service',
        userId: decoded.userId,
        details: {
          action: 'token_validation',
          username: decoded.username,
        },
        severity: 'info',
      });

      return decoded;
    } catch (error) {
      // Log failed token validation
      this.securityService.logSecurityEvent({
        eventType: 'authentication',
        component: 'auth-service',
        details: {
          action: 'token_validation',
          error: error instanceof Error ? error.message : 'Unknown error',
          token: token.substring(0, 10) + '...',
        },
        severity: 'warning',
      });

      return null;
    }
  }

  /**
   * Authenticate a user with username and password
   *
   * @param username - The username
   * @param password - The password
   */
  async authenticateUser(
    username: string,
    password: string
  ): Promise<{ user: User; token: string } | null> {
    try {
      // Get user by username
      const user = await this.storage.getUserByUsername(username);

      // Check if user exists
      if (!user) {
        // Log failed authentication attempt
        this.securityService.logSecurityEvent({
          eventType: 'authentication',
          component: 'auth-service',
          details: {
            action: 'login_attempt',
            username,
            reason: 'user_not_found',
          },
          severity: 'warning',
        });

        return null;
      }

      // Check password (in a real implementation, this would use a password hashing library)
      if (user.password !== password) {
        // Log failed authentication attempt
        this.securityService.logSecurityEvent({
          eventType: 'authentication',
          component: 'auth-service',
          userId: user.userId,
          details: {
            action: 'login_attempt',
            username,
            reason: 'invalid_password',
          },
          severity: 'warning',
        });

        return null;
      }

      // Generate token
      const token = this.generateToken(user);

      // Log successful authentication
      this.securityService.logSecurityEvent({
        eventType: 'authentication',
        component: 'auth-service',
        userId: user.userId,
        details: {
          action: 'login_success',
          username,
        },
        severity: 'info',
      });

      return { user, token };
    } catch (error) {
      // Log authentication error
      this.securityService.logSecurityEvent({
        eventType: 'authentication',
        component: 'auth-service',
        details: {
          action: 'login_attempt',
          username,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        severity: 'error',
      });

      return null;
    }
  }

  /**
   * Check if a token has a specific permission
   *
   * @param token - The auth token
   * @param permission - The permission to check
   */
  hasPermission(token: AuthToken, permission: string): boolean {
    // Admin role has all permissions
    if (token.roles.includes('admin')) {
      return true;
    }

    return token.permissions.includes(permission);
  }

  /**
   * Check if a token has any of the specified permissions
   *
   * @param token - The auth token
   * @param permissions - The permissions to check
   */
  hasAnyPermission(token: AuthToken, permissions: string[]): boolean {
    // Admin role has all permissions
    if (token.roles.includes('admin')) {
      return true;
    }

    return permissions.some(permission => token.permissions.includes(permission));
  }

  /**
   * Check if a token has all of the specified permissions
   *
   * @param token - The auth token
   * @param permissions - The permissions to check
   */
  hasAllPermissions(token: AuthToken, permissions: string[]): boolean {
    // Admin role has all permissions
    if (token.roles.includes('admin')) {
      return true;
    }

    return permissions.every(permission => token.permissions.includes(permission));
  }

  /**
   * Validate an MCP agent request
   *
   * @param agentId - The agent ID
   * @param apiKey - The API key
   */
  async validateAgentRequest(agentId: number, apiKey: string): Promise<boolean> {
    try {
      // In a real implementation, this would check the agent's API key against a stored value
      // For demo purposes, we'll just check if the agent exists

      // Get all agents
      const agents = await this.storage.getAllAiAgents();

      // Find the agent by ID
      const agent = agents.find(a => a.id === agentId);

      if (!agent) {
        // Log failed agent validation
        this.securityService.logSecurityEvent({
          eventType: 'authentication',
          component: 'auth-service',
          details: {
            action: 'agent_validation',
            agentId,
            reason: 'agent_not_found',
          },
          severity: 'warning',
        });

        return false;
      }

      // For demo, validate with a simple check
      // In production, use proper API key validation
      const isValid = apiKey === `agent-key-${agentId}`;

      // Log agent validation result
      this.securityService.logSecurityEvent({
        eventType: 'authentication',
        component: 'auth-service',
        details: {
          action: 'agent_validation',
          agentId,
          agentName: agent.name,
          result: isValid ? 'success' : 'invalid_key',
        },
        severity: isValid ? 'info' : 'warning',
      });

      return isValid;
    } catch (error) {
      // Log agent validation error
      this.securityService.logSecurityEvent({
        eventType: 'authentication',
        component: 'auth-service',
        details: {
          action: 'agent_validation',
          agentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        severity: 'error',
      });

      return false;
    }
  }

  /**
   * Validate API key
   *
   * @param apiKey - The API key to validate
   * @param clientIp - The client IP address
   */
  validateApiKey(
    apiKey: string,
    clientIp: string
  ): { userId: number; clientId: string; accessLevel: string } | null {
    try {
      // For development purposes, accept any key starting with "dev-" as a valid API key with admin access
      if (apiKey && (apiKey === 'dev-key' || apiKey.startsWith('dev-'))) {
        this.securityService
          .logSecurityEvent({
            eventType: 'authentication',
            component: 'auth-service',
            details: {
              action: 'api_key_validation',
              clientIp,
              result: 'success_dev_key',
            },
            severity: 'info',
          })
          .catch(err => console.error('Failed to log API key validation:', err));

        return {
          userId: 1, // Admin user ID
          clientId: 'dev-client',
          accessLevel: 'admin',
        };
      }

      // In production, this would validate the key against a database of API keys
      // and apply rate limiting, IP restrictions, etc.

      // Log failed validation
      this.securityService
        .logSecurityEvent({
          eventType: 'security_authentication',
          component: 'auth-service',
          details: {
            action: 'api_key_validation',
            clientIp,
            key: apiKey ? apiKey.substring(0, 4) + '****' : 'undefined',
            result: 'invalid_key',
            severity: 'warning',
            ipAddress: clientIp,
          },
          severity: 'warning',
        })
        .catch(err => console.error('Failed to log API key validation:', err));

      return null;
    } catch (error) {
      // Log validation error
      this.securityService
        .logSecurityEvent({
          eventType: 'security_authentication',
          component: 'auth-service',
          details: {
            action: 'api_key_validation',
            clientIp,
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'error',
            ipAddress: clientIp,
          },
          severity: 'error',
        })
        .catch(err => console.error('Failed to log API key validation error:', err));

      return null;
    }
  }

  /**
   * Get permissions for a set of roles
   *
   * @param roles - The roles to get permissions for
   */
  private getPermissionsForRoles(roles: string[]): string[] {
    const permissionSet = new Set<string>();

    // Add permissions for each role
    for (const role of roles) {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      for (const permission of rolePermissions) {
        permissionSet.add(permission);
      }
    }

    return Array.from(permissionSet);
  }
}
