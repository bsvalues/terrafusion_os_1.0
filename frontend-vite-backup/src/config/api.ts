class DynamicAPIConfig {
  private apiUrl: string | null = null;
  private discoveryInterval: NodeJS.Timer | null = null;
  private initialized: boolean = false;
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Try multiple discovery methods
    this.apiUrl = await this.discoverAPI();
    this.initialized = true;
    
    // Set up continuous discovery
    this.discoveryInterval = setInterval(async () => {
      try {
        const newUrl = await this.discoverAPI();
        if (newUrl !== this.apiUrl) {
          console.log(`API URL changed: ${this.apiUrl} -> ${newUrl}`);
          this.apiUrl = newUrl;
          window.dispatchEvent(new CustomEvent('api-url-changed', { detail: { newUrl } }));
        }
      } catch (error) {
        console.warn('API discovery failed:', error);
      }
    }, 5000);
  }
  
  private async discoverAPI(): Promise<string> {
    // Method 1: Check shared registry file
    try {
      const response = await fetch('/.well-known/service-ports.json');
      if (response.ok) {
        const ports = await response.json();
        if (ports.backend_api) {
          return `http://localhost:${ports.backend_api}/api`;
        }
      }
    } catch {
      // Silent fail, try next method
    }
    
    // Method 2: Check Windows temp directory for registry
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      try {
        // For Electron apps
        const { electronAPI } = window as any;
        const registry = await electronAPI.readPortRegistry();
        if (registry?.backend_api) {
          return `http://localhost:${registry.backend_api}/api`;
        }
      } catch {
        // Silent fail
      }
    }
    
    // Method 3: Port scanning with health check
    const candidates = [5000, 5001, 5002, 5003, 5010, 5041];
    for (const port of candidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        
        const response = await fetch(`http://localhost:${port}/api/health`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return `http://localhost:${port}/api`;
        }
      } catch {
        // Port not available or timed out
      }
    }
    
    // Method 4: Environment variable (build time)
    if (import.meta.env?.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Method 5: Check for .env file values
    if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
      return process.env.VITE_API_URL;
    }
    
    throw new Error('Could not discover API endpoint - no backend services responding');
  }
  
  get baseURL(): string {
    if (!this.apiUrl) {
      throw new Error('API not initialized - call initialize() first');
    }
    return this.apiUrl;
  }
  
  get isInitialized(): boolean {
    return this.initialized;
  }
  
  destroy(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    this.initialized = false;
  }
  
  // Helper method to create axios instance with dynamic URL
  createAxiosInstance() {
    const axios = require('axios');
    return axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  // Helper for fetch requests
  async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    return fetch(url, options);
  }
}

// Export singleton instance
export const API = new DynamicAPIConfig();

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  API.initialize().catch(error => {
    console.warn('Failed to initialize API config:', error);
  });
}

// Type definitions for better TypeScript support
export interface ServicePorts {
  backend_api?: number;
  frontend?: number;
  trust_fabric_api?: number;
  blockchain?: number;
  ai_swarm?: number;
  updated?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

// Enhanced service discovery for different environments
export class ServiceDiscovery {
  static async getAllServices(): Promise<ServicePorts> {
    const methods = [
      () => this.checkWellKnownEndpoint(),
      () => this.checkEnvironmentVariables(),
      () => this.scanCommonPorts(),
    ];
    
    for (const method of methods) {
      try {
        const result = await method();
        if (result && Object.keys(result).length > 0) {
          return result;
        }
      } catch {
        // Continue to next method
      }
    }
    
    return {};
  }
  
  private static async checkWellKnownEndpoint(): Promise<ServicePorts> {
    const response = await fetch('/.well-known/service-ports.json');
    return response.ok ? await response.json() : {};
  }
  
  private static checkEnvironmentVariables(): ServicePorts {
    const services: ServicePorts = {};
    
    if (process.env.TERRAFUSION_BACKEND_API_PORT) {
      services.backend_api = parseInt(process.env.TERRAFUSION_BACKEND_API_PORT);
    }
    if (process.env.TERRAFUSION_FRONTEND_PORT) {
      services.frontend = parseInt(process.env.TERRAFUSION_FRONTEND_PORT);
    }
    if (process.env.TERRAFUSION_TRUST_FABRIC_API_PORT) {
      services.trust_fabric_api = parseInt(process.env.TERRAFUSION_TRUST_FABRIC_API_PORT);
    }
    
    return services;
  }
  
  private static async scanCommonPorts(): Promise<ServicePorts> {
    const services: ServicePorts = {};
    
    const servicePortRanges = {
      backend_api: [5000, 5010],
      frontend: [3000, 3010],
      trust_fabric_api: [9000, 9010],
    };
    
    for (const [service, [start, end]] of Object.entries(servicePortRanges)) {
      for (let port = start; port <= end; port++) {
        try {
          const response = await fetch(`http://localhost:${port}/health`, {
            signal: AbortSignal.timeout(500)
          });
          if (response.ok) {
            services[service as keyof ServicePorts] = port;
            break;
          }
        } catch {
          // Port not responding
        }
      }
    }
    
    return services;
  }
}

export default API;
