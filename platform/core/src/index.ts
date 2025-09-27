/**
 * TerraFusion cOS Platform Core
 *
 * Core platform services providing identity, policy, and orchestration
 * infrastructure for the County Operating System substrate.
 */

import express from 'express';
import helmet from 'helmet';
import { createLogger } from './services/logging';
import { IdentityService } from './services/identity';
import { PolicyService } from './services/policy';
import { OrchestrationService } from './services/orchestration';
import { RuntimeService } from './services/runtime';
import { HealthService } from './services/health';
import { MetricsService } from './services/metrics';
import { ConfigurationService } from './services/configuration';

const logger = createLogger('platform-core');

class PlatformCore {
  private app: express.Application;
  private services: Map<string, any> = new Map();

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.initializeServices();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false // Allow cross-origin for vendor integration
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      next();
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      logger.info('Initializing Platform Core Services...');

      // Configuration service must be first
      const configService = new ConfigurationService();
      await configService.initialize();
      this.services.set('configuration', configService);

      // Metrics service for observability
      const metricsService = new MetricsService();
      await metricsService.initialize();
      this.services.set('metrics', metricsService);

      // Identity service for authentication/authorization
      const identityService = new IdentityService(configService);
      await identityService.initialize();
      this.services.set('identity', identityService);

      // Policy service for RBAC/ABAC enforcement
      const policyService = new PolicyService(configService);
      await policyService.initialize();
      this.services.set('policy', policyService);

      // Runtime service for container orchestration
      const runtimeService = new RuntimeService(configService);
      await runtimeService.initialize();
      this.services.set('runtime', runtimeService);

      // Orchestration service for service coordination
      const orchestrationService = new OrchestrationService(
        configService,
        identityService,
        policyService,
        runtimeService
      );
      await orchestrationService.initialize();
      this.services.set('orchestration', orchestrationService);

      // Health service for system monitoring
      const healthService = new HealthService(this.services);
      await healthService.initialize();
      this.services.set('health', healthService);

      logger.info('All Platform Core Services initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Platform Core Services', { error });
      throw error;
    }
  }

  private setupRoutes(): void {
    // Health check endpoints
    this.app.get('/health', (req, res) => {
      const healthService = this.services.get('health') as HealthService;
      const status = healthService.getHealthStatus();
      res.status(status.healthy ? 200 : 503).json(status);
    });

    this.app.get('/health/ready', (req, res) => {
      const healthService = this.services.get('health') as HealthService;
      const status = healthService.getReadinessStatus();
      res.status(status.ready ? 200 : 503).json(status);
    });

    this.app.get('/health/live', (req, res) => {
      const healthService = this.services.get('health') as HealthService;
      const status = healthService.getLivenessStatus();
      res.status(status.alive ? 200 : 503).json(status);
    });

    // Metrics endpoint for Prometheus
    this.app.get('/metrics', async (req, res) => {
      const metricsService = this.services.get('metrics') as MetricsService;
      const metrics = await metricsService.getMetrics();
      res.set('Content-Type', 'text/plain').send(metrics);
    });

    // Identity service endpoints
    this.app.use('/api/v1/identity', this.createServiceRouter('identity'));

    // Policy service endpoints
    this.app.use('/api/v1/policy', this.createServiceRouter('policy'));

    // Orchestration service endpoints
    this.app.use('/api/v1/orchestration', this.createServiceRouter('orchestration'));

    // Runtime service endpoints
    this.app.use('/api/v1/runtime', this.createServiceRouter('runtime'));

    // Platform information endpoint
    this.app.get('/api/v1/platform/info', (req, res) => {
      res.json({
        name: 'TerraFusion cOS Platform Core',
        version: process.env.npm_package_version || '1.0.0',
        description: 'County Operating System Platform Substrate',
        architecture: 'vendor-substrate-platform',
        services: Array.from(this.services.keys()),
        features: [
          'zero-rewrite-vendor-integration',
          'government-grade-security',
          'ai-agent-orchestration',
          'compliance-by-default'
        ],
        status: 'operational'
      });
    });

    // Vendor integration endpoints
    this.app.use('/api/v1/vendor', this.createVendorIntegrationRouter());

    // Error handling middleware
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { error: error.message, stack: error.stack });
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not found',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`
      });
    });
  }

  private createServiceRouter(serviceName: string): express.Router {
    const router = express.Router();
    const service = this.services.get(serviceName);

    if (!service || !service.getRoutes) {
      logger.warn(`Service ${serviceName} has no routes or doesn't exist`);
      return router;
    }

    const routes = service.getRoutes();
    routes.forEach((route: any) => {
      router[route.method](route.path, route.handler);
    });

    return router;
  }

  private createVendorIntegrationRouter(): express.Router {
    const router = express.Router();

    // Vendor registration endpoint
    router.post('/register', async (req, res) => {
      try {
        const orchestrationService = this.services.get('orchestration') as OrchestrationService;
        const result = await orchestrationService.registerVendor(req.body);
        res.json(result);
      } catch (error) {
        logger.error('Vendor registration failed', { error });
        res.status(400).json({ error: 'Vendor registration failed' });
      }
    });

    // Vendor status endpoint
    router.get('/:vendorId/status', async (req, res) => {
      try {
        const orchestrationService = this.services.get('orchestration') as OrchestrationService;
        const status = await orchestrationService.getVendorStatus(req.params.vendorId);
        res.json(status);
      } catch (error) {
        logger.error('Vendor status check failed', { error });
        res.status(404).json({ error: 'Vendor not found' });
      }
    });

    // Vendor configuration endpoint
    router.put('/:vendorId/config', async (req, res) => {
      try {
        const orchestrationService = this.services.get('orchestration') as OrchestrationService;
        const result = await orchestrationService.updateVendorConfig(req.params.vendorId, req.body);
        res.json(result);
      } catch (error) {
        logger.error('Vendor configuration update failed', { error });
        res.status(400).json({ error: 'Configuration update failed' });
      }
    });

    return router;
  }

  public async start(port: number = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, () => {
        logger.info(`TerraFusion cOS Platform Core started on port ${port}`);
        resolve();
      });

      server.on('error', (error) => {
        logger.error('Failed to start Platform Core', { error });
        reject(error);
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => {
        logger.info('Received SIGTERM, shutting down gracefully...');
        server.close(() => {
          logger.info('Platform Core shutdown complete');
          process.exit(0);
        });
      });
    });
  }

  public getService<T>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T;
  }

  public getAllServices(): Map<string, any> {
    return new Map(this.services);
  }
}

// Export the main class and start the server if this is the main module
export { PlatformCore };

if (require.main === module) {
  const platformCore = new PlatformCore();
  const port = parseInt(process.env.PORT || '3000', 10);

  platformCore.start(port).catch((error) => {
    logger.error('Failed to start Platform Core', { error });
    process.exit(1);
  });
}