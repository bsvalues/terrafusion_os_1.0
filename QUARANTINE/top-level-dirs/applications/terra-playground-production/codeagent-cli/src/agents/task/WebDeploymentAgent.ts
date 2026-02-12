/**
 * WebDeploymentAgent.ts
 *
 * Agent specializing in web deployment and cloud operations
 */

import {
  BaseAgent,
  AgentCapability,
  AgentType,
  AgentStatus,
  AgentPriority,
  AgentTask,
  StateManager,
  LogService,
  LogLevel,
} from '../core';

/**
 * Cloud provider configuration
 */
export interface CloudProviderConfig {
  type: 'aws' | 'gcp' | 'azure' | 'heroku' | 'vercel' | 'netlify' | 'digitalocean' | 'custom';
  name: string;
  region?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    token?: string;
    clientId?: string;
    clientSecret?: string;
    subscriptionId?: string;
    tenantId?: string;
  };
  options?: Record<string, any>;
}

/**
 * Web deployment configuration
 */
export interface WebDeploymentConfig {
  name: string;
  provider: CloudProviderConfig;
  type: 'static' | 'serverless' | 'container' | 'vm' | 'kubernetes';
  source: {
    type: 'directory' | 'git' | 'container-image';
    path?: string;
    repository?: string;
    branch?: string;
    image?: string;
    tag?: string;
  };
  build?: {
    command?: string;
    output?: string;
    env?: Record<string, string>;
  };
  runtime?: {
    name?: string;
    version?: string;
    command?: string;
    env?: Record<string, string>;
  };
  network?: {
    domain?: string;
    subdomain?: string;
    ssl?: boolean;
    routes?: {
      path: string;
      handler?: string;
      rewrite?: string;
      redirect?: string;
    }[];
  };
  resources?: {
    cpu?: string;
    memory?: string;
    instances?: number;
    autoscaling?: {
      min: number;
      max: number;
      metric: string;
      target: number;
    };
  };
}

/**
 * Deployment resource
 */
export interface DeploymentResource {
  id: string;
  type: string;
  name: string;
  region: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  properties?: Record<string, any>;
}

/**
 * Deployment status
 */
export interface WebDeploymentStatus {
  id: string;
  name: string;
  url?: string;
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'deleted';
  startTime: Date;
  endTime?: Date;
  resources: DeploymentResource[];
  logs?: string[];
  error?: string;
  version?: string;
  metrics?: {
    uptime?: number;
    latency?: number;
    requests?: number;
    errors?: number;
    cpu?: number;
    memory?: number;
  };
}

/**
 * Task types for Web Deployment Agent
 */
export enum WebDeploymentTaskType {
  CONFIGURE_PROVIDER = 'configure_provider',
  DEPLOY_APPLICATION = 'deploy_application',
  UPDATE_DEPLOYMENT = 'update_deployment',
  MONITOR_DEPLOYMENT = 'monitor_deployment',
  CONFIGURE_DNS = 'configure_dns',
  CONFIGURE_SSL = 'configure_ssl',
  SCALE_DEPLOYMENT = 'scale_deployment',
}

/**
 * WebDeploymentAgent class
 */
export class WebDeploymentAgent extends BaseAgent {
  private stateManager: StateManager;
  private providers: Map<string, CloudProviderConfig>;
  private deployments: Map<string, WebDeploymentConfig>;
  private deploymentStatus: Map<string, WebDeploymentStatus>;

  /**
   * Constructor
   * @param name Agent name
   */
  constructor(name: string = 'WebDeploymentAgent') {
    super(
      name,
      AgentType.TASK_SPECIFIC,
      [
        AgentCapability.WEB_DEPLOYMENT,
        AgentCapability.CLOUD_INTEGRATION,
        AgentCapability.DNS_MANAGEMENT,
        AgentCapability.SSL_CONFIGURATION,
      ],
      AgentPriority.NORMAL
    );

    this.stateManager = StateManager.getInstance();
    this.logger = new LogService(name, LogLevel.DEBUG);
    this.providers = new Map<string, CloudProviderConfig>();
    this.deployments = new Map<string, WebDeploymentConfig>();
    this.deploymentStatus = new Map<string, WebDeploymentStatus>();
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<boolean> {
    this.logger.info('Initializing Web Deployment Agent');

    try {
      // Load previous state if available
      const savedState = await this.stateManager.loadAgentState(this.id);
      if (savedState) {
        this.logger.debug('Restored previous state');

        // Restore providers if available
        if (savedState.providers) {
          this.providers = new Map(Object.entries(savedState.providers));
        }

        // Restore deployments if available
        if (savedState.deployments) {
          this.deployments = new Map(Object.entries(savedState.deployments));
        }

        // Restore deployment status if available
        if (savedState.deploymentStatus) {
          this.deploymentStatus = new Map(Object.entries(savedState.deploymentStatus));
        }
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Initialization error: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Execute a task
   * @param task Task to execute
   * @param context Task context
   */
  public async executeTask(task: AgentTask, context?: any): Promise<any> {
    this.logger.info(`Executing task: ${task.type}`);

    // Execute task based on type
    switch (task.type) {
      case WebDeploymentTaskType.CONFIGURE_PROVIDER:
        return await this.configureProvider(task.payload.config);

      case WebDeploymentTaskType.DEPLOY_APPLICATION:
        return await this.deployApplication(task.payload.config);

      case WebDeploymentTaskType.UPDATE_DEPLOYMENT:
        return await this.updateDeployment(
          task.payload.deploymentId,
          task.payload.updates,
          task.payload.options
        );

      case WebDeploymentTaskType.MONITOR_DEPLOYMENT:
        return await this.monitorDeployment(task.payload.deploymentId, task.payload.options);

      case WebDeploymentTaskType.CONFIGURE_DNS:
        return await this.configureDns(
          task.payload.deploymentId,
          task.payload.dnsConfig,
          task.payload.options
        );

      case WebDeploymentTaskType.CONFIGURE_SSL:
        return await this.configureSsl(
          task.payload.deploymentId,
          task.payload.sslConfig,
          task.payload.options
        );

      case WebDeploymentTaskType.SCALE_DEPLOYMENT:
        return await this.scaleDeployment(
          task.payload.deploymentId,
          task.payload.scalingConfig,
          task.payload.options
        );

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Configure a cloud provider
   * @param config Provider configuration
   */
  private async configureProvider(config: CloudProviderConfig): Promise<any> {
    this.logger.info(`Configuring cloud provider: ${config.name} (${config.type})`);

    // This would configure the actual cloud provider
    // For now, it's a placeholder

    // Check if the provider already exists
    if (this.providers.has(config.name)) {
      // Update existing provider
      this.providers.set(config.name, {
        ...this.providers.get(config.name)!,
        ...config,
      });
    } else {
      // Add new provider
      this.providers.set(config.name, config);
    }

    // Save state
    await this.stateManager.saveAgentState(this.id, {
      providers: Object.fromEntries(this.providers),
      deployments: Object.fromEntries(this.deployments),
      deploymentStatus: Object.fromEntries(this.deploymentStatus),
    });

    // Example configuration result
    const result = {
      provider: config.name,
      type: config.type,
      region: config.region,
      configured: true,
      services: getServicesForProvider(config.type),
      features: getFeaturesForProvider(config.type),
    };

    return result;
  }

  /**
   * Deploy an application
   * @param config Deployment configuration
   */
  private async deployApplication(config: WebDeploymentConfig): Promise<any> {
    this.logger.info(`Deploying application: ${config.name}`);

    // Check if provider exists
    if (!this.providers.has(config.provider.name)) {
      throw new Error(`Provider not found: ${config.provider.name}`);
    }

    // This would deploy the actual application
    // For now, it's a placeholder

    // Generate a deployment ID
    const deploymentId = `deployment-${Date.now().toString(16)}-${Math.floor(Math.random() * 10000).toString(16)}`;

    // Store deployment config
    this.deployments.set(deploymentId, config);

    // Create initial deployment status
    const status: WebDeploymentStatus = {
      id: deploymentId,
      name: config.name,
      status: 'deploying',
      startTime: new Date(),
      resources: [],
      logs: [
        `[${new Date().toISOString()}] Starting deployment of ${config.name}`,
        `[${new Date().toISOString()}] Preparing resources...`,
      ],
    };

    // Store deployment status
    this.deploymentStatus.set(deploymentId, status);

    // Save state
    await this.stateManager.saveAgentState(this.id, {
      providers: Object.fromEntries(this.providers),
      deployments: Object.fromEntries(this.deployments),
      deploymentStatus: Object.fromEntries(this.deploymentStatus),
    });

    // Simulate async deployment process
    // In a real implementation, this would be handled differently
    setTimeout(() => {
      this.simulateDeploymentCompletion(deploymentId, config);
    }, 100);

    // Example deployment initiation result
    const result = {
      deploymentId,
      name: config.name,
      provider: config.provider.name,
      status: 'deploying',
      startTime: status.startTime,
      estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      logs: status.logs,
    };

    return result;
  }

  /**
   * Update a deployment
   * @param deploymentId Deployment ID
   * @param updates Updates to apply
   * @param options Update options
   */
  private async updateDeployment(
    deploymentId: string,
    updates: Partial<WebDeploymentConfig>,
    options?: any
  ): Promise<any> {
    this.logger.info(`Updating deployment: ${deploymentId}`);

    // Check if deployment exists
    if (!this.deployments.has(deploymentId)) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    // Check if deployment is in a state that can be updated
    const status = this.deploymentStatus.get(deploymentId);
    if (status?.status === 'deploying') {
      throw new Error(`Cannot update deployment while it is in "${status.status}" state`);
    }

    // Get current config
    const currentConfig = this.deployments.get(deploymentId)!;

    // This would update the actual deployment
    // For now, it's a placeholder

    // Apply updates
    const updatedConfig: WebDeploymentConfig = {
      ...currentConfig,
      ...updates,
      provider: {
        ...currentConfig.provider,
        ...(updates.provider || {}),
      },
      source: {
        ...currentConfig.source,
        ...(updates.source || {}),
      },
      build: {
        ...currentConfig.build,
        ...(updates.build || {}),
      },
      runtime: {
        ...currentConfig.runtime,
        ...(updates.runtime || {}),
      },
      network: {
        ...currentConfig.network,
        ...(updates.network || {}),
      },
      resources: {
        ...currentConfig.resources,
        ...(updates.resources || {}),
      },
    };

    // Update config
    this.deployments.set(deploymentId, updatedConfig);

    // Update status to reflect the update
    if (status) {
      status.status = 'deploying';
      status.startTime = new Date();
      status.endTime = undefined;
      status.logs = status.logs || [];
      status.logs.push(`[${new Date().toISOString()}] Updating deployment ${updatedConfig.name}`);

      this.deploymentStatus.set(deploymentId, status);
    }

    // Save state
    await this.stateManager.saveAgentState(this.id, {
      providers: Object.fromEntries(this.providers),
      deployments: Object.fromEntries(this.deployments),
      deploymentStatus: Object.fromEntries(this.deploymentStatus),
    });

    // Simulate async update process
    // In a real implementation, this would be handled differently
    setTimeout(() => {
      this.simulateDeploymentCompletion(deploymentId, updatedConfig);
    }, 100);

    // Example update result
    const result = {
      deploymentId,
      name: updatedConfig.name,
      status: 'deploying',
      updates: Object.keys(updates).filter(key => key !== 'provider'),
      startTime: status?.startTime,
      estimatedCompletionTime: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes from now
      logs: status?.logs?.slice(-5),
    };

    return result;
  }

  /**
   * Monitor a deployment
   * @param deploymentId Deployment ID
   * @param options Monitoring options
   */
  private async monitorDeployment(deploymentId: string, options?: any): Promise<any> {
    this.logger.info(`Monitoring deployment: ${deploymentId}`);

    // Check if deployment exists
    if (!this.deployments.has(deploymentId)) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    // Get deployment status
    const status = this.deploymentStatus.get(deploymentId);
    if (!status) {
      throw new Error(`Deployment status not found: ${deploymentId}`);
    }

    // This would monitor the actual deployment
    // For now, it's a placeholder

    // Generate mock metrics if none exist
    if (!status.metrics) {
      status.metrics = {
        uptime: Math.floor(Math.random() * 1000 * 60 * 60 * 24), // Random uptime up to 1 day in ms
        latency: Math.floor(Math.random() * 500), // Random latency up to 500ms
        requests: Math.floor(Math.random() * 10000), // Random request count up to 10,000
        errors: Math.floor(Math.random() * 100), // Random error count up to 100
        cpu: Math.random() * 100, // Random CPU percentage
        memory: Math.random() * 100, // Random memory percentage
      };

      // Save state
      await this.stateManager.saveAgentState(this.id, {
        providers: Object.fromEntries(this.providers),
        deployments: Object.fromEntries(this.deployments),
        deploymentStatus: Object.fromEntries(this.deploymentStatus),
      });
    }

    // Example monitoring result
    const result = {
      deploymentId,
      name: status.name,
      status: status.status,
      url: status.url,
      uptime: status.metrics?.uptime
        ? `${Math.floor(status.metrics.uptime / (1000 * 60 * 60))}h ${Math.floor((status.metrics.uptime % (1000 * 60 * 60)) / (1000 * 60))}m`
        : 'Unknown',
      health: status.status === 'deployed' ? 'healthy' : 'unhealthy',
      metrics: status.metrics,
      logs: status.logs?.slice(-10),
      resources: status.resources.map(r => ({
        id: r.id,
        type: r.type,
        name: r.name,
        status: r.status,
      })),
      alerts: [],
    };

    return result;
  }

  /**
   * Configure DNS for a deployment
   * @param deploymentId Deployment ID
   * @param dnsConfig DNS configuration
   * @param options Configuration options
   */
  private async configureDns(
    deploymentId: string,
    dnsConfig: {
      domain: string;
      records: {
        type: 'A' | 'CNAME' | 'TXT' | 'MX' | 'NS';
        name: string;
        value: string;
        ttl?: number;
      }[];
    },
    options?: any
  ): Promise<any> {
    this.logger.info(`Configuring DNS for deployment: ${deploymentId}`);

    // Check if deployment exists
    if (!this.deployments.has(deploymentId)) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    // Get deployment config and status
    const config = this.deployments.get(deploymentId)!;
    const status = this.deploymentStatus.get(deploymentId);

    // This would configure actual DNS
    // For now, it's a placeholder

    // Update network configuration with domain
    if (!config.network) {
      config.network = {};
    }
    config.network.domain = dnsConfig.domain;

    // Update deployment
    this.deployments.set(deploymentId, config);

    // Update status to include URL with domain
    if (status) {
      status.url = `https://${dnsConfig.domain}`;
      if (status.logs) {
        status.logs.push(
          `[${new Date().toISOString()}] Configured DNS for domain: ${dnsConfig.domain}`
        );

        // Add log entries for each record
        for (const record of dnsConfig.records) {
          status.logs.push(
            `[${new Date().toISOString()}] Added ${record.type} record: ${record.name} -> ${record.value}`
          );
        }
      }

      this.deploymentStatus.set(deploymentId, status);
    }

    // Save state
    await this.stateManager.saveAgentState(this.id, {
      providers: Object.fromEntries(this.providers),
      deployments: Object.fromEntries(this.deployments),
      deploymentStatus: Object.fromEntries(this.deploymentStatus),
    });

    // Example DNS configuration result
    const result = {
      domain: dnsConfig.domain,
      url: status?.url || `https://${dnsConfig.domain}`,
      records: dnsConfig.records,
      propagationStatus: 'in_progress',
      estimatedPropagationTime: '15-30 minutes',
      verificationRequired: dnsConfig.records.some(
        r => r.type === 'TXT' && r.name.includes('verification')
      ),
      nameservers: ['ns1.provider.com', 'ns2.provider.com'],
      recommendations: [
        'Wait for DNS propagation to complete before configuring SSL',
        'Consider setting up a subdomain for staging environments',
      ],
    };

    return result;
  }

  /**
   * Configure SSL for a deployment
   * @param deploymentId Deployment ID
   * @param sslConfig SSL configuration
   * @param options Configuration options
   */
  private async configureSsl(
    deploymentId: string,
    sslConfig: {
      type: 'auto' | 'custom';
      provider?: 'letsencrypt' | 'cloudflare' | 'custom';
      certificate?: string;
      privateKey?: string;
      chainCertificate?: string;
    },
    options?: any
  ): Promise<any> {
    this.logger.info(`Configuring SSL for deployment: ${deploymentId}`);

    // Check if deployment exists
    if (!this.deployments.has(deploymentId)) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    // Get deployment config and status
    const config = this.deployments.get(deploymentId)!;
    const status = this.deploymentStatus.get(deploymentId);

    // Check if domain is configured
    if (!config.network?.domain) {
      throw new Error('Domain must be configured before setting up SSL');
    }

    // This would configure actual SSL
    // For now, it's a placeholder

    // Update network configuration with SSL
    if (!config.network) {
      config.network = {};
    }
    config.network.ssl = true;

    // Update deployment
    this.deployments.set(deploymentId, config);

    // Update status to reflect SSL configuration
    if (status) {
      if (status.url && status.url.startsWith('http:')) {
        status.url = status.url.replace('http:', 'https:');
      }

      if (status.logs) {
        status.logs.push(
          `[${new Date().toISOString()}] Configured SSL (${sslConfig.type}) for domain: ${config.network.domain}`
        );
      }

      this.deploymentStatus.set(deploymentId, status);
    }

    // Save state
    await this.stateManager.saveAgentState(this.id, {
      providers: Object.fromEntries(this.providers),
      deployments: Object.fromEntries(this.deployments),
      deploymentStatus: Object.fromEntries(this.deploymentStatus),
    });

    // Example SSL configuration result
    const result = {
      domain: config.network.domain,
      url: status?.url,
      ssl: {
        enabled: true,
        type: sslConfig.type,
        provider: sslConfig.provider,
        issuer: sslConfig.type === 'auto' ? "Let's Encrypt" : 'Custom',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        status: 'active',
      },
      recommendations: [
        'Set up auto-renewal for SSL certificates',
        'Configure HTTP to HTTPS redirects',
        'Consider enabling HSTS for enhanced security',
      ],
    };

    return result;
  }

  /**
   * Scale a deployment
   * @param deploymentId Deployment ID
   * @param scalingConfig Scaling configuration
   * @param options Configuration options
   */
  private async scaleDeployment(
    deploymentId: string,
    scalingConfig: {
      instances?: number;
      cpu?: string;
      memory?: string;
      autoscaling?: {
        min: number;
        max: number;
        metric: string;
        target: number;
      };
    },
    options?: any
  ): Promise<any> {
    this.logger.info(`Scaling deployment: ${deploymentId}`);

    // Check if deployment exists
    if (!this.deployments.has(deploymentId)) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    // Get deployment config and status
    const config = this.deployments.get(deploymentId)!;
    const status = this.deploymentStatus.get(deploymentId);

    // Check if deployment is in a state that can be scaled
    if (status?.status !== 'deployed') {
      throw new Error(`Cannot scale deployment while it is in "${status?.status}" state`);
    }

    // This would scale the actual deployment
    // For now, it's a placeholder

    // Update resources configuration
    if (!config.resources) {
      config.resources = {};
    }

    if (scalingConfig.instances !== undefined) {
      config.resources.instances = scalingConfig.instances;
    }

    if (scalingConfig.cpu !== undefined) {
      config.resources.cpu = scalingConfig.cpu;
    }

    if (scalingConfig.memory !== undefined) {
      config.resources.memory = scalingConfig.memory;
    }

    if (scalingConfig.autoscaling !== undefined) {
      config.resources.autoscaling = scalingConfig.autoscaling;
    }

    // Update deployment
    this.deployments.set(deploymentId, config);

    // Update status to reflect scaling
    if (status) {
      if (status.logs) {
        status.logs.push(
          `[${new Date().toISOString()}] Scaling deployment: ${scalingConfig.instances !== undefined ? `instances=${scalingConfig.instances}` : ''} ${scalingConfig.cpu !== undefined ? `cpu=${scalingConfig.cpu}` : ''} ${scalingConfig.memory !== undefined ? `memory=${scalingConfig.memory}` : ''}`
        );

        if (scalingConfig.autoscaling) {
          status.logs.push(
            `[${new Date().toISOString()}] Configured autoscaling: min=${scalingConfig.autoscaling.min}, max=${scalingConfig.autoscaling.max}, metric=${scalingConfig.autoscaling.metric}, target=${scalingConfig.autoscaling.target}`
          );
        }
      }

      this.deploymentStatus.set(deploymentId, status);
    }

    // Save state
    await this.stateManager.saveAgentState(this.id, {
      providers: Object.fromEntries(this.providers),
      deployments: Object.fromEntries(this.deployments),
      deploymentStatus: Object.fromEntries(this.deploymentStatus),
    });

    // Example scaling result
    const result = {
      deploymentId,
      name: config.name,
      scaling: {
        previous: {
          instances: scalingConfig.instances !== undefined ? 1 : config.resources.instances,
          cpu: scalingConfig.cpu !== undefined ? '0.5' : config.resources.cpu,
          memory: scalingConfig.memory !== undefined ? '512Mi' : config.resources.memory,
        },
        current: {
          instances: config.resources.instances,
          cpu: config.resources.cpu,
          memory: config.resources.memory,
          autoscaling: config.resources.autoscaling,
        },
      },
      status: 'scaled',
      recommendations: [],
    };

    // Add recommendations based on configuration
    if (
      config.resources.instances &&
      config.resources.instances > 1 &&
      !config.resources.autoscaling
    ) {
      result.recommendations.push('Consider enabling autoscaling for better resource utilization');
    }

    if (
      config.resources.autoscaling &&
      config.resources.autoscaling.max <= config.resources.autoscaling.min
    ) {
      result.recommendations.push('Autoscaling max instances should be greater than min instances');
    }

    return result;
  }

  /**
   * Simulate deployment completion (for demonstration purposes)
   * @param deploymentId Deployment ID
   * @param config Deployment configuration
   */
  private async simulateDeploymentCompletion(
    deploymentId: string,
    config: WebDeploymentConfig
  ): Promise<void> {
    // Get status
    const status = this.deploymentStatus.get(deploymentId);

    if (!status) {
      return;
    }

    // Add log entries
    status.logs = status.logs || [];
    status.logs.push(`[${new Date().toISOString()}] Creating resources...`);
    status.logs.push(`[${new Date().toISOString()}] Building application...`);
    status.logs.push(`[${new Date().toISOString()}] Deploying application...`);
    status.logs.push(`[${new Date().toISOString()}] Deployment completed successfully`);

    // Update status
    status.status = 'deployed';
    status.endTime = new Date();

    // Generate URL based on provider and configuration
    const domain = config.network?.domain;
    const subdomain = config.network?.subdomain;
    const url = domain
      ? `https://${subdomain ? `${subdomain}.` : ''}${domain}`
      : `https://${config.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${config.provider.type === 'vercel' ? 'vercel.app' : config.provider.type === 'netlify' ? 'netlify.app' : 'example.com'}`;

    status.url = url;

    // Add resources
    status.resources = [
      {
        id: `resource-${Date.now().toString(16)}-1`,
        type: 'app',
        name: config.name,
        region: config.provider.region || 'us-east-1',
        status: 'active',
        createdAt: status.startTime,
        updatedAt: status.endTime,
        properties: {
          url: status.url,
          type: config.type,
        },
      },
    ];

    // Add additional resources based on configuration
    if (config.type === 'serverless') {
      status.resources.push({
        id: `resource-${Date.now().toString(16)}-2`,
        type: 'function',
        name: `${config.name}-api`,
        region: config.provider.region || 'us-east-1',
        status: 'active',
        createdAt: status.startTime,
        updatedAt: status.endTime,
        properties: {
          runtime: config.runtime?.name,
        },
      });
    } else if (config.type === 'container') {
      status.resources.push({
        id: `resource-${Date.now().toString(16)}-2`,
        type: 'container',
        name: `${config.name}-container`,
        region: config.provider.region || 'us-east-1',
        status: 'active',
        createdAt: status.startTime,
        updatedAt: status.endTime,
        properties: {
          image: config.source.image,
        },
      });
    }

    // If network configuration includes domain, add DNS resource
    if (config.network?.domain) {
      status.resources.push({
        id: `resource-${Date.now().toString(16)}-dns`,
        type: 'dns',
        name: config.network.domain,
        region: 'global',
        status: 'active',
        createdAt: status.startTime,
        updatedAt: status.endTime,
        properties: {
          domain: config.network.domain,
          ssl: config.network.ssl,
        },
      });
    }

    // Save state
    await this.stateManager.saveAgentState(this.id, {
      providers: Object.fromEntries(this.providers),
      deployments: Object.fromEntries(this.deployments),
      deploymentStatus: Object.fromEntries(this.deploymentStatus),
    });

    this.logger.info(`Deployment ${deploymentId} completed with status: ${status.status}`);
  }

  /**
   * Get all providers
   */
  public getProviders(): CloudProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a provider
   * @param name Provider name
   */
  public getProvider(name: string): CloudProviderConfig | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all deployments
   */
  public getDeployments(): WebDeploymentConfig[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Get all deployment statuses
   */
  public getDeploymentStatuses(): WebDeploymentStatus[] {
    return Array.from(this.deploymentStatus.values());
  }

  /**
   * Get deployment status
   * @param deploymentId Deployment ID
   */
  public getDeploymentStatus(deploymentId: string): WebDeploymentStatus | undefined {
    return this.deploymentStatus.get(deploymentId);
  }

  /**
   * Custom shutdown logic
   * @param force Whether shutdown is forced
   */
  protected async onShutdown(force: boolean): Promise<void> {
    // Save state
    await this.stateManager.saveAgentState(this.id, {
      providers: Object.fromEntries(this.providers),
      deployments: Object.fromEntries(this.deployments),
      deploymentStatus: Object.fromEntries(this.deploymentStatus),
    });
  }
}

/**
 * Helper function to get services for a provider
 * @param providerType Provider type
 */
function getServicesForProvider(providerType: string): string[] {
  switch (providerType) {
    case 'aws':
      return ['EC2', 'Lambda', 'S3', 'RDS', 'DynamoDB', 'CloudFront', 'Route53'];
    case 'gcp':
      return [
        'Compute Engine',
        'Cloud Functions',
        'Cloud Storage',
        'Cloud SQL',
        'Firestore',
        'Cloud CDN',
      ];
    case 'azure':
      return ['Virtual Machines', 'Functions', 'Blob Storage', 'SQL Database', 'Cosmos DB', 'CDN'];
    case 'heroku':
      return ['Dynos', 'Postgres', 'Redis', 'Add-ons'];
    case 'vercel':
      return ['Hosting', 'Serverless Functions', 'Edge Network', 'Analytics'];
    case 'netlify':
      return ['Hosting', 'Functions', 'Forms', 'Identity', 'Analytics'];
    case 'digitalocean':
      return ['Droplets', 'App Platform', 'Spaces', 'Managed Databases'];
    default:
      return ['Hosting', 'Storage', 'Database'];
  }
}

/**
 * Helper function to get features for a provider
 * @param providerType Provider type
 */
function getFeaturesForProvider(providerType: string): string[] {
  switch (providerType) {
    case 'aws':
      return ['Auto Scaling', 'Load Balancing', 'DNS Management', 'CDN', 'Managed Databases'];
    case 'gcp':
      return ['Auto Scaling', 'Load Balancing', 'DNS Management', 'CDN', 'Machine Learning'];
    case 'azure':
      return ['Auto Scaling', 'Load Balancing', 'DNS Management', 'CDN', 'Cognitive Services'];
    case 'heroku':
      return ['One-click Deployments', 'Add-ons Marketplace', 'Pipelines', 'Review Apps'];
    case 'vercel':
      return ['CI/CD', 'Preview Deployments', 'Edge Network', 'Serverless Functions'];
    case 'netlify':
      return ['CI/CD', 'Preview Deployments', 'Forms', 'Serverless Functions'];
    case 'digitalocean':
      return ['Simplified Deployment', 'Managed Databases', 'Object Storage', 'Kubernetes'];
    default:
      return ['Automated Deployments', 'Scalability', 'High Availability'];
  }
}
