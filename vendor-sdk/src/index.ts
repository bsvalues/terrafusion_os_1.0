/**
 * TerraFusion cOS Vendor SDK
 *
 * Zero-rewrite integration SDK that enables legacy vendor applications
 * to seamlessly integrate with the TerraFusion County Operating System.
 *
 * @example
 * ```typescript
 * import { VendorSDK } from '@terrafusion/vendor-sdk';
 *
 * const sdk = new VendorSDK({
 *   vendorId: 'acme-gis',
 *   platformEndpoint: 'https://platform.terrafusion.local',
 *   apiKey: 'your-api-key'
 * });
 *
 * await sdk.initialize();
 * ```
 */

export * from './sidecar';
export * from './auth';
export * from './events';
export * from './data';
export * from './ui';
export * from './testing';

import { SidecarClient } from './sidecar';
import { AuthenticationClient } from './auth';
import { EventBusClient } from './events';
import { DataPlaneClient } from './data';
import { UIIntegrationClient } from './ui';
import { createLogger, Logger } from './utils/logger';

export interface VendorSDKConfig {
  vendorId: string;
  vendorName?: string;
  platformEndpoint: string;
  apiKey: string;
  version?: string;
  environment?: 'development' | 'staging' | 'production';
  features?: {
    sidecar?: boolean;
    authentication?: boolean;
    events?: boolean;
    dataPlane?: boolean;
    uiIntegration?: boolean;
  };
  sidecar?: {
    enabled: boolean;
    port?: number;
    healthCheckPath?: string;
    metricsPath?: string;
  };
  authentication?: {
    tokenValidationUrl?: string;
    userInfoUrl?: string;
    logoutUrl?: string;
  };
  events?: {
    brokerUrl?: string;
    topics?: string[];
    consumerGroup?: string;
  };
  dataPlane?: {
    apiUrl?: string;
    schemaRegistry?: string;
    enableCaching?: boolean;
  };
  uiIntegration?: {
    shellUrl?: string;
    enableMicroFrontend?: boolean;
    themeUrl?: string;
  };
}

export class VendorSDK {
  private config: VendorSDKConfig;
  private logger: Logger;
  private initialized = false;

  // Client instances
  public readonly sidecar?: SidecarClient;
  public readonly auth?: AuthenticationClient;
  public readonly events?: EventBusClient;
  public readonly data?: DataPlaneClient;
  public readonly ui?: UIIntegrationClient;

  constructor(config: VendorSDKConfig) {
    this.config = {
      version: '1.0.0',
      environment: 'production',
      features: {
        sidecar: true,
        authentication: true,
        events: true,
        dataPlane: true,
        uiIntegration: true,
        ...config.features
      },
      ...config
    };

    this.logger = createLogger(`vendor-sdk:${this.config.vendorId}`);

    // Initialize clients based on enabled features
    if (this.config.features?.sidecar) {
      this.sidecar = new SidecarClient({
        vendorId: this.config.vendorId,
        platformEndpoint: this.config.platformEndpoint,
        apiKey: this.config.apiKey,
        ...this.config.sidecar
      });
    }

    if (this.config.features?.authentication) {
      this.auth = new AuthenticationClient({
        vendorId: this.config.vendorId,
        platformEndpoint: this.config.platformEndpoint,
        apiKey: this.config.apiKey,
        ...this.config.authentication
      });
    }

    if (this.config.features?.events) {
      this.events = new EventBusClient({
        vendorId: this.config.vendorId,
        platformEndpoint: this.config.platformEndpoint,
        apiKey: this.config.apiKey,
        ...this.config.events
      });
    }

    if (this.config.features?.dataPlane) {
      this.data = new DataPlaneClient({
        vendorId: this.config.vendorId,
        platformEndpoint: this.config.platformEndpoint,
        apiKey: this.config.apiKey,
        ...this.config.dataPlane
      });
    }

    if (this.config.features?.uiIntegration) {
      this.ui = new UIIntegrationClient({
        vendorId: this.config.vendorId,
        platformEndpoint: this.config.platformEndpoint,
        apiKey: this.config.apiKey,
        ...this.config.uiIntegration
      });
    }
  }

  /**
   * Initialize the Vendor SDK and all enabled clients
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('SDK already initialized');
      return;
    }

    try {
      this.logger.info('Initializing TerraFusion Vendor SDK', {
        vendorId: this.config.vendorId,
        version: this.config.version,
        environment: this.config.environment,
        features: Object.keys(this.config.features || {}).filter(
          key => this.config.features?.[key as keyof typeof this.config.features]
        )
      });

      // Initialize clients in dependency order
      const initPromises: Promise<void>[] = [];

      if (this.sidecar) {
        initPromises.push(this.sidecar.initialize());
      }

      if (this.auth) {
        initPromises.push(this.auth.initialize());
      }

      if (this.data) {
        initPromises.push(this.data.initialize());
      }

      if (this.events) {
        initPromises.push(this.events.initialize());
      }

      if (this.ui) {
        initPromises.push(this.ui.initialize());
      }

      await Promise.all(initPromises);

      this.initialized = true;
      this.logger.info('TerraFusion Vendor SDK initialized successfully');

      // Register with platform
      await this.registerWithPlatform();

    } catch (error) {
      this.logger.error('Failed to initialize Vendor SDK', { error });
      throw error;
    }
  }

  /**
   * Shutdown the SDK and cleanup resources
   */
  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      this.logger.info('Shutting down TerraFusion Vendor SDK');

