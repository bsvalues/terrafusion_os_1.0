/**
 * Terrafusion Government API Service
 * Provides backend integration for government-specific features
 * Supports federated architecture, AI validation, and compliance tracking
 */

export interface County {
  id: string;
  name: string;
  state: string;
  population: number;
  federationStatus: 'active' | 'pending' | 'inactive';
  complianceScore: number;
  securityLevel: 'high' | 'medium' | 'low';
  lastAudit: string;
  contactInfo?: {
    email: string;
    phone: string;
    administrator: string;
  };
}

export interface GovernmentPlugin {
  id: string;
  name: string;
  version: string;
  category:
    | 'assessment'
    | 'taxation'
    | 'gis'
    | 'compliance'
    | 'reporting'
    | 'pilt'
    | 'costforge'
    | 'other';
  governmentTier: 'county' | 'state' | 'federal' | 'multi-jurisdictional';
  description: string;
  publisher: string;
  licenseType: 'free' | 'tiered' | 'usage-based' | 'enterprise';
  validationStatus: 'validated' | 'pending' | 'failed' | 'expired';
  securityRating: number;
  deployedCounties: string[];
  supportedPlatforms: ('windows' | 'linux' | 'macos' | 'web')[];
  pricing?: {
    tier1?: number;
    tier2?: number;
    tier3?: number;
    usageBased?: {
      perTransaction: number;
      monthlyBase: number;
    };
  };
  compliance: {
    fisma: boolean;
    stateDOE: boolean;
    countyAudit: boolean;
  };
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  county?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface ValidationStatus {
  security: 'passed' | 'warning' | 'failed';
  compliance: 'passed' | 'warning' | 'failed';
  performance: 'passed' | 'warning' | 'failed';
  integration: 'passed' | 'warning' | 'failed';
  lastValidated: string;
  aiConfidence: number;
  details?: string;
}

export interface DeploymentMetrics {
  totalDeployments: number;
  activeCounties: number;
  monthlyUsage: number;
  averageResponseTime: number;
  uptime: number;
  errorRate: number;
}

class GovernmentAPIService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api') {
    this.baseUrl = baseUrl;
  }

  // Authentication
  async authenticate(credentials: {
    username: string;
    password: string;
    county?: string;
  }): Promise<{ token: string; user: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      this.authToken = data.token;
      return data;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // County Management
  async getCounties(): Promise<County[]> {
    try {
      const response = await this.makeRequest('/counties');
      return response.data || this.getMockCounties();
    } catch (error) {
      console.warn('Using mock data for counties:', error);
      return this.getMockCounties();
    }
  }

  async getCountyById(id: string): Promise<County | null> {
    try {
      const response = await this.makeRequest(`/counties/${id}`);
      return response.data;
    } catch (error) {
      console.warn('Using mock data for county:', error);
      const counties = this.getMockCounties();
      return counties.find(c => c.id === id) || null;
    }
  }

  // Plugin Management
  async getGovernmentPlugins(filters?: {
    category?: string;
    tier?: string;
    validationStatus?: string;
    county?: string;
  }): Promise<GovernmentPlugin[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
      }

      const response = await this.makeRequest(`/plugins/government?${queryParams}`);
      return response.data || this.getMockPlugins();
    } catch (error) {
      console.warn('Using mock data for plugins:', error);
      return this.getMockPlugins();
    }
  }

  async getPluginById(id: string): Promise<GovernmentPlugin | null> {
    try {
      const response = await this.makeRequest(`/plugins/${id}`);
      return response.data;
    } catch (error) {
      console.warn('Using mock data for plugin:', error);
      const plugins = this.getMockPlugins();
      return plugins.find(p => p.id === id) || null;
    }
  }

  // Validation and Compliance
  async getValidationStatus(pluginId: string): Promise<ValidationStatus> {
    try {
      const response = await this.makeRequest(`/validation/${pluginId}`);
      return response.data || this.getMockValidationStatus(pluginId);
    } catch (error) {
      console.warn('Using mock validation data:', error);
      return this.getMockValidationStatus(pluginId);
    }
  }

  async triggerValidation(pluginId: string, county: string): Promise<{ jobId: string }> {
    try {
      const response = await this.makeRequest(`/validation/trigger`, {
        method: 'POST',
        body: JSON.stringify({ pluginId, county }),
      });
      return response.data;
    } catch (error) {
      console.error('Validation trigger failed:', error);
      throw error;
    }
  }

  // Deployment Management
  async deployPlugin(pluginId: string, counties: string[]): Promise<{ deploymentId: string }> {
    try {
      const response = await this.makeRequest(`/deployments`, {
        method: 'POST',
        body: JSON.stringify({ pluginId, counties }),
      });
      return response.data;
    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  }

  async getDeploymentMetrics(pluginId: string): Promise<DeploymentMetrics> {
    try {
      const response = await this.makeRequest(`/deployments/${pluginId}/metrics`);
      return response.data || this.getMockDeploymentMetrics();
    } catch (error) {
      console.warn('Using mock deployment metrics:', error);
      return this.getMockDeploymentMetrics();
    }
  }

  // Audit Trail
  async getAuditTrail(filters?: {
    county?: string;
    plugin?: string;
    startDate?: string;
    endDate?: string;
    severity?: string;
  }): Promise<AuditEntry[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
      }

      const response = await this.makeRequest(`/audit?${queryParams}`);
      return response.data || this.getMockAuditTrail();
    } catch (error) {
      console.warn('Using mock audit data:', error);
      return this.getMockAuditTrail();
    }
  }

  // Compliance Reporting
  async generateComplianceReport(
    county: string,
    reportType: 'executive' | 'detailed' | 'audit'
  ): Promise<{ reportUrl: string }> {
    try {
      const response = await this.makeRequest(`/reports/compliance`, {
        method: 'POST',
        body: JSON.stringify({ county, reportType }),
      });
      return response.data;
    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  }

  // Utility Methods
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Mock Data Methods (for development/testing)
  private getMockCounties(): County[] {
    return [
      {
        id: 'benton-wa',
        name: 'Benton County',
        state: 'Washington',
        population: 206873,
        federationStatus: 'active',
        complianceScore: 94,
        securityLevel: 'high',
        lastAudit: '2025-07-15',
        contactInfo: {
          email: 'admin@bentoncountywa.gov',
          phone: '(509) 736-3000',
          administrator: 'John Smith',
        },
      },
      {
        id: 'franklin-wa',
        name: 'Franklin County',
        state: 'Washington',
        population: 95222,
        federationStatus: 'active',
        complianceScore: 89,
        securityLevel: 'high',
        lastAudit: '2025-06-20',
        contactInfo: {
          email: 'admin@franklincountywa.org',
          phone: '(509) 545-3500',
          administrator: 'Jane Doe',
        },
      },
      {
        id: 'walla-walla-wa',
        name: 'Walla Walla County',
        state: 'Washington',
        population: 62584,
        federationStatus: 'pending',
        complianceScore: 76,
        securityLevel: 'medium',
        lastAudit: '2025-05-10',
      },
    ];
  }

  private getMockPlugins(): GovernmentPlugin[] {
    return [
      {
        id: 'costforge-pro',
        name: 'CostForge Professional',
        version: '2.1.3',
        category: 'costforge',
        governmentTier: 'county',
        description:
          'Advanced construction cost estimation and valuation platform for county assessors with AI-powered analytics and federal compliance.',
        publisher: 'Terrafusion Systems',
        licenseType: 'tiered',
        validationStatus: 'validated',
        securityRating: 9.2,
        deployedCounties: ['benton-wa', 'franklin-wa'],
        supportedPlatforms: ['windows', 'linux', 'web'],
        pricing: {
          tier1: 299,
          tier2: 599,
          tier3: 1299,
        },
        compliance: {
          fisma: true,
          stateDOE: true,
          countyAudit: true,
        },
        auditTrail: [],
      },
      {
        id: 'pilt-calculator',
        name: 'PILT Distribution Calculator',
        version: '1.8.2',
        category: 'pilt',
        governmentTier: 'county',
        description:
          'Federal PILT (Payment in Lieu of Taxes) distribution calculator with automated compliance reporting and audit trails.',
        publisher: 'Terrafusion Systems',
        licenseType: 'usage-based',
        validationStatus: 'validated',
        securityRating: 9.8,
        deployedCounties: ['benton-wa'],
        supportedPlatforms: ['windows', 'linux', 'macos', 'web'],
        pricing: {
          usageBased: {
            perTransaction: 0.5,
            monthlyBase: 199,
          },
        },
        compliance: {
          fisma: true,
          stateDOE: true,
          countyAudit: true,
        },
        auditTrail: [],
      },
    ];
  }

  private getMockValidationStatus(pluginId: string): ValidationStatus {
    return {
      security: 'passed',
      compliance: 'passed',
      performance: 'passed',
      integration: 'warning',
      lastValidated: new Date().toISOString(),
      aiConfidence: 0.94,
      details: 'All security and compliance checks passed. Minor integration warning resolved.',
    };
  }

  private getMockDeploymentMetrics(): DeploymentMetrics {
    return {
      totalDeployments: 12,
      activeCounties: 8,
      monthlyUsage: 1247,
      averageResponseTime: 245,
      uptime: 99.7,
      errorRate: 0.03,
    };
  }

  private getMockAuditTrail(): AuditEntry[] {
    return [
      {
        id: 'audit-001',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'Plugin Deployment',
        user: 'admin@bentoncountywa.gov',
        details: 'CostForge Professional deployed to Benton County',
        county: 'benton-wa',
        severity: 'info',
      },
      {
        id: 'audit-002',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        action: 'Validation Check',
        user: 'system',
        details: 'Automated security validation completed successfully',
        severity: 'info',
      },
    ];
  }
}

// Export singleton instance
export const governmentAPI = new GovernmentAPIService();
export default GovernmentAPIService;
