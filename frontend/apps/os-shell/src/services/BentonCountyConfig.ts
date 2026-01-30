import { getViteEnv } from '../shared/viteEnv';

/**
 * Benton County Configuration Service
 * Provides county-specific configuration and data for TerraFusion OS
 */

export interface BentonCountyConfig {
  county: {
    name: string;
    code: string;
    fips: string;
    state: string;
    parcelCount: number;
    timezone: string;
  };
  harrisPACS: {
    version: string;
    enabled: boolean;
    syncInterval: number;
    jurisdiction: string;
  };
  deployment: {
    mode: 'production' | 'staging' | 'demo';
    environment: string;
    domain: string;
    sslEnabled: boolean;
  };
  sla: {
    availability: number;
    p95Latency: number;
    syncLagMinutes: number;
    errorRatePercent: number;
  };
  features: {
    aiSwarmEnabled: boolean;
    quantumOptimization: boolean;
    realTimeSync: boolean;
    advancedAnalytics: boolean;
    complianceMonitoring: boolean;
  };
  security: {
    ssoProvider: string;
    mfaRequired: boolean;
    auditLogging: boolean;
    fismaLevel: string;
  };
}

class BentonCountyConfigService {
  private static instance: BentonCountyConfigService;
  private config: BentonCountyConfig;

  private constructor() {
    const env = getViteEnv();
    this.config = {
      county: {
        name: env.VITE_COUNTY_NAME || 'Benton County',
        code: env.VITE_COUNTY_CODE || 'benton',
        fips: env.VITE_COUNTY_FIPS || '53005',
        state: env.VITE_COUNTY_STATE || 'Washington',
        parcelCount: parseInt(
          env.VITE_COUNTY_PARCEL_COUNT ||
            'await DynamicPropertyService.GetPropertyCountAsync("benton")'
        ),
        timezone: 'America/Los_Angeles',
      },
      harrisPACS: {
        version: env.VITE_HARRIS_PACS_VERSION || '9.0',
        enabled: env.VITE_HARRIS_PACS_ENABLED === 'true',
        syncInterval: parseInt(env.VITE_SYNC_INTERVAL || '15'),
        jurisdiction: 'BENTON_WA',
      },
      deployment: {
        mode: env.VITE_DEMO_MODE === 'true' ? 'demo' : 'production',
        environment: env.VITE_DEPLOYMENT_MODE || 'benton_county',
        domain: 'assessor.terrafusionmarket.io',
        sslEnabled: true,
      },
      sla: {
        availability: parseFloat(env.VITE_SLA_AVAILABILITY || '99.9'),
        p95Latency: parseInt(env.VITE_SLA_P95_LATENCY || '150'),
        syncLagMinutes: 10,
        errorRatePercent: 0.1,
      },
      features: {
        aiSwarmEnabled: env.VITE_AI_SWARM_ENABLED === 'true',
        quantumOptimization: env.VITE_QUANTUM_OPTIMIZATION === 'true',
        realTimeSync: env.VITE_REAL_TIME_SYNC === 'true',
        advancedAnalytics: env.VITE_ADVANCED_ANALYTICS === 'true',
        complianceMonitoring: env.VITE_COMPLIANCE_MONITORING === 'true',
      },
      security: {
        ssoProvider: env.VITE_SSO_PROVIDER || 'azure_ad',
        mfaRequired: env.VITE_MFA_REQUIRED === 'true',
        auditLogging: env.VITE_AUDIT_LOGGING === 'true',
        fismaLevel: env.VITE_FISMA_LEVEL || 'HIGH',
      },
    };
  }

  public static getInstance(): BentonCountyConfigService {
    if (!BentonCountyConfigService.instance) {
      BentonCountyConfigService.instance = new BentonCountyConfigService();
    }
    return BentonCountyConfigService.instance;
  }

  public getConfig(): BentonCountyConfig {
    return this.config;
  }

  public getCountyInfo() {
    return this.config.county;
  }

  public getHarrisPACSInfo() {
    return this.config.harrisPACS;
  }

  public getDeploymentInfo() {
    return this.config.deployment;
  }

  public getSLATargets() {
    return this.config.sla;
  }

  public getFeatureFlags() {
    return this.config.features;
  }

  public getSecurityConfig() {
    return this.config.security;
  }

  public isDemo(): boolean {
    return this.config.deployment.mode === 'demo';
  }

  public isProduction(): boolean {
    return this.config.deployment.mode === 'production';
  }

  public getBrandingInfo() {
    return {
      systemName: `${this.config.county.name} TerraFusion`,
      orgName: `${this.config.county.name} Assessor's Office`,
      subtitle: `${this.config.county.name}, ${this.config.county.state} • ${this.config.county.parcelCount.toLocaleString()} Parcels • Harris PACS 9.0 Integration`,
      footer: `${this.config.county.name} Assessment System • TerraFusion OS v1.0 • Government. Transcended.`,
    };
  }

  public getSystemMetrics() {
    return {
      parcelCount: this.config.county.parcelCount.toLocaleString(),
      pacsVersion: this.config.harrisPACS.version,
      syncStatus: this.config.harrisPACS.enabled ? 'LIVE' : 'OFFLINE',
      availability: `${this.config.sla.availability}%`,
      latency: `${this.config.sla.p95Latency}ms`,
    };
  }

  public getEnvironmentInfo() {
    const env = getViteEnv();
    return {
      county: this.config.county.name,
      mode: this.config.deployment.mode,
      environment: this.config.deployment.environment,
      domain: this.config.deployment.domain,
      isDemo: this.isDemo(),
      isMultiCounty: env.VITE_MULTI_COUNTY === 'true',
    };
  }
}

// Export singleton instance
export const bentonCountyConfig = BentonCountyConfigService.getInstance();
export default bentonCountyConfig;
