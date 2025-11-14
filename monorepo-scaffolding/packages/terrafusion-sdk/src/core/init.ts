import { TerraFusionClient } from '../client';
import { TerraFusionConfig, validateConfig } from '../types';

/**
 * Initialize TerraFusion SDK client with government-grade configuration
 *
 * @param config - TerraFusion configuration object
 * @returns Configured TerraFusion client instance
 *
 * @example
 * ```typescript
 * const client = initTerraFusion({
 *   apiUrl: 'https://api.terrafusionmarket.com',
 *   countyId: 'benton',
 *   environment: 'production',
 *   fismaMode: true,
 *   auth: {
 *     type: 'jwt',
 *     token: 'your-jwt-token'
 *   }
 * });
 *
 * // Use county-isolated services
 * const properties = await client.county.getProperties();
 *
 * // Coordinate with AI swarm
 * const analysis = await client.ai.analyzeProperty(propertyId);
 * ```
 */
export function initTerraFusion(config: TerraFusionConfig): TerraFusionClient {
  // Validate configuration for government compliance
  validateConfig(config);

  // Create and return client instance
  return new TerraFusionClient(config);
}

/**
 * Quick setup for development environment
 *
 * @param countyId - County identifier for data isolation
 * @param options - Optional configuration overrides
 * @returns Configured development client
 */
export function initTerraFusionDev(
  countyId: string,
  options: Partial<TerraFusionConfig> = {}
): TerraFusionClient {
  const devConfig: TerraFusionConfig = {
    apiUrl: 'http://localhost:5000',
    countyId,
    environment: 'development',
    fismaMode: false,
    debug: true,
    ...options,
  };

  return initTerraFusion(devConfig);
}

/**
 * Production setup with enhanced security
 *
 * @param countyId - County identifier for data isolation
 * @param apiUrl - Production API endpoint
 * @param authToken - JWT authentication token
 * @returns Configured production client
 */
export function initTerraFusionProd(
  countyId: string,
  apiUrl: string,
  authToken: string
): TerraFusionClient {
  const prodConfig: TerraFusionConfig = {
    apiUrl,
    countyId,
    environment: 'production',
    fismaMode: true,
    debug: false,
    auth: {
      type: 'jwt',
      token: authToken,
    },
    security: {
      encryptionEnabled: true,
      auditLogging: true,
      mfaRequired: true,
    },
    performance: {
      timeout: 30000,
      retryAttempts: 3,
      cacheEnabled: true,
    },
  };

  return initTerraFusion(prodConfig);
}
