import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';

export class TrustFabricPortManager {
  private static instance: TrustFabricPortManager;
  private allocatedPorts: Map<string, number> = new Map();
  private portRegistry: string = process.platform === 'win32' 
    ? path.join(process.env.TEMP || 'C:\\temp', 'terrafusion-ports.json')
    : '/tmp/terrafusion-ports.json';
  
  static getInstance(): TrustFabricPortManager {
    if (!TrustFabricPortManager.instance) {
      TrustFabricPortManager.instance = new TrustFabricPortManager();
    }
    return TrustFabricPortManager.instance;
  }

  async allocatePort(service: string, preferred?: number): Promise<number> {
    console.log(`🔍 Allocating port for service: ${service} (preferred: ${preferred || 'none'})`);
    
    // Check if already allocated
    const existing = this.allocatedPorts.get(service);
    if (existing && await this.isPortAvailable(existing)) {
      console.log(`✅ Using existing port ${existing} for ${service}`);
      return existing;
    }
    
    // Try preferred port
    if (preferred && await this.isPortAvailable(preferred)) {
      this.registerPort(service, preferred);
      console.log(`✅ Using preferred port ${preferred} for ${service}`);
      return preferred;
    }
    
    // Find random available port
    const port = await this.findAvailablePort();
    this.registerPort(service, port);
    console.log(`✅ Allocated dynamic port ${port} for ${service}`);
    return port;
  }
  
  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }
  
  private async findAvailablePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address !== 'string') {
          const port = address.port;
          server.close(() => resolve(port));
        } else {
          server.close(() => reject(new Error('Could not get port')));
        }
      });
      
      server.on('error', reject);
    });
  }
  
  private registerPort(service: string, port: number): void {
    this.allocatedPorts.set(service, port);
    
    // Write to shared registry file
    const registry = {
      ...this.loadRegistry(),
      [service]: port,
      updated: new Date().toISOString()
    };
    
    // Ensure directory exists
    const registryDir = path.dirname(this.portRegistry);
    if (!fs.existsSync(registryDir)) {
      fs.mkdirSync(registryDir, { recursive: true });
    }
    
    fs.writeFileSync(this.portRegistry, JSON.stringify(registry, null, 2));
    
    // Also set environment variable
    process.env[`TERRAFUSION_${service.toUpperCase()}_PORT`] = String(port);
    
    console.log(`📝 Registered ${service} on port ${port}`);
  }
  
  private loadRegistry(): Record<string, any> {
    try {
      if (fs.existsSync(this.portRegistry)) {
        const data = fs.readFileSync(this.portRegistry, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load port registry:', error);
    }
    return {};
  }
  
  getAllPorts(): Record<string, number> {
    return Object.fromEntries(this.allocatedPorts);
  }
  
  getServicePort(service: string): number | undefined {
    return this.allocatedPorts.get(service);
  }
  
  async releasePort(service: string): Promise<void> {
    const port = this.allocatedPorts.get(service);
    if (port) {
      this.allocatedPorts.delete(service);
      
      const registry = this.loadRegistry();
      delete registry[service];
      registry.updated = new Date().toISOString();
      
      fs.writeFileSync(this.portRegistry, JSON.stringify(registry, null, 2));
      
      delete process.env[`TERRAFUSION_${service.toUpperCase()}_PORT`];
      
      console.log(`🗑️ Released port ${port} for service ${service}`);
    }
  }
}

// Service configuration with NO hardcoded ports
export const SERVICE_CONFIG = {
  backend_api: {
    allocation_strategy: "dynamic" as const,
    preferred_range: [5000, 5100],
    health_endpoint: "/api/health"
  },
  
  frontend: {
    allocation_strategy: "dynamic" as const,
    preferred_range: [3000, 3100],
    health_endpoint: "/"
  },
  
  trust_fabric_api: {
    allocation_strategy: "dynamic" as const,
    preferred_range: [9000, 9100],
    health_endpoint: "/health"
  },
  
  blockchain: {
    allocation_strategy: "dynamic" as const,
    preferred_range: [8500, 8600],
    health_endpoint: "/status"
  },
  
  ai_swarm: {
    allocation_strategy: "dynamic" as const,
    preferred_range: [9000, 9200],
    health_endpoint: "/swarm/status"
  }
};

export default TrustFabricPortManager;
