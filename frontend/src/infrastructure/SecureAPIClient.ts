/**
 * Secure API Client - Enterprise Service Communication
 * 
 * Integrates Service Mesh, Trust Fabric, and Circuit Breaker
 * for secure, resilient, and discoverable service interactions
 * 
 * @author TerraFusion Engineering Team
 * @version 1.0.0 - Enterprise Grade
 */

import { ServiceMeshClient, ServiceEndpoint } from './ServiceMesh';
import { TrustFabricClient, Attestation, SecurityEnvelope } from './TrustFabric';
import { CircuitBreaker, CircuitBreakerError } from './CircuitBreaker';

export interface RequestOptions extends Omit<RequestInit, 'priority'> {
  timeout?: number;
  retries?: number;
  attestRequired?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface SecureResponse<T = any> {
  data: T;
  attestation?: Attestation;
  metadata: {
    requestId: string;
    responseTime: number;
    service: string;
    endpoint: string;
    attestationVerified: boolean;
    fromCache: boolean;
  };
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class AttestationError extends Error {
  constructor(message: string, public readonly attestation?: Attestation) {
    super(message);
    this.name = 'AttestationError';
  }
}

export class SecureAPIClient {
  private responseCache: Map<string, { data: any; expiry: number }> = new Map();
  private requestQueue: Map<string, Promise<any>> = new Map();
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2
  };
  
  constructor(
    private serviceMesh: ServiceMeshClient,
    private trustFabric: TrustFabricClient,
    private circuitBreaker: CircuitBreaker
  ) {
    console.log('🔒 Secure API Client initialized');
    
    // Clean up cache periodically
    setInterval(() => this.cleanupCache(), 60000);
  }
  
  /**
   * Make a secure API call with full Trust Fabric attestation
   */
  async call<T>(
    serviceName: string,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<SecureResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    console.log(`🚀 Secure API call: ${serviceName}${endpoint} (${requestId})`);
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(serviceName, endpoint, options);
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        console.log(`💾 Cache hit: ${requestId}`);
        return {
          data: cached,
          metadata: {
            requestId,
            responseTime: Date.now() - startTime,
            service: serviceName,
            endpoint,
            attestationVerified: true,
            fromCache: true
          }
        };
      }
      
      // Deduplicate identical requests
      const dedupeKey = `${serviceName}:${endpoint}:${JSON.stringify(options.body || {})}`;
      const existingRequest = this.requestQueue.get(dedupeKey);
      if (existingRequest) {
        console.log(`🔄 Deduplicating request: ${requestId}`);
        return await existingRequest;
      }
      
      // Create new request promise
      const requestPromise = this.executeSecureCall<T>(
        serviceName,
        endpoint,
        options,
        requestId,
        startTime
      );
      
      this.requestQueue.set(dedupeKey, requestPromise);
      
      try {
        const result = await requestPromise;
        return result;
      } finally {
        this.requestQueue.delete(dedupeKey);
      }
      
    } catch (error) {
      console.error(`❌ Secure API call failed: ${requestId}`, error);
      throw error;
    }
  }
  
  private async executeSecureCall<T>(
    serviceName: string,
    endpoint: string,
    options: RequestOptions,
    requestId: string,
    startTime: number
  ): Promise<SecureResponse<T>> {
    return await this.circuitBreaker.execute(async () => {
      // Discover service location
      const serviceEndpoint = await this.serviceMesh.discoverService(serviceName);
      
      console.log(`🔍 Service discovered: ${serviceName} -> ${serviceEndpoint.url}`);
      
      // Execute with retries
      return await this.executeWithRetries<T>(
        serviceEndpoint,
        endpoint,
        options,
        requestId,
        startTime
      );
    }, `${serviceName}:${endpoint}`);
  }
  
  private async executeWithRetries<T>(
    serviceEndpoint: ServiceEndpoint,
    endpoint: string,
    options: RequestOptions,
    requestId: string,
    startTime: number
  ): Promise<SecureResponse<T>> {
    const maxRetries = options.retries ?? this.retryConfig.maxRetries;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
            this.retryConfig.maxDelay
          );
          
          console.log(`⏱️ Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
          await this.sleep(delay);
        }
        
        return await this.executeSingleRequest<T>(
          serviceEndpoint,
          endpoint,
          options,
          requestId,
          startTime
        );
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof AttestationError || 
            error instanceof CircuitBreakerError ||
            (error as any)?.status === 400 || // Bad Request
            (error as any)?.status === 401 || // Unauthorized
            (error as any)?.status === 403) { // Forbidden
          break;
        }
        
        console.warn(`⚠️ Request attempt ${attempt + 1} failed:`, error);
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }
  
  private async executeSingleRequest<T>(
    serviceEndpoint: ServiceEndpoint,
    endpoint: string,
    options: RequestOptions,
    requestId: string,
    startTime: number
  ): Promise<SecureResponse<T>> {
    // Generate Trust Fabric attestation
    const attestation = options.attestRequired !== false 
      ? await this.trustFabric.createAttestation(`${serviceEndpoint.name}:${endpoint}`)
      : null;
    
    // Build security envelope
    const securityEnvelope: SecurityEnvelope = {
      attestation: attestation!,
      payload: options.body,
      route: serviceEndpoint.route,
      requestId,
      timestamp: Date.now()
    };
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Service-Mesh-Route': serviceEndpoint.route,
      'X-Client-DID': this.trustFabric.getDID() || 'unknown',
      ...options.headers
    };
    
    if (attestation) {
      headers['X-Trust-Attestation'] = JSON.stringify(attestation);
      headers['X-Security-Envelope'] = JSON.stringify(securityEnvelope);
    }
    
    // Execute request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, options.timeout || 30000);
    
    try {
      const url = `${serviceEndpoint.url}${endpoint}`;
      
      console.log(`📡 HTTP ${options.method || 'GET'} ${url}`);
      
      // Filter out our custom properties for standard fetch
      const { timeout, retries, attestRequired, priority, ...fetchOptions } = options;
      
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
        body: options.body ? JSON.stringify(options.body) : fetchOptions.body
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Parse response
      const data = await response.json();
      
      // Verify response attestation if provided
      const responseAttestation = response.headers.get('X-Trust-Attestation');
      let attestationVerified = true;
      
      if (responseAttestation) {
        try {
          const parsedAttestation = JSON.parse(responseAttestation);
          attestationVerified = await this.trustFabric.verifyAttestation(parsedAttestation);
          
          if (!attestationVerified) {
            console.warn('⚠️ Response attestation verification failed');
          }
        } catch (error) {
          console.warn('Failed to verify response attestation:', error);
          attestationVerified = false;
        }
      }
      
      const result: SecureResponse<T> = {
        data,
        attestation: responseAttestation ? JSON.parse(responseAttestation) : undefined,
        metadata: {
          requestId,
          responseTime: Date.now() - startTime,
          service: serviceEndpoint.name,
          endpoint,
          attestationVerified,
          fromCache: false
        }
      };
      
      // Cache successful responses
      const cacheKey = this.generateCacheKey(serviceEndpoint.name, endpoint, options);
      this.addToCache(cacheKey, data);
      
      console.log(`✅ Secure API call completed: ${requestId} (${result.metadata.responseTime}ms)`);
      
      return result;
      
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Convenience methods for common HTTP operations
   */
  async get<T>(service: string, endpoint: string, options?: RequestOptions): Promise<SecureResponse<T>> {
    return this.call<T>(service, endpoint, { ...options, method: 'GET' });
  }
  
  async post<T>(service: string, endpoint: string, data: any, options?: RequestOptions): Promise<SecureResponse<T>> {
    return this.call<T>(service, endpoint, {
      ...options,
      method: 'POST',
      body: data
    });
  }
  
  async put<T>(service: string, endpoint: string, data: any, options?: RequestOptions): Promise<SecureResponse<T>> {
    return this.call<T>(service, endpoint, {
      ...options,
      method: 'PUT',
      body: data
    });
  }
  
  async delete<T>(service: string, endpoint: string, options?: RequestOptions): Promise<SecureResponse<T>> {
    return this.call<T>(service, endpoint, { ...options, method: 'DELETE' });
  }
  
  private generateRequestId(): string {
    return `tf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateCacheKey(service: string, endpoint: string, options: RequestOptions): string {
    const keyData = {
      service,
      endpoint,
      method: options.method || 'GET',
      body: options.body
    };
    
    return btoa(JSON.stringify(keyData));
  }
  
  private getFromCache<T>(key: string): T | null {
    const entry = this.responseCache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.data;
    }
    
    if (entry) {
      this.responseCache.delete(key);
    }
    
    return null;
  }
  
  private addToCache(key: string, data: any, ttlMs: number = 300000): void { // 5 minutes default
    this.responseCache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }
  
  private cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    // Convert to array to avoid iterator issues
    const entries = Array.from(this.responseCache.entries());
    for (const [key, entry] of entries) {
      if (entry.expiry <= now) {
        this.responseCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }
  
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Health and monitoring
   */
  public getHealth() {
    return {
      serviceMesh: this.serviceMesh.isReady(),
      trustFabric: this.trustFabric.isReady(),
      circuitBreaker: this.circuitBreaker.getStats(),
      cache: {
        size: this.responseCache.size,
        activeRequests: this.requestQueue.size
      }
    };
  }
  
  public clearCache(): void {
    this.responseCache.clear();
    console.log('🗑️ Response cache cleared');
  }

  // Fetch-compatible method for easier migration
  async fetchCompat<T>(service: string, endpoint: string, options?: RequestOptions): Promise<Response & { data?: T }> {
    try {
      const secureResponse = await this.get<T>(service, endpoint, options);
      
      // Create a fetch-compatible response
      const response = new Response(JSON.stringify(secureResponse.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }) as Response & { data?: T };
      
      // Add data property for direct access
      response.data = secureResponse.data;
      
      return response;
    } catch (error) {
      // Return error response
      const errorResponse = new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Request failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }) as Response & { data?: T };
      
      return errorResponse;
    }
  }
}

// Re-export for external use
export { CircuitBreakerError };
