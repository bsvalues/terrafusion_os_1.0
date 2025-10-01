// NO HARDCODED PORTS! Use environment variables.
/**
 * Service Mesh Client - Enterprise Service Discovery
 * 
 * Replaces hardcoded URLs with dynamic service discovery through Consul
 * Implements caching, health monitoring, and automatic failover
 * 
 * @author TerraFusion Engineering Team
 * @version 1.0.0 - Enterprise Grade
 */

import { EventEmitter } from 'events';

export interface ServiceEndpoint {
  id: string;
  name: string;
  address: string;
  port: number;
  url: string;
  health: 'passing' | 'warning' | 'critical';
  tags: string[];
  meta: Record<string, string>;
  lastUpdated: number;
  route: string;
}

export interface ServiceHealth {
  node: string;
  service: string;
  status: 'passing' | 'warning' | 'critical';
  checks: Array<{
    checkId: string;
    name: string;
    status: string;
    output: string;
  }>;
}

export interface ConsulOptions {
  host: string;
  port: string | number;
  secure: boolean;
  ca?: string | Buffer;
  timeout: number;
}

export class ServiceMeshClient extends EventEmitter {
  private options: ConsulOptions;
  private cache: Map<string, ServiceEndpoint> = new Map();
  private healthCache: Map<string, ServiceHealth> = new Map();
  private watchHandles: Map<string, number> = new Map();
  private initialized = false;
  
