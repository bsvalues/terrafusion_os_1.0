/**
 * Central Application Configuration
 * 
 * This module contains all server-side configuration settings for the application.
 * It manages feature flags, authentication settings, and other global configuration.
 */

// Import environment variables
import dotenv from 'dotenv';
dotenv.config();

/**
 * Application Configuration Interface
 */
export interface AppConfig {
  // Server settings
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
  
  // Authentication settings
  auth: {
    enabled: boolean;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    bypassInDev: boolean;
    sessionSecret: string;
  };
  
  // Database settings
  database: {
    url: string;
    useSsl: boolean;
    maxConnections: number;
    seedData: boolean;
  };
  
  // Feature flags - control which features are enabled
  features: {
    aiAgents: boolean;
    predictiveAnalytics: boolean;
    advancedReporting: boolean;
    dataExport: boolean;
    collaboration: boolean;
    externalDataIntegration: boolean;
    developerApi: boolean;
    enterpriseIntegration: boolean;
  };
  
  // External service configuration
  externalServices: {
    aiApiKey?: string;
    mapApiKey?: string;
    emailEnabled: boolean;
    emailSender?: string;
    smsEnabled: boolean;
  };
}

// Initialize configuration
const config: AppConfig = {
  // Server settings
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
  isDev: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // Authentication settings
  auth: {
    enabled: process.env.DISABLE_AUTH !== 'true',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    bypassInDev: process.env.BYPASS_AUTH_IN_DEV === 'true' || true, // Default to bypassing auth in dev
    sessionSecret: process.env.SESSION_SECRET || 'development-session-secret',
  },
  
  // Database settings
  database: {
    url: process.env.DATABASE_URL || '',
    useSsl: process.env.DB_USE_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    seedData: process.env.SEED_DATA !== 'false',
  },
  
  // Feature flags
  features: {
    aiAgents: process.env.FEATURE_AI_AGENTS !== 'false',
    predictiveAnalytics: process.env.FEATURE_PREDICTIVE_ANALYTICS !== 'false',
    advancedReporting: process.env.FEATURE_ADVANCED_REPORTING !== 'false',
    dataExport: process.env.FEATURE_DATA_EXPORT !== 'false',
    collaboration: process.env.FEATURE_COLLABORATION === 'true',
    externalDataIntegration: process.env.FEATURE_EXTERNAL_DATA_INTEGRATION === 'true',
    developerApi: process.env.FEATURE_DEVELOPER_API === 'true',
    enterpriseIntegration: process.env.FEATURE_ENTERPRISE_INTEGRATION === 'true',
  },
  
  // External service configuration
  externalServices: {
    aiApiKey: process.env.AI_API_KEY,
    mapApiKey: process.env.MAP_API_KEY,
    emailEnabled: process.env.EMAIL_ENABLED === 'true',
    emailSender: process.env.EMAIL_SENDER,
    smsEnabled: process.env.SMS_ENABLED === 'true',
  },
};

// Override certain settings in development mode
if (config.isDev) {
  // Log that we're in development mode and auth is bypassed if that's the case
  if (config.auth.bypassInDev) {
    console.log('⚠️ DEVELOPMENT MODE: Authentication disabled. All users auto-authenticated.');
  }
  
  // Enable all core features in development regardless of environment variables
  config.features.aiAgents = true;
  config.features.predictiveAnalytics = true;
  config.features.advancedReporting = true;
  config.features.dataExport = true;
}

export default config;