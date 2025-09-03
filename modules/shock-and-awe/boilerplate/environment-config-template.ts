/**
 * TerraFusion Environment Configuration Template
 * Comprehensive environment management for all deployment scenarios
 * 
 * Supports:
 * - Development, staging, production environments
 * - Government security requirements
 * - County-specific configurations
 * - Feature flags and toggles
 * - Database and service configurations
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  connectionLimit: number;
  migrationPath: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database: number;
  keyPrefix: string;
  ttl: number;
}

export interface AIServiceConfig {
  provider: 'openai' | 'azure' | 'aws' | 'local';
  apiKey?: string;
  endpoint?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  corsOrigins: string[];
  enableAuditLogging: boolean;
  requireHttps: boolean;
}

export interface CountyConfig {
  countyId: string;
  countyName: string;
  state: string;
  assessorOffice: string;
  contactEmail: string;
  timezone: string;
  taxYear: number;
  legacySystems: {
    harris?: {
      endpoint: string;
      apiKey: string;
      version: string;
    };
    tyler?: {
      endpoint: string;
      apiKey: string;
    };
    aumentum?: {
      endpoint: string;
      credentials: string;
    };
  };
}

export interface FeatureFlags {
  aiAssessment: boolean;
  bulkImport: boolean;
  advancedAnalytics: boolean;
  realTimeSync: boolean;
  mobileApp: boolean;
  apiV2: boolean;
  betaFeatures: boolean;
  maintenanceMode: boolean;
}

export interface MonitoringConfig {
  prometheus: {
    enabled: boolean;
    port: number;
    path: string;
  };
  grafana: {
    enabled: boolean;
    url?: string;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'text';
    destination: 'console' | 'file' | 'database';
    rotateFiles: boolean;
  };
  healthCheck: {
    interval: number;
    timeout: number;
    endpoints: string[];
  };
}

export interface TerraFusionConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  port: number;
  host: string;
  baseUrl: string;
  
  database: DatabaseConfig;
  redis: RedisConfig;
  ai: AIServiceConfig;
  security: SecurityConfig;
  county: CountyConfig;
  features: FeatureFlags;
  monitoring: MonitoringConfig;
  
  // Government compliance settings
  compliance: {
    fismaLevel: 'low' | 'moderate' | 'high';
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    dataRetentionDays: number;
    auditRetentionYears: number;
    requireMultiFactorAuth: boolean;
  };
}

// =============================================
// CONFIGURATION FACTORY
// =============================================

export class ConfigManager {
  private static instance: ConfigManager;
  private config: TerraFusionConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): TerraFusionConfig {
    return this.config;
  }

  public get<K extends keyof TerraFusionConfig>(key: K): TerraFusionConfig[K] {
    return this.config[key];
  }

  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature] ?? false;
  }

  public isProduction(): boolean {
    return this.config.environment === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  private loadConfiguration(): TerraFusionConfig {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
      case 'production':
        return this.createProductionConfig();
      case 'staging':
        return this.createStagingConfig();
      default:
        return this.createDevelopmentConfig();
    }
  }

  private createDevelopmentConfig(): TerraFusionConfig {
    return {
      environment: 'development',
      version: process.env.npm_package_version || '1.0.0',
      port: parseInt(process.env.PORT || '5000'),
      host: process.env.HOST || 'localhost',
      baseUrl: process.env.BASE_URL || 'http://localhost:5000',

      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'terrafusion_dev',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        ssl: false,
        connectionLimit: 10,
        migrationPath: './migrations'
      },

      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        database: 0,
        keyPrefix: 'tf:dev:',
        ttl: 3600
      },

      ai: {
        provider: 'local',
        model: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.3,
        enabled: false // Disabled in development by default
      },

      security: {
        jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
        jwtExpiresIn: '24h',
        bcryptRounds: 10,
        rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
        rateLimitMaxRequests: 1000,
        corsOrigins: ['http://localhost:3000', 'http://localhost:5173'],
        enableAuditLogging: true,
        requireHttps: false
      },

      county: {
        countyId: 'dev-county',
        countyName: 'Development County',
        state: 'WA',
        assessorOffice: 'Development Assessor Office',
        contactEmail: 'dev@terrafusion.local',
        timezone: 'America/Los_Angeles',
        taxYear: new Date().getFullYear(),
        legacySystems: {
          harris: {
            endpoint: 'http://localhost:8080/harris',
            apiKey: 'dev-harris-key',
            version: '12.4.7'
          }
        }
      },

      features: {
        aiAssessment: false,
        bulkImport: true,
        advancedAnalytics: true,
        realTimeSync: false,
        mobileApp: false,
        apiV2: true,
        betaFeatures: true,
        maintenanceMode: false
      },

      monitoring: {
        prometheus: {
          enabled: true,
          port: 9090,
          path: '/metrics'
        },
        grafana: {
          enabled: false
        },
        logging: {
          level: 'debug',
          format: 'text',
          destination: 'console',
          rotateFiles: false
        },
        healthCheck: {
          interval: 30000,
          timeout: 5000,
          endpoints: ['/api/health', '/api/health/database']
        }
      },

      compliance: {
        fismaLevel: 'low',
        encryptionAtRest: false,
        encryptionInTransit: false,
        dataRetentionDays: 30,
        auditRetentionYears: 1,
        requireMultiFactorAuth: false
      }
    };
  }

  private createStagingConfig(): TerraFusionConfig {
    return {
      ...this.createDevelopmentConfig(),
      environment: 'staging',
      port: parseInt(process.env.PORT || '5000'),
      baseUrl: process.env.BASE_URL || 'https://staging.terrafusion.gov',

      database: {
        ...this.createDevelopmentConfig().database,
        host: process.env.DB_HOST || 'staging-db.terrafusion.internal',
        database: process.env.DB_NAME || 'terrafusion_staging',
        ssl: true,
        connectionLimit: 20
      },

      redis: {
        ...this.createDevelopmentConfig().redis,
        host: process.env.REDIS_HOST || 'staging-redis.terrafusion.internal',
        keyPrefix: 'tf:staging:',
        password: process.env.REDIS_PASSWORD
      },

      ai: {
        ...this.createDevelopmentConfig().ai,
        enabled: true,
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY
      },

      security: {
        ...this.createDevelopmentConfig().security,
        jwtSecret: process.env.JWT_SECRET || '',
        corsOrigins: ['https://staging.terrafusion.gov'],
        requireHttps: true
      },

      features: {
        ...this.createDevelopmentConfig().features,
        aiAssessment: true,
        realTimeSync: true,
        betaFeatures: false
      },

      monitoring: {
        ...this.createDevelopmentConfig().monitoring,
        logging: {
          level: 'info',
          format: 'json',
          destination: 'file',
          rotateFiles: true
        },
        grafana: {
          enabled: true,
          url: 'https://grafana-staging.terrafusion.internal'
        }
      },

      compliance: {
        fismaLevel: 'moderate',
        encryptionAtRest: true,
        encryptionInTransit: true,
        dataRetentionDays: 90,
        auditRetentionYears: 3,
        requireMultiFactorAuth: false
      }
    };
  }

  private createProductionConfig(): TerraFusionConfig {
    return {
      ...this.createStagingConfig(),
      environment: 'production',
      baseUrl: process.env.BASE_URL || 'https://terrafusion.gov',

      database: {
        host: process.env.DB_HOST || '',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || '',
        username: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || '',
        ssl: true,
        connectionLimit: 50,
        migrationPath: './dist/migrations'
      },

      redis: {
        host: process.env.REDIS_HOST || '',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || '',
        database: 0,
        keyPrefix: 'tf:prod:',
        ttl: 7200
      },

      ai: {
        provider: 'azure', // Government-approved AI service
        endpoint: process.env.AI_ENDPOINT || '',
        apiKey: process.env.AI_API_KEY || '',
        model: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.2,
        enabled: true
      },

      security: {
        jwtSecret: process.env.JWT_SECRET || '',
        jwtExpiresIn: '8h',
        bcryptRounds: 12,
        rateLimitWindowMs: 15 * 60 * 1000,
        rateLimitMaxRequests: 100,
        corsOrigins: [process.env.FRONTEND_URL || ''],
        enableAuditLogging: true,
        requireHttps: true
      },

      county: {
        countyId: process.env.COUNTY_ID || '',
        countyName: process.env.COUNTY_NAME || '',
        state: process.env.COUNTY_STATE || '',
        assessorOffice: process.env.ASSESSOR_OFFICE || '',
        contactEmail: process.env.CONTACT_EMAIL || '',
        timezone: process.env.TIMEZONE || 'America/Los_Angeles',
        taxYear: parseInt(process.env.TAX_YEAR || String(new Date().getFullYear())),
        legacySystems: {
          harris: {
            endpoint: process.env.HARRIS_ENDPOINT || '',
            apiKey: process.env.HARRIS_API_KEY || '',
            version: process.env.HARRIS_VERSION || '12.4.7'
          },
          tyler: {
            endpoint: process.env.TYLER_ENDPOINT || '',
            apiKey: process.env.TYLER_API_KEY || ''
          },
          aumentum: {
            endpoint: process.env.AUMENTUM_ENDPOINT || '',
            credentials: process.env.AUMENTUM_CREDENTIALS || ''
          }
        }
      },

      features: {
        aiAssessment: true,
        bulkImport: true,
        advancedAnalytics: true,
        realTimeSync: true,
        mobileApp: true,
        apiV2: true,
        betaFeatures: false,
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
      },

      monitoring: {
        prometheus: {
          enabled: true,
          port: 9090,
          path: '/metrics'
        },
        grafana: {
          enabled: true,
          url: process.env.GRAFANA_URL
        },
        logging: {
          level: 'warn',
          format: 'json',
          destination: 'database',
          rotateFiles: true
        },
        healthCheck: {
          interval: 60000,
          timeout: 10000,
          endpoints: [
            '/api/health',
            '/api/health/database',
            '/api/health/redis',
            '/api/health/ai'
          ]
        }
      },

      compliance: {
        fismaLevel: 'high',
        encryptionAtRest: true,
        encryptionInTransit: true,
        dataRetentionDays: 2555, // 7 years
        auditRetentionYears: 10,
        requireMultiFactorAuth: true
      }
    };
  }
}

// =============================================
// VALIDATION
// =============================================

export class ConfigValidator {
  public static validate(config: TerraFusionConfig): string[] {
    const errors: string[] = [];

    // Required fields validation
    if (!config.database.host) {
      errors.push('Database host is required');
    }
    if (!config.database.username) {
      errors.push('Database username is required');
    }
    if (!config.database.password) {
      errors.push('Database password is required');
    }

    // Production-specific validation
    if (config.environment === 'production') {
      if (config.security.jwtSecret === 'development-secret-change-in-production') {
        errors.push('Production JWT secret must be changed from default');
      }
      if (!config.security.requireHttps) {
        errors.push('HTTPS is required in production');
      }
      if (!config.compliance.encryptionAtRest) {
        errors.push('Encryption at rest is required in production');
      }
      if (!config.county.countyId) {
        errors.push('County ID is required in production');
      }
    }

    // AI service validation
    if (config.ai.enabled && !config.ai.apiKey && config.ai.provider !== 'local') {
      errors.push('AI API key is required when AI service is enabled');
    }

    // Security validation
    if (config.security.bcryptRounds < 10) {
      errors.push('BCrypt rounds must be at least 10');
    }

    return errors;
  }

  public static validateOrThrow(config: TerraFusionConfig): void {
    const errors = this.validate(config);
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }
}

// =============================================
// ENVIRONMENT SPECIFIC UTILITIES
// =============================================

export class EnvironmentUtils {
  public static loadFromFile(filePath: string): Partial<TerraFusionConfig> {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to load config from ${filePath}:`, error);
      return {};
    }
  }

  public static saveToFile(config: TerraFusionConfig, filePath: string): void {
    const fs = require('fs');
    const configCopy = { ...config };
    
    // Remove sensitive information from saved config
    configCopy.database.password = '[REDACTED]';
    configCopy.security.jwtSecret = '[REDACTED]';
    if (configCopy.ai.apiKey) configCopy.ai.apiKey = '[REDACTED]';
    
    fs.writeFileSync(filePath, JSON.stringify(configCopy, null, 2));
  }

  public static getRequiredEnvVars(environment: string): string[] {
    const baseVars = [
      'NODE_ENV',
      'PORT',
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD'
    ];

    if (environment === 'production') {
      return [
        ...baseVars,
        'JWT_SECRET',
        'COUNTY_ID',
        'COUNTY_NAME',
        'COUNTY_STATE',
        'FRONTEND_URL'
      ];
    }

    return baseVars;
  }

  public static checkRequiredEnvVars(environment: string): string[] {
    const required = this.getRequiredEnvVars(environment);
    const missing = required.filter(varName => !process.env[varName]);
    return missing;
  }
}

// =============================================
// COUNTY-SPECIFIC CONFIGURATIONS
// =============================================

export const CountyConfigs = {
  benton: {
    countyId: 'benton-wa',
    countyName: 'Benton County',
    state: 'WA',
    assessorOffice: 'Benton County Assessor',
    contactEmail: 'assessor@co.benton.wa.us',
    timezone: 'America/Los_Angeles',
    legacySystems: {
      harris: {
        endpoint: 'https://harris.co.benton.wa.us',
        version: '12.4.7'
      }
    }
  },
  
  franklin: {
    countyId: 'franklin-wa',
    countyName: 'Franklin County',
    state: 'WA',
    assessorOffice: 'Franklin County Assessor',
    contactEmail: 'assessor@co.franklin.wa.us',
    timezone: 'America/Los_Angeles'
  }
};

// =============================================
// USAGE EXAMPLES
// =============================================

/*
// Initialize configuration
const config = ConfigManager.getInstance();

// Get entire configuration
const fullConfig = config.getConfig();

// Get specific configuration sections
const dbConfig = config.get('database');
const securityConfig = config.get('security');

// Check feature flags
if (config.isFeatureEnabled('aiAssessment')) {
  console.log('AI Assessment is enabled');
}

// Environment checks
if (config.isProduction()) {
  console.log('Running in production mode');
}

// Validate configuration
try {
  ConfigValidator.validateOrThrow(fullConfig);
  console.log('Configuration is valid');
} catch (error) {
  console.error('Configuration validation failed:', error.message);
}

// Check for missing environment variables
const missing = EnvironmentUtils.checkRequiredEnvVars('production');
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

// Example .env file for development:
NODE_ENV=development
PORT=5000
HOST=localhost

DB_HOST=localhost
DB_PORT=5432
DB_NAME=terrafusion_dev
DB_USER=postgres
DB_PASSWORD=password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-development-secret-change-in-production

COUNTY_ID=benton-wa
COUNTY_NAME=Benton County
COUNTY_STATE=WA
ASSESSOR_OFFICE=Benton County Assessor
CONTACT_EMAIL=assessor@co.benton.wa.us

OPENAI_API_KEY=your-openai-api-key
*/

export { ConfigManager, ConfigValidator, EnvironmentUtils, CountyConfigs };
export type { TerraFusionConfig, DatabaseConfig, SecurityConfig, FeatureFlags };