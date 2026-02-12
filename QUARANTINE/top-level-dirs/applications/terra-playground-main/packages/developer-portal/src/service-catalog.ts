/**
 * Service Catalog
 *
 * Provides a comprehensive catalog of all services, core models, and microservices in the system:
 * - Categorized services with discoverability
 * - Detailed service documentation
 * - Service dependencies and relationships
 * - Health status and monitoring
 * - Usage metrics and examples
 */

import { EventEmitter } from 'events';

// Service Type
export enum ServiceType {
  CORE_MODEL = 'core_model',
  UI_COMPONENT = 'ui_component',
  MICROSERVICE = 'microservice',
  API_GATEWAY = 'api_gateway',
  PLUGIN = 'plugin',
  AGENT = 'agent',
  DATA_PROCESSOR = 'data_processor',
  UTILITY = 'utility',
}

// Service Status
export enum ServiceStatus {
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  BETA = 'beta',
  ALPHA = 'alpha',
  ARCHIVED = 'archived',
}

// Service Health Status
export enum ServiceHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

// Service Dependency
export interface ServiceDependency {
  serviceId: string;
  name: string;
  version: string;
  required: boolean;
  description: string;
}

// Service Example
export interface ServiceExample {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  liveUrl?: string;
}

// Service Entity
export interface ServiceEntity {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  version: string;
  status: ServiceStatus;
  healthStatus: ServiceHealthStatus;
  repositoryUrl?: string;
  documentationUrl?: string;
  dependencies: ServiceDependency[];
  apis: string[]; // API IDs
  examples: ServiceExample[];
  tags: string[];
  owner: string;
  contactEmail?: string;
  team?: string;
  metrics?: {
    uptime?: number; // Percentage
    requestsPerMinute?: number;
    averageResponseTime?: number; // In milliseconds
    errorRate?: number; // Percentage
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service Catalog Manager
 */
export class ServiceCatalogManager extends EventEmitter {
  private services: Map<string, ServiceEntity> = new Map();

  constructor() {
    super();
  }

  /**
   * Initialize the service catalog
   */
  public initialize(): void {
    this.emit('initialized');
  }

  /**
   * Register a new service
   */
  public registerService(
    service: Omit<ServiceEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): ServiceEntity {
    const id = `service-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newService: ServiceEntity = {
      ...service,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.services.set(id, newService);

    `);
    this.emit('service:registered', newService);

    return newService;
  }

  /**
   * Update an existing service
   */
  public updateService(
    id: string,
    updates: Partial<Omit<ServiceEntity, 'id' | 'createdAt' | 'updatedAt'>>
  ): ServiceEntity | null {
    const service = this.services.get(id);

    if (!service) {
      console.error(`Service not found: ${id}`);
      return null;
    }

    const updatedService: ServiceEntity = {
      ...service,
      ...updates,
      updatedAt: new Date(),
    };

    this.services.set(id, updatedService);

    `);
    this.emit('service:updated', updatedService);

    return updatedService;
  }

  /**
   * Update service health status
   */
  public updateServiceHealth(
    id: string,
    status: ServiceHealthStatus,
    metrics?: ServiceEntity['metrics']
  ): ServiceEntity | null {
    const service = this.services.get(id);

    if (!service) {
      console.error(`Service not found: ${id}`);
      return null;
    }

    const updatedService: ServiceEntity = {
      ...service,
      healthStatus: status,
      metrics: metrics ? { ...service.metrics, ...metrics } : service.metrics,
      updatedAt: new Date(),
    };

    this.services.set(id, updatedService);

    this.emit('service:health-updated', {
      service: updatedService,
      oldStatus: service.healthStatus,
      newStatus: status,
    });

    return updatedService;
  }

  /**
   * Add a dependency to a service
   */
  public addDependency(serviceId: string, dependency: ServiceDependency): ServiceEntity | null {
    const service = this.services.get(serviceId);

    if (!service) {
      console.error(`Service not found: ${serviceId}`);
      return null;
    }

    // Check if dependency exists (to avoid duplicates)
    const existingIndex = service.dependencies.findIndex(d => d.serviceId === dependency.serviceId);

    if (existingIndex >= 0) {
      service.dependencies[existingIndex] = dependency;
    } else {
      service.dependencies.push(dependency);
    }

    service.updatedAt = new Date();

    this.emit('service:dependency-added', { service, dependency });

    return service;
  }

  /**
   * Remove a dependency from a service
   */
  public removeDependency(serviceId: string, dependencyServiceId: string): ServiceEntity | null {
    const service = this.services.get(serviceId);

    if (!service) {
      console.error(`Service not found: ${serviceId}`);
      return null;
    }

    service.dependencies = service.dependencies.filter(d => d.serviceId !== dependencyServiceId);
    service.updatedAt = new Date();

    this.emit('service:dependency-removed', { service, dependencyServiceId });

    return service;
  }

  /**
   * Add an example to a service
   */
  public addExample(serviceId: string, example: Omit<ServiceExample, 'id'>): ServiceExample | null {
    const service = this.services.get(serviceId);

    if (!service) {
      console.error(`Service not found: ${serviceId}`);
      return null;
    }

    const id = `example-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newExample: ServiceExample = {
      ...example,
      id,
    };

    service.examples.push(newExample);
    service.updatedAt = new Date();

    this.emit('service:example-added', { service, example: newExample });

    return newExample;
  }

  /**
   * Get a service by ID
   */
  public getService(id: string): ServiceEntity | undefined {
    return this.services.get(id);
  }

  /**
   * Get all services
   */
  public getAllServices(): ServiceEntity[] {
    return Array.from(this.services.values());
  }

  /**
   * Get services by type
   */
  public getServicesByType(type: ServiceType): ServiceEntity[] {
    return this.getAllServices().filter(service => service.type === type);
  }

  /**
   * Get services by status
   */
  public getServicesByStatus(status: ServiceStatus): ServiceEntity[] {
    return this.getAllServices().filter(service => service.status === status);
  }

  /**
   * Get services by health status
   */
  public getServicesByHealthStatus(status: ServiceHealthStatus): ServiceEntity[] {
    return this.getAllServices().filter(service => service.healthStatus === status);
  }

  /**
   * Get services by tag
   */
  public getServicesByTag(tag: string): ServiceEntity[] {
    return this.getAllServices().filter(service => service.tags.includes(tag));
  }

  /**
   * Get services by owner
   */
  public getServicesByOwner(owner: string): ServiceEntity[] {
    return this.getAllServices().filter(service => service.owner === owner);
  }

  /**
   * Get services by team
   */
  public getServicesByTeam(team: string): ServiceEntity[] {
    return this.getAllServices().filter(service => service.team === team);
  }

  /**
   * Search services
   */
  public searchServices(query: string): ServiceEntity[] {
    query = query.toLowerCase();

    return this.getAllServices().filter(service => {
      return (
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }

  /**
   * Get dependent services
   */
  public getDependentServices(serviceId: string): ServiceEntity[] {
    return this.getAllServices().filter(service =>
      service.dependencies.some(d => d.serviceId === serviceId)
    );
  }

  /**
   * Get dependency graph
   */
  public getDependencyGraph(): any {
    const nodes: any[] = [];
    const edges: any[] = [];

    for (const service of this.getAllServices()) {
      nodes.push({
        id: service.id,
        label: service.name,
        type: service.type,
        status: service.status,
        healthStatus: service.healthStatus,
      });

      for (const dependency of service.dependencies) {
        edges.push({
          from: service.id,
          to: dependency.serviceId,
          label: dependency.name,
          required: dependency.required,
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Generate service documentation
   */
  public generateServiceDocumentation(serviceId: string): any {
    const service = this.services.get(serviceId);

    if (!service) {
      console.error(`Service not found: ${serviceId}`);
      return null;
    }

    // Generate documentation structure
    const documentation = {
      id: serviceId,
      name: service.name,
      description: service.description,
      type: service.type,
      version: service.version,
      status: service.status,
      healthStatus: service.healthStatus,
      owner: service.owner,
      team: service.team,
      contactEmail: service.contactEmail,
      repository: service.repositoryUrl,
      sections: [
        {
          title: 'Overview',
          content: service.description,
        },
        {
          title: 'Dependencies',
          content: service.dependencies.map(dep => ({
            name: dep.name,
            version: dep.version,
            required: dep.required,
            description: dep.description,
          })),
        },
        {
          title: 'Examples',
          content: service.examples.map(example => ({
            title: example.title,
            description: example.description,
            code: example.code,
            language: example.language,
            liveUrl: example.liveUrl,
          })),
        },
      ],
    };

    // Add metrics section if available
    if (service.metrics) {
      documentation.sections.push({
        title: 'Metrics',
        content: {
          uptime: service.metrics.uptime ? `${service.metrics.uptime.toFixed(2)}%` : 'N/A',
          requestsPerMinute: service.metrics.requestsPerMinute
            ? service.metrics.requestsPerMinute.toFixed(2)
            : 'N/A',
          averageResponseTime: service.metrics.averageResponseTime
            ? `${service.metrics.averageResponseTime.toFixed(2)}ms`
            : 'N/A',
          errorRate: service.metrics.errorRate ? `${service.metrics.errorRate.toFixed(2)}%` : 'N/A',
        },
      });
    }

    // Add dependent services section
    const dependentServices = this.getDependentServices(serviceId);
    if (dependentServices.length > 0) {
      documentation.sections.push({
        title: 'Used By',
        content: dependentServices.map(svc => ({
          id: svc.id,
          name: svc.name,
          type: svc.type,
          status: svc.status,
        })),
      });
    }

    this.emit('documentation:generated', { service, documentation });

    return documentation;
  }

  /**
   * Get service health summary
   */
  public getHealthSummary(): any {
    const services = this.getAllServices();

    const summary = {
      total: services.length,
      healthy: services.filter(s => s.healthStatus === ServiceHealthStatus.HEALTHY).length,
      degraded: services.filter(s => s.healthStatus === ServiceHealthStatus.DEGRADED).length,
      unhealthy: services.filter(s => s.healthStatus === ServiceHealthStatus.UNHEALTHY).length,
      unknown: services.filter(s => s.healthStatus === ServiceHealthStatus.UNKNOWN).length,
      healthPercentage: 0,
      byType: {} as Record<string, any>,
    };

    // Calculate health percentage
    if (services.length > 0) {
      const healthScore = services.reduce((score, service) => {
        if (service.healthStatus === ServiceHealthStatus.HEALTHY) return score + 1;
        if (service.healthStatus === ServiceHealthStatus.DEGRADED) return score + 0.5;
        return score;
      }, 0);

      summary.healthPercentage = (healthScore / services.length) * 100;
    }

    // Group by type
    for (const type of Object.values(ServiceType)) {
      const servicesOfType = this.getServicesByType(type as ServiceType);

      if (servicesOfType.length > 0) {
        summary.byType[type] = {
          total: servicesOfType.length,
          healthy: servicesOfType.filter(s => s.healthStatus === ServiceHealthStatus.HEALTHY)
            .length,
          degraded: servicesOfType.filter(s => s.healthStatus === ServiceHealthStatus.DEGRADED)
            .length,
          unhealthy: servicesOfType.filter(s => s.healthStatus === ServiceHealthStatus.UNHEALTHY)
            .length,
          unknown: servicesOfType.filter(s => s.healthStatus === ServiceHealthStatus.UNKNOWN)
            .length,
        };
      }
    }

    return summary;
  }
}

/**
 * Create a new service catalog manager
 */
export function createServiceCatalogManager(): ServiceCatalogManager {
  return new ServiceCatalogManager();
}