      const shutdownPromises: Promise<void>[] = [];

      if (this.ui) {
        shutdownPromises.push(this.ui.shutdown());
      }

      if (this.events) {
        shutdownPromises.push(this.events.shutdown());
      }

      if (this.data) {
        shutdownPromises.push(this.data.shutdown());
      }

      if (this.auth) {
        shutdownPromises.push(this.auth.shutdown());
      }

      if (this.sidecar) {
        shutdownPromises.push(this.sidecar.shutdown());
      }

      await Promise.all(shutdownPromises);

      this.initialized = false;
      this.logger.info('TerraFusion Vendor SDK shutdown complete');

    } catch (error) {
      this.logger.error('Error during SDK shutdown', { error });
      throw error;
    }
  }

  /**
   * Check if the SDK is properly initialized and connected to the platform
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    components: Record<string, { healthy: boolean; message?: string }>;
    version: string;
    uptime: number;
  }> {
    const startTime = process.hrtime();
    const components: Record<string, { healthy: boolean; message?: string }> = {};

    // Check sidecar health
    if (this.sidecar) {
      try {
        const sidecarHealth = await this.sidecar.healthCheck();
        components.sidecar = {
          healthy: sidecarHealth.healthy,
          message: sidecarHealth.message
        };
      } catch (error) {
        components.sidecar = {
          healthy: false,
          message: `Sidecar health check failed: ${error}`
        };
      }
    }

    // Check authentication client health
    if (this.auth) {
      try {
        const authHealth = await this.auth.healthCheck();
        components.authentication = {
          healthy: authHealth.healthy,
          message: authHealth.message
        };
      } catch (error) {
        components.authentication = {
          healthy: false,
          message: `Authentication health check failed: ${error}`
        };
      }
    }

    // Check event bus health
    if (this.events) {
      try {
        const eventsHealth = await this.events.healthCheck();
        components.events = {
          healthy: eventsHealth.connected,
          message: eventsHealth.message
        };
      } catch (error) {
        components.events = {
          healthy: false,
          message: `Events health check failed: ${error}`
        };
      }
    }

    // Check data plane health
    if (this.data) {
      try {
        const dataHealth = await this.data.healthCheck();
        components.dataPlane = {
          healthy: dataHealth.healthy,
          message: dataHealth.message
        };
      } catch (error) {
        components.dataPlane = {
          healthy: false,
          message: `Data plane health check failed: ${error}`
        };
      }
    }

    // Check UI integration health
    if (this.ui) {
      try {
        const uiHealth = await this.ui.healthCheck();
        components.uiIntegration = {
          healthy: uiHealth.healthy,
          message: uiHealth.message
        };
      } catch (error) {
        components.uiIntegration = {
          healthy: false,
          message: `UI integration health check failed: ${error}`
        };
      }
    }

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const healthCheckDuration = seconds * 1000 + nanoseconds / 1000000;

    const overallHealthy = Object.values(components).every(component => component.healthy);

    return {
      healthy: this.initialized && overallHealthy,
      components,
      version: this.config.version || '1.0.0',
      uptime: healthCheckDuration
    };
  }

  /**
   * Get SDK configuration (sanitized)
   */
  public getConfig(): Omit<VendorSDKConfig, 'apiKey'> {
    const { apiKey, ...sanitizedConfig } = this.config;
    return sanitizedConfig;
  }

  /**
   * Register vendor application with the TerraFusion platform
   */
  private async registerWithPlatform(): Promise<void> {
    try {
      // TODO: Implement platform registration API call
      this.logger.info('Registering with TerraFusion platform', {
        vendorId: this.config.vendorId,
        vendorName: this.config.vendorName
      });

      // Registration would include:
      // - Vendor metadata (name, version, capabilities)
      // - Health check endpoints
      // - API schema/documentation
      // - Security certificates
      // - Integration configuration

    } catch (error) {
      this.logger.warn('Platform registration failed', { error });
      // Don't throw - registration failure shouldn't prevent SDK operation
    }
  }

  /**
   * Create a new instance of the Vendor SDK with different configuration
   */
  public static create(config: VendorSDKConfig): VendorSDK {
    return new VendorSDK(config);
  }

  /**
   * Get SDK version information
   */
  public static getVersion(): string {
    return '1.0.0'; // TODO: Read from package.json
  }

  /**
   * Validate SDK configuration
   */
  public static validateConfig(config: Partial<VendorSDKConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.vendorId) {
      errors.push('vendorId is required');
    }

    if (!config.platformEndpoint) {
      errors.push('platformEndpoint is required');
    }

    if (!config.apiKey) {
      errors.push('apiKey is required');
    }

    if (config.platformEndpoint && !config.platformEndpoint.startsWith('http')) {
      errors.push('platformEndpoint must be a valid URL');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}