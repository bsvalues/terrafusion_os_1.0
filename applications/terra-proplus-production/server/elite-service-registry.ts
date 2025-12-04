// ??? TerraFusion Elite Government OS Engineering Agent
// SERVICE REGISTRY INTEGRATION FOR TERRAFUSION PROPLUZ
// Classification: GOVERNMENT-GRADE INFRASTRUCTURE OPTIMIZATION

import { EventEmitter } from 'events';

export interface ServiceRegistration {
  name: string;
  port: number;
  host?: string;
  healthEndpoint: string;
  capabilities: string[];
  status: 'starting' | 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck?: Date;
  metadata?: {
    platform: 'terrafusion-propluz' | 'government-os';
    classification: 'real-estate' | 'government' | 'hybrid';
    securityLevel: 'standard' | 'government-grade' | 'classified';
  };
}

export interface GovernmentOSConnection {
  endpoint: string;
  apiKey?: string;
  certificatePath?: string;
  securityLevel: 'standard' | 'government-grade';
}

/**
 * ??? ELITE SERVICE REGISTRY - GOVERNMENT-GRADE IMPLEMENTATION
 * Provides zero-conflict service discovery and coordination between ProPlus and Government OS.
 */
export class EliteServiceRegistry extends EventEmitter {
  private services: Map<string, ServiceRegistration> = new Map();
  private governmentOSConnection?: GovernmentOSConnection;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(governmentOSConnection?: GovernmentOSConnection) {
    super();
    this.governmentOSConnection = governmentOSConnection;
    this.startHealthChecking();
  }

  async getAvailablePort(): Promise<number> {
    const net = await import('net');
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          const port = address.port;
          console.log(`?? Elite Service Registry: Allocated port ${port}`);
          server.close(() => resolve(port));
        } else {
          reject(new Error('Failed to get port from server address'));
        }
      });
      server.on('error', reject);
    });
  }

  async registerService(registration: Omit<ServiceRegistration, 'status' | 'lastHealthCheck'>): Promise<void> {
    const service: ServiceRegistration = { ...registration, status: 'starting', lastHealthCheck: new Date() };
    this.services.set(registration.name, service);

    console.log(`??? Elite Service Registry: Registered ${registration.name} on port ${registration.port}`);
    console.log(`?? Capabilities: ${registration.capabilities.join(', ')}`);

    if (this.governmentOSConnection) {
      await this.notifyGovernmentOS('service-registered', service);
    }

    this.emit('service-registered', service);
  }

  async discoverServices(capability?: string): Promise<ServiceRegistration[]> {
    const services = Array.from(this.services.values());
    if (capability) {
      return services.filter((service) => service.capabilities.includes(capability) && service.status === 'healthy');
    }
    return services.filter((service) => service.status === 'healthy');
  }

  async coordinateWithGovernmentOS(request: { action: string; parameters: Record<string, any> }): Promise<any> {
    if (!this.governmentOSConnection) {
      throw new Error('Government OS connection not configured');
    }

    console.log(`??? Coordinating with Government OS: ${request.action}`);
    const endpoint = `${this.governmentOSConnection.endpoint.replace(/\\/$/, '')}/api/coordination`;
    const apiKey = process.env.GOVERNMENT_OS_API_KEY || this.governmentOSConnection.apiKey;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          action: request.action,
          parameters: request.parameters,
          securityLevel: this.governmentOSConnection.securityLevel
        })
      });

      if (!response.ok) {
        throw new Error(`Government OS responded with ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Government OS coordination failed', error);
      return {
        success: false,
        error: (error as Error).message,
        data: {
          message: `Fallback coordination response for ${request.action}`,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [name, service] of this.services) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(`http://${service.host || 'localhost'}:${service.port}${service.healthEndpoint}`, {
            method: 'GET',
            headers: {
              ...(process.env.SERVICE_HEALTH_TOKEN ? { Authorization: `Bearer ${process.env.SERVICE_HEALTH_TOKEN}` } : {})
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (response.ok) {
            service.status = 'healthy';
            service.lastHealthCheck = new Date();
          } else {
            service.status = 'degraded';
            console.warn(`?? Service ${name} health check failed: ${response.status}`);
          }
        } catch (error) {
          service.status = 'unhealthy';
          console.error(`? Service ${name} health check error:`, error);
          this.emit('service-unhealthy', service);
        }
      }
    }, 30000);
  }

  private async notifyGovernmentOS(event: string, data: any): Promise<void> {
    if (!this.governmentOSConnection) return;
    try {
      console.log(`?? Notifying Government OS: ${event}`);
      const apiKey = process.env.GOVERNMENT_OS_API_KEY || this.governmentOSConnection.apiKey;
      const endpoint = `${this.governmentOSConnection.endpoint.replace(/\\/$/, '')}/api/notifications`;

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          event,
          payload: data,
          securityLevel: this.governmentOSConnection.securityLevel,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to notify Government OS:', error);
    }
  }

  getServiceStatus(name: string): ServiceRegistration | undefined {
    return this.services.get(name);
  }

  getRegistryHealth(): {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    governmentOSConnected: boolean;
    lastUpdate: Date;
  } {
    const services = Array.from(this.services.values());
    return {
      totalServices: services.length,
      healthyServices: services.filter((s) => s.status === 'healthy').length,
      degradedServices: services.filter((s) => s.status === 'degraded').length,
      unhealthyServices: services.filter((s) => s.status === 'unhealthy').length,
      governmentOSConnected: !!this.governmentOSConnection,
      lastUpdate: new Date()
    };
  }

  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.governmentOSConnection) {
      await this.notifyGovernmentOS('registry-shutdown', { services: Array.from(this.services.keys()) });
    }
    console.log('??? Elite Service Registry: Cleanup completed');
  }
}

export const eliteServiceRegistry = new EliteServiceRegistry({
  endpoint: process.env.GOVERNMENT_OS_ENDPOINT || 'http://localhost:3004',
  apiKey: process.env.GOVERNMENT_OS_API_KEY,
  securityLevel: 'government-grade'
});

process.on('SIGTERM', () => eliteServiceRegistry.cleanup());
process.on('SIGINT', () => eliteServiceRegistry.cleanup());
