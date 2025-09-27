// NO HARDCODED PORTS! Use environment variables.
/**
 * Configuration Manager for TerraAgent MCP Server
 * Handles all configuration loading and validation
 */

import * as dotenv from 'dotenv';
import { ServerConfig } from '../types/mcp-types.js';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: ServerConfig;

  private constructor() {
    // Load environment variables
    dotenv.config();
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): ServerConfig {
    return this.config;
  }

  private loadConfiguration(): ServerConfig {
    const environment = (process.env.NODE_ENV || 'development') as
      | 'development'
      | 'staging'
      | 'production';

    return {
      server: {
        name: process.env.SERVER_NAME || 'terra-agent-mcp-server',
        version: process.env.SERVER_VERSION || '1.0.0',
        environment,
      },
      database: {
        type: (process.env.DB_TYPE as 'postgresql' | 'sqlite') || 'sqlite',
        postgresql: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'terraagent',
          username: process.env.DB_USER || 'terraagent',
          password: process.env.DB_PASSWORD || '',
          ssl: process.env.DB_SSL === 'true',
          maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
        },
        sqlite: {
          filename: process.env.SQLITE_FILE || ':memory:',
        },
      },
      cache: {
        provider: (process.env.CACHE_PROVIDER as 'memory' | 'redis') || 'memory',
        redis: process.env.REDIS_PASSWORD
          ? {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
              password: process.env.REDIS_PASSWORD,
              database: parseInt(process.env.REDIS_DB || '0'),
              connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000'),
              commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '3000'),
            }
          : undefined,
        defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '300'),
        maxMemoryMB: parseInt(process.env.CACHE_MAX_MEMORY_MB || '100'),
      },
      logging: {
        level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
        format: (process.env.LOG_FORMAT as 'json' | 'pretty') || 'pretty',
        ...(process.env.LOG_FILE && { file: process.env.LOG_FILE }),
      },
      performance: {
        maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '100'),
        requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000'),
        cacheEnabled: process.env.CACHE_ENABLED !== 'false',
      },
      services: {
        terraAgentBackend: {
          baseUrl: process.env.TERRA_AGENT_BACKEND_URL || 'http://localhost:${TF_STATIC_PORT:-8080}',
          timeout: parseInt(process.env.TERRA_AGENT_BACKEND_TIMEOUT || '10000'),
          retries: parseInt(process.env.TERRA_AGENT_BACKEND_RETRIES || '3'),
          apiKey: process.env.TERRA_AGENT_BACKEND_API_KEY || '',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TerraAgent-MCP-Server/1.0.0',
          },
        },
        propertyData: {
          baseUrl: process.env.PROPERTY_DATA_URL || 'http://localhost:${TF_STATIC_PORT:-8080}',
          timeout: parseInt(process.env.PROPERTY_DATA_TIMEOUT || '10000'),
          retries: parseInt(process.env.PROPERTY_DATA_RETRIES || '3'),
          apiKey: process.env.PROPERTY_DATA_API_KEY || '',
        },
        assessmentAPI: {
          baseUrl: process.env.ASSESSMENT_API_URL || 'http://localhost:${TF_STATIC_PORT:-8080}',
          timeout: parseInt(process.env.ASSESSMENT_API_TIMEOUT || '10000'),
          retries: parseInt(process.env.ASSESSMENT_API_RETRIES || '3'),
          apiKey: process.env.ASSESSMENT_API_API_KEY || '',
        },
      },
    };
  }

  /**
   * Validate configuration
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate server config
    if (!this.config.server.name) {
      errors.push('Server name is required');
    }

    // Validate database config
    if (this.config.database.type === 'postgresql') {
      if (!this.config.database.postgresql?.host) {
        errors.push('PostgreSQL host is required');
      }
      if (!this.config.database.postgresql?.database) {
        errors.push('PostgreSQL database name is required');
      }
    }

    // Validate cache config
    if (this.config.cache.provider === 'redis') {
      if (!this.config.cache.redis?.host) {
        errors.push('Redis host is required when using Redis cache');
      }
    }

    // Validate service URLs
    for (const [serviceName, serviceConfig] of Object.entries(this.config.services)) {
      if (!serviceConfig.baseUrl) {
        errors.push(`${serviceName} base URL is required`);
      }

      try {
        new URL(serviceConfig.baseUrl);
      } catch {
        errors.push(`${serviceName} base URL is invalid`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get environment-specific configuration
   */
  public getEnvironmentConfig(): Record<string, any> {
    switch (this.config.server.environment) {
      case 'development':
        return {
          verbose: true,
          debugging: true,
          metrics: false,
        };
      case 'staging':
        return {
          verbose: false,
          debugging: true,
          metrics: true,
        };
      case 'production':
        return {
          verbose: false,
          debugging: false,
          metrics: true,
        };
      default:
        return {};
    }
  }
}
