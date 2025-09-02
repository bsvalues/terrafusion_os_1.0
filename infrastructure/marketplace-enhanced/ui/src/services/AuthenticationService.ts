/**
 * Terrafusion Government Authentication Service
 * Provides government-grade authentication, authorization, and security controls
 * Supports role-based access control and multi-jurisdictional permissions
 */

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  county: string;
  permissions: Permission[];
  lastLogin: string;
  mfaEnabled: boolean;
  securityClearance: 'public' | 'sensitive' | 'confidential' | 'secret';
}

export interface UserRole {
  id: string;
  name: 'public' | 'user' | 'assessor' | 'realtor' | 'county_admin' | 'enterprise_admin' | 'system_admin';
  displayName: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'enterprise';
  description: string;
}

export interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'deploy' | 'audit')[];
  scope: 'county' | 'state' | 'federal' | 'cross_jurisdictional';
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
  county?: string;
  mfaCode?: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  userId: string;
  event: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'suspicious_activity';
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class AuthenticationService {
  private currentUser: User | null = null;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
    this.loadStoredAuth();
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const authData: AuthToken = await response.json();
      
      this.currentUser = authData.user;
      this.authToken = authData.token;
      this.refreshToken = authData.refreshToken;
      
      this.storeAuth(authData);
      this.logSecurityEvent('login', 'User logged in successfully');
      
      return authData;
    } catch (error) {
      this.logSecurityEvent('failed_login', `Login failed: ${error}`);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.authToken) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.logSecurityEvent('logout', 'User logged out');
      this.clearAuth();
    }
  }

  async refreshAuthToken(): Promise<AuthToken> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const authData: AuthToken = await response.json();
      
      this.currentUser = authData.user;
      this.authToken = authData.token;
      this.refreshToken = authData.refreshToken;
      
      this.storeAuth(authData);
      
      return authData;
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

  // Authorization Methods
  hasPermission(resource: string, action: string, scope?: string): boolean {
    if (!this.currentUser) return false;

    return this.currentUser.permissions.some(permission => {
      const resourceMatch = permission.resource === resource || permission.resource === '*';
      const actionMatch = permission.actions.includes(action as any) || permission.actions.includes('*' as any);
      const scopeMatch = !scope || permission.scope === scope || permission.scope === 'cross_jurisdictional';
      
      return resourceMatch && actionMatch && scopeMatch;
    });
  }

  hasRole(roleName: string): boolean {
    return this.currentUser?.role.name === roleName;
  }

  hasTierAccess(tier: 'tier1' | 'tier2' | 'tier3' | 'enterprise'): boolean {
    if (!this.currentUser) return false;
    
    const tierHierarchy = ['tier1', 'tier2', 'tier3', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(this.currentUser.role.tier);
    const requiredTierIndex = tierHierarchy.indexOf(tier);
    
    return userTierIndex >= requiredTierIndex;
  }

  canAccessCounty(countyId: string): boolean {
    if (!this.currentUser) return false;
    
    // System admins can access all counties
    if (this.currentUser.role.name === 'system_admin') return true;
    
    // Enterprise admins can access multiple counties
    if (this.currentUser.role.name === 'enterprise_admin') return true;
    
    // Regular users can only access their assigned county
    return this.currentUser.county === countyId;
  }

  // Security Methods
  async enableMFA(): Promise<{ qrCode: string; backupCodes: string[] }> {
    if (!this.authToken) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/auth/mfa/enable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('MFA setup failed');
    }

    return response.json();
  }

  async verifyMFA(code: string): Promise<boolean> {
    if (!this.authToken) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/auth/mfa/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    return response.ok;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.authToken) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password change failed');
    }

    this.logSecurityEvent('password_change', 'Password changed successfully');
  }

  // User Management
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.authToken;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  async getUserProfile(): Promise<User> {
    if (!this.authToken) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const user = await response.json();
    this.currentUser = user;
    return user;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.authToken) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Profile update failed');
    }

    const user = await response.json();
    this.currentUser = user;
    return user;
  }

  // Security Monitoring
  async getSecurityEvents(filters?: {
    startDate?: string;
    endDate?: string;
    severity?: string;
    eventType?: string;
  }): Promise<SecurityEvent[]> {
    if (!this.authToken) throw new Error('Not authenticated');

    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }

    const response = await fetch(`${this.baseUrl}/auth/security-events?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch security events');
    }

    return response.json();
  }

  private async logSecurityEvent(event: SecurityEvent['event'], details: string): Promise<void> {
    try {
      const securityEvent: Omit<SecurityEvent, 'id' | 'timestamp'> = {
        userId: this.currentUser?.id || 'anonymous',
        event,
        details,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        severity: this.getEventSeverity(event),
      };

      if (this.authToken) {
        await fetch(`${this.baseUrl}/auth/security-events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(securityEvent),
        });
      }
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  }

  private getEventSeverity(event: SecurityEvent['event']): SecurityEvent['severity'] {
    switch (event) {
      case 'failed_login':
      case 'permission_denied':
        return 'medium';
      case 'suspicious_activity':
        return 'high';
      case 'login':
      case 'logout':
      default:
        return 'low';
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Storage Methods
  private storeAuth(authData: AuthToken): void {
    try {
      localStorage.setItem('tf_auth_token', authData.token);
      localStorage.setItem('tf_refresh_token', authData.refreshToken);
      localStorage.setItem('tf_user', JSON.stringify(authData.user));
      localStorage.setItem('tf_expires_at', authData.expiresAt);
    } catch (error) {
      console.warn('Failed to store auth data:', error);
    }
  }

  private loadStoredAuth(): void {
    try {
      const token = localStorage.getItem('tf_auth_token');
      const refreshToken = localStorage.getItem('tf_refresh_token');
      const userStr = localStorage.getItem('tf_user');
      const expiresAt = localStorage.getItem('tf_expires_at');

      if (token && refreshToken && userStr && expiresAt) {
        const expirationDate = new Date(expiresAt);
        if (expirationDate > new Date()) {
          this.authToken = token;
          this.refreshToken = refreshToken;
          this.currentUser = JSON.parse(userStr);
        } else {
          this.clearAuth();
        }
      }
    } catch (error) {
      console.warn('Failed to load stored auth:', error);
      this.clearAuth();
    }
  }

  private clearAuth(): void {
    this.currentUser = null;
    this.authToken = null;
    this.refreshToken = null;
    
    try {
      localStorage.removeItem('tf_auth_token');
      localStorage.removeItem('tf_refresh_token');
      localStorage.removeItem('tf_user');
      localStorage.removeItem('tf_expires_at');
    } catch (error) {
      console.warn('Failed to clear stored auth:', error);
    }
  }

  // Mock Data for Development
  getMockUser(): User {
    return {
      id: 'user-001',
      username: 'admin@bentoncountywa.gov',
      email: 'admin@bentoncountywa.gov',
      firstName: 'John',
      lastName: 'Smith',
      role: {
        id: 'county-admin',
        name: 'county_admin',
        displayName: 'County Administrator',
        tier: 'tier3',
        description: 'Full administrative access to county systems and data'
      },
      county: 'benton-wa',
      permissions: [
        {
          resource: '*',
          actions: ['read', 'write', 'delete', 'deploy', 'audit'],
          scope: 'county'
        }
      ],
      lastLogin: new Date().toISOString(),
      mfaEnabled: true,
      securityClearance: 'confidential'
    };
  }

  // Development mode login
  async mockLogin(): Promise<AuthToken> {
    const user = this.getMockUser();
    const authData: AuthToken = {
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user
    };

    this.currentUser = user;
    this.authToken = authData.token;
    this.refreshToken = authData.refreshToken;
    
    this.storeAuth(authData);
    
    return authData;
  }
}

// Export singleton instance
export const authService = new AuthenticationService();
export default AuthenticationService;