  constructor(options?: Partial<ConsulOptions>) {
    super();
    
    this.options = {
      host: process.env.CONSUL_HOST || 'localhost',
      port: process.env.CONSUL_PORT || '8500',
      secure: process.env.NODE_ENV === 'production',
      timeout: 5000,
      ...options
    };
    
    console.log('🌐 Service Mesh Client initializing...');
    console.log(`   Consul endpoint: ${this.options.secure ? 'https' : 'http'}://${this.options.host}:${this.options.port}`);
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Test connectivity to Consul
      await this.healthCheck();
      
      // Start service discovery watches
      await this.establishWatches();
      
      this.initialized = true;
      this.emit('ready');
      
      console.log('✅ Service Mesh Client ready');
    } catch (error) {
      console.error('❌ Service Mesh initialization failed:', error);
      
      // Fallback to environment-based discovery
      await this.initializeFallbackMode();
    }
  }
  
  private async healthCheck(): Promise<void> {
    const url = `${this.options.secure ? 'https' : 'http'}://${this.options.host}:${this.options.port}/v1/status/leader`;
    
    // Implement timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Consul health check failed: ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  private async establishWatches(): Promise<void> {
    const serviceNames = [
      'terrafusion-backend',
      'terrafusion-api',
      'trust-fabric',
      'ai-orchestration',
      'property-service',
      'permit-service'
    ];
    
    for (const serviceName of serviceNames) {
      this.startServiceWatch(serviceName);
    }
    
    console.log(`🔍 Established watches for ${serviceNames.length} services`);
  }
  
  private startServiceWatch(serviceName: string): void {
    const watchInterval = setInterval(async () => {
      try {
        await this.refreshService(serviceName);
      } catch (error) {
        console.warn(`Service watch failed for ${serviceName}:`, error);
        this.emit('serviceUnavailable', serviceName, error);
      }
    }, 10000); // Check every 10 seconds
    
    this.watchHandles.set(serviceName, watchInterval as any);
    
    // Initial discovery
    this.refreshService(serviceName).catch(error => {
      console.warn(`Initial service discovery failed for ${serviceName}:`, error);
    });
  }
  
  private async refreshService(serviceName: string): Promise<void> {
    const url = `${this.options.secure ? 'https' : 'http'}://${this.options.host}:${this.options.port}/v1/health/service/${serviceName}`;
    
    // Implement timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
    
    let services: any[];
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Service discovery failed: ${response.status}`);
      }
      
      services = await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
    
    const healthyServices = services.filter((s: any) => 
      s.Checks.every((check: any) => check.Status === 'passing')
    );
    
    if (healthyServices.length > 0) {
      const selectedService = this.selectBestEndpoint(healthyServices);
      const endpoint = this.parseServiceEndpoint(selectedService);
      
      const cachedEndpoint = this.cache.get(serviceName);
      if (!cachedEndpoint || this.hasEndpointChanged(cachedEndpoint, endpoint)) {
        this.cache.set(serviceName, endpoint);
        this.emit('serviceUpdated', serviceName, endpoint);
        console.log(`🔄 Service updated: ${serviceName} -> ${endpoint.url}`);
      }
    } else if (this.cache.has(serviceName)) {
      this.cache.delete(serviceName);
      this.emit('serviceLost', serviceName);
      console.warn(`⚠️ Service lost: ${serviceName}`);
    }
  }
  
  private selectBestEndpoint(services: any[]): any {
    // Select service with best health score and lowest response time
    return services.reduce((best, current) => {
      const bestScore = this.calculateHealthScore(best);
      const currentScore = this.calculateHealthScore(current);
      return currentScore > bestScore ? current : best;
    });
  }
  
  private calculateHealthScore(service: any): number {
    let score = 100;
    
    // Penalize for warnings
    const warnings = service.Checks.filter((c: any) => c.Status === 'warning');
    score -= warnings.length * 20;
    
    // Prefer services with response time metadata
    if (service.Service.Meta?.['response-time']) {
      const responseTime = parseInt(service.Service.Meta['response-time']);
      score -= Math.min(responseTime / 10, 30); // Cap penalty at 30 points
    }
    
    return Math.max(score, 0);
  }
  
  private parseServiceEndpoint(service: any): ServiceEndpoint {
    const address = service.Service.Address || service.Node.Address;
    const port = service.Service.Port;
    
    return {
      id: service.Service.ID,
      name: service.Service.Service,
      address,
      port,
      url: `http://${address}:${port}`,
      health: 'passing',
      tags: service.Service.Tags || [],
      meta: service.Service.Meta || {},
      lastUpdated: Date.now(),
      route: `${service.Service.Service}:${service.Service.ID}`
    };
  }
  
  private hasEndpointChanged(cached: ServiceEndpoint, updated: ServiceEndpoint): boolean {
    return cached.url !== updated.url || 
           cached.health !== updated.health ||
           JSON.stringify(cached.meta) !== JSON.stringify(updated.meta);
  }
  
  private async initializeFallbackMode(): Promise<void> {
    console.log('🔄 Initializing fallback service discovery mode...');
    
    // Use environment variables as fallback
    const fallbackServices: Record<string, ServiceEndpoint> = {
      'terrafusion-backend': {
        id: 'fallback-backend',
        name: 'terrafusion-backend',
        address: 'localhost',
        port: parseInt(process.env.VITE_API_PORT || '5000'),
        url: process.env.VITE_API_URL || 'http://localhost:${TF_STATIC_PORT:-8080}',
        health: 'passing',
        tags: ['fallback'],
        meta: { mode: 'fallback' },
        lastUpdated: Date.now(),
        route: 'fallback:backend'
      }
    };
    
    // Populate cache with fallback services
    for (const [name, endpoint] of Object.entries(fallbackServices)) {
      this.cache.set(name, endpoint);
      console.log(`📍 Fallback service: ${name} -> ${endpoint.url}`);
    }
    
    this.initialized = true;
    this.emit('ready');
    console.log('✅ Service Mesh Client ready (fallback mode)');
  }
  
  public async discoverService(name: string): Promise<ServiceEndpoint> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const cached = this.cache.get(name);
    if (cached && !this.isStale(cached)) {
      return cached;
    }
    
    // Try immediate refresh if stale
    if (cached && this.isStale(cached)) {
      try {
        await this.refreshService(name);
        const refreshed = this.cache.get(name);
        if (refreshed) {
          return refreshed;
        }
      } catch (error) {
        console.warn(`Failed to refresh stale service ${name}:`, error);
      }
    }
    
    throw new Error(`Service not available: ${name}`);
  }
  
  private isStale(endpoint: ServiceEndpoint): boolean {
    const maxAge = 60000; // 1 minute
    return Date.now() - endpoint.lastUpdated > maxAge;
  }
  
  public getServiceHealth(name: string): ServiceHealth | null {
    return this.healthCache.get(name) || null;
  }
  
  public getAllServices(): ServiceEndpoint[] {
    return Array.from(this.cache.values());
  }
  
  public isReady(): boolean {
    return this.initialized;
  }
  
  public destroy(): void {
    // Clear all watches - convert to array to avoid iterator issues
    const handles = Array.from(this.watchHandles.values());
    for (const handle of handles) {
      clearInterval(handle);
    }
    
    this.watchHandles.clear();
    this.cache.clear();
    this.healthCache.clear();
    this.initialized = false;
    
    console.log('🛑 Service Mesh Client destroyed');
  }
}
