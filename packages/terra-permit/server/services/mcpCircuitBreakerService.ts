/**
 * MCP Circuit Breaker Service
 * 
 * An implementation of the circuit breaker pattern using the Model Content Protocol (MCP)
 * for standardized definitions and workflows.
 */

import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';
import fetch from 'node-fetch';
import {
  CircuitState,
  CircuitStateEnum,
  CircuitBreakerState,
  CircuitBreakerStateSchema,
  CircuitBreakerConfig,
  CircuitMetrics,
  CircuitEvent,
  CircuitEventType,
  CircuitEventTypeEnum,
  ExecuteCircuitRequest,
  CircuitBreakerResponse,
  CreateCircuitBreaker,
  ForceCircuitState,
  HealthCheckRequest
} from '@shared/mcp/schemas';
import { 
  createCircuitBreakerFDL,
  executeWithCircuitBreakerFDL,
  getCircuitBreakerStateFDL
} from '@shared/mcp/fdl';
import { healthCheckWorkflow } from '@shared/mcp/wdl';
import { log } from '../vite';

/**
 * Implementation of the Circuit Breaker pattern following MCP specifications
 */
export class MCPCircuitBreakerService {
  private circuits: Map<string, CircuitBreakerState> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  constructor() {
    log('MCP Circuit Breaker Service initialized', 'circuit-breaker');
  }
  
  /**
   * Creates a new circuit breaker for a service
   * Implements the createCircuitBreakerFDL function
   */
  public createCircuitBreaker(params: CreateCircuitBreaker): CircuitBreakerState {
    const { serviceName, config } = params;
    
    // Check if a circuit already exists for this service
    if (this.circuits.has(serviceName)) {
      throw new Error(`Circuit breaker already exists for service: ${serviceName}`);
    }
    
    // Create default config
    const defaultConfig: CircuitBreakerConfig = {
      name: serviceName,
      failureThreshold: 3,
      resetTimeout: 30000,
      halfOpenMaxRequests: 1,
      monitorInterval: 60000,
      healthCheckInterval: 5000
    };
    
    // Merge with provided config
    const finalConfig: CircuitBreakerConfig = {
      ...defaultConfig,
      ...(config || {})
    };
    
    // Validate config
    try {
      CircuitBreakerStateSchema.shape.config.parse(finalConfig);
    } catch (error) {
      throw new Error(`Invalid circuit breaker configuration: ${error}`);
    }
    
    // Create initial metrics
    const metrics: CircuitMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0
    };
    
    // Create the circuit breaker state
    const id = uuidv4();
    const circuitState: CircuitBreakerState = {
      id,
      serviceName,
      state: 'CLOSED' as CircuitState,
      config: finalConfig,
      metrics,
      lastStateChange: Date.now(),
      failureCount: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      isHealthy: true
    };
    
    // Store the circuit
    this.circuits.set(serviceName, circuitState);
    
    // Set up health check interval if specified
    if (finalConfig.healthCheckInterval && finalConfig.healthCheckEndpoint) {
      this.setupHealthCheck(serviceName, finalConfig.healthCheckInterval, finalConfig.healthCheckEndpoint);
    }
    
    // Emit created event
    this.emitEvent({
      id: uuidv4(),
      circuitId: id,
      serviceName,
      type: 'CREATED' as CircuitEventType,
      timestamp: Date.now()
    });
    
    log(`Created circuit breaker for service: ${serviceName}`, 'circuit-breaker');
    return circuitState;
  }
  
  /**
   * Executes a request through a circuit breaker with fallback mechanisms
   * Implements the executeWithCircuitBreakerFDL function
   */
  public async executeWithCircuitBreaker(params: ExecuteCircuitRequest): Promise<CircuitBreakerResponse> {
    const { serviceName, request, options = {} } = params;
    const startTime = Date.now();
    
    // Get the circuit breaker for this service
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      throw new Error(`No circuit breaker found for service: ${serviceName}`);
    }
    
    // Special test cases
    if (options.forceFail === true) {
      this.recordFailure(circuit, 'Forced failure');
      return this.createErrorResponse(circuit, 'Forced failure', 500, startTime);
    }
    
    if (options.forceSuccess === true) {
      // Force success always resets the circuit to CLOSED state
      this.resetCircuit(circuit, 'Forced success');
      return {
        success: true,
        data: { message: `${serviceName} service responded successfully (forced)` },
        statusCode: 200,
        circuitState: circuit.state,
        serviceName,
        responseTime: Date.now() - startTime,
        isFallback: false
      };
    }
    
    // Check if the circuit is open
    if (circuit.state === 'OPEN') {
      // Check if it's time to try again (enter half-open state)
      const timeInOpen = Date.now() - circuit.lastStateChange;
      if (timeInOpen >= circuit.config.resetTimeout) {
        this.transitionState(circuit, 'HALF_OPEN', 'Reset timeout elapsed');
      } else {
        // Circuit is open, fail fast
        return {
          success: false,
          error: `Circuit breaker for ${serviceName} is open`,
          statusCode: 503,
          circuitState: circuit.state,
          serviceName,
          responseTime: Date.now() - startTime,
          isFallback: true,
          retryAfter: Math.ceil((circuit.config.resetTimeout - timeInOpen) / 1000)
        };
      }
    }
    
    // If we're in half-open state, we only allow a limited number of requests through
    if (circuit.state === 'HALF_OPEN') {
      // In half-open state, we only allow one request at a time
      // This is a simplified implementation, in production you would want to
      // use a more sophisticated approach to ensure only N requests get through
      if (circuit.consecutiveSuccesses >= circuit.config.halfOpenMaxRequests) {
        return {
          success: false,
          error: `Circuit breaker for ${serviceName} is half-open, already testing`,
          statusCode: 503,
          circuitState: circuit.state,
          serviceName,
          responseTime: Date.now() - startTime,
          isFallback: true,
          retryAfter: 5 // Suggest trying again in 5 seconds
        };
      }
    }
    
    // At this point we're allowing the request through (circuit is CLOSED or HALF_OPEN)
    try {
      // Update metrics
      circuit.metrics.totalRequests++;
      
      // Execute the request
      const { method, url, headers, body, timeout } = request;
      const controller = new AbortController();
      const timeoutId = timeout 
        ? setTimeout(() => controller.abort(), timeout) 
        : null;
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Handle the response
      if (response.ok) {
        this.recordSuccess(circuit);
        
        // If we were in HALF_OPEN and got enough successes, transition to CLOSED
        if (circuit.state === 'HALF_OPEN' && 
            circuit.consecutiveSuccesses >= circuit.config.halfOpenMaxRequests) {
          this.transitionState(circuit, 'CLOSED', 'Consecutive success threshold reached');
        }
        
        let responseData;
        try {
          responseData = await response.json();
        } catch (e) {
          responseData = { message: 'Response could not be parsed as JSON' };
        }
        
        return {
          success: true,
          data: responseData,
          statusCode: response.status,
          circuitState: circuit.state,
          serviceName,
          responseTime: Date.now() - startTime,
          isFallback: false
        };
      } else {
        this.recordFailure(circuit, `HTTP error: ${response.status} ${response.statusText}`);
        return this.createErrorResponse(
          circuit, 
          `Request failed with status code ${response.status}`, 
          response.status,
          startTime
        );
      }
    } catch (error) {
      // Handle network errors, timeouts, etc.
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTimeout = errorMessage.includes('abort');
      
      if (isTimeout) {
        circuit.metrics.timeouts++;
        log(`Request to ${serviceName} timed out`, 'circuit-breaker');
      }
      
      this.recordFailure(circuit, errorMessage);
      return this.createErrorResponse(
        circuit, 
        `Request failed: ${errorMessage}`,
        isTimeout ? 408 : 500,
        startTime
      );
    }
  }
  
  /**
   * Gets the current state of a circuit breaker
   * Implements the getCircuitBreakerStateFDL function
   */
  public getCircuitState(serviceName: string): CircuitBreakerState {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      throw new Error(`No circuit breaker found for service: ${serviceName}`);
    }
    
    return { ...circuit };
  }
  
  /**
   * Gets all circuit breaker states
   */
  public getAllCircuitStates(): CircuitBreakerState[] {
    return Array.from(this.circuits.values());
  }
  
  /**
   * Forces a circuit into a specific state
   */
  public forceCircuitState(params: ForceCircuitState): CircuitBreakerState {
    const { serviceName, state, reason } = params;
    
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      throw new Error(`No circuit breaker found for service: ${serviceName}`);
    }
    
    this.transitionState(circuit, state, reason || 'Forced state change');
    return { ...circuit };
  }
  
  /**
   * Performs a health check on a service
   */
  public async performHealthCheck(params: HealthCheckRequest): Promise<{ isHealthy: boolean, details: any }> {
    const { serviceName, endpoint, timeout = 5000 } = params;
    
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      throw new Error(`No circuit breaker found for service: ${serviceName}`);
    }
    
    const healthCheckUrl = endpoint || circuit.config.healthCheckEndpoint;
    if (!healthCheckUrl) {
      throw new Error(`No health check endpoint specified for service: ${serviceName}`);
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const isHealthy = response.ok;
      let details;
      
      try {
        details = await response.json();
      } catch (e) {
        details = { status: response.status, statusText: response.statusText };
      }
      
      // Update circuit state based on health check
      if (isHealthy) {
        circuit.isHealthy = true;
        this.emitEvent({
          id: uuidv4(),
          circuitId: circuit.id,
          serviceName,
          type: 'HEALTH_CHECK_SUCCESS',
          timestamp: Date.now(),
          metadata: { details }
        });
      } else {
        circuit.isHealthy = false;
        this.emitEvent({
          id: uuidv4(),
          circuitId: circuit.id,
          serviceName,
          type: 'HEALTH_CHECK_FAILURE',
          timestamp: Date.now(),
          metadata: { details }
        });
      }
      
      return { isHealthy, details };
    } catch (error) {
      circuit.isHealthy = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.emitEvent({
        id: uuidv4(),
        circuitId: circuit.id,
        serviceName,
        type: 'HEALTH_CHECK_FAILURE',
        timestamp: Date.now(),
        error: errorMessage
      });
      
      return { 
        isHealthy: false, 
        details: { error: errorMessage } 
      };
    }
  }
  
  /**
   * Subscribes to circuit breaker events
   */
  public subscribe(serviceNames: string[] | null, eventTypes: CircuitEventType[] | null, callback: (event: CircuitEvent) => void): () => void {
    const handleEvent = (event: CircuitEvent) => {
      // Filter by service name if specified
      if (serviceNames && !serviceNames.includes(event.serviceName)) {
        return;
      }
      
      // Filter by event type if specified
      if (eventTypes && !eventTypes.includes(event.type)) {
        return;
      }
      
      // Call the callback
      callback(event);
    };
    
    this.eventEmitter.on('circuit-event', handleEvent);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off('circuit-event', handleEvent);
    };
  }
  
  /**
   * Resets all circuit breakers
   */
  public reset(): void {
    // Get all service names first
    const serviceNames = Array.from(this.circuits.keys());
    
    // Reset and remove each circuit breaker
    for (const serviceName of serviceNames) {
      this.resetService(serviceName);
    }
    
    // Make sure all maps are cleared
    this.circuits.clear();
    
    // Clear all health check intervals
    Array.from(this.healthCheckIntervals.entries()).forEach(([serviceName, interval]) => {
      clearInterval(interval);
    });
    this.healthCheckIntervals.clear();
    
    log('All circuit breakers completely removed', 'circuit-breaker');
  }
  
  /**
   * Deletes a circuit breaker entirely, removing it from the registry
   */
  public deleteCircuitBreaker(serviceName: string): void {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      // First reset the circuit to clear any event listeners
      this.resetCircuit(circuit, 'Circuit deleted');
      
      // Delete the circuit from the registry
      this.circuits.delete(serviceName);
      
      // Clear any health check intervals
      if (this.healthCheckIntervals.has(serviceName)) {
        clearInterval(this.healthCheckIntervals.get(serviceName));
        this.healthCheckIntervals.delete(serviceName);
      }
      
      log(`Circuit breaker for ${serviceName} completely deleted`, 'circuit-breaker');
      
      // Emit deletion event
      this.emitEvent({
        id: uuidv4(),
        circuitId: circuit.id,
        serviceName: circuit.serviceName,
        type: 'DELETED',
        timestamp: Date.now()
      });
    } else {
      log(`Circuit breaker for ${serviceName} not found for deletion`, 'circuit-breaker');
    }
  }
  
  /**
   * Resets a specific circuit breaker
   */
  public resetService(serviceName: string): void {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      this.resetCircuit(circuit, 'Service reset');
    } else {
      log(`Circuit breaker for ${serviceName} not found for reset`, 'circuit-breaker');
    }
  }
  
  // ===== Private helper methods =====
  
  /**
   * Records a successful request for a circuit
   */
  private recordSuccess(circuit: CircuitBreakerState): void {
    circuit.metrics.successfulRequests++;
    circuit.metrics.lastSuccessTime = Date.now();
    circuit.consecutiveSuccesses++;
    circuit.consecutiveFailures = 0;
    
    this.emitEvent({
      id: uuidv4(),
      circuitId: circuit.id,
      serviceName: circuit.serviceName,
      type: 'REQUEST_SUCCESS',
      timestamp: Date.now()
    });
  }
  
  /**
   * Records a failed request for a circuit
   */
  private recordFailure(circuit: CircuitBreakerState, error: string): void {
    circuit.metrics.failedRequests++;
    circuit.metrics.lastFailureTime = Date.now();
    circuit.failureCount++;
    circuit.consecutiveFailures++;
    circuit.consecutiveSuccesses = 0;
    circuit.lastError = error;
    
    this.emitEvent({
      id: uuidv4(),
      circuitId: circuit.id,
      serviceName: circuit.serviceName,
      type: 'REQUEST_FAILURE',
      timestamp: Date.now(),
      error
    });
    
    // Check if we need to open the circuit
    if (circuit.state === 'CLOSED' && 
        circuit.consecutiveFailures >= circuit.config.failureThreshold) {
      this.transitionState(circuit, 'OPEN', `Failure threshold reached (${circuit.consecutiveFailures} consecutive failures)`);
    }
  }
  
  /**
   * Transitions a circuit to a new state
   */
  private transitionState(circuit: CircuitBreakerState, newState: CircuitState, reason: string): void {
    if (circuit.state === newState) {
      return; // No change
    }
    
    const previousState = circuit.state;
    circuit.state = newState;
    circuit.lastStateChange = Date.now();
    
    // Reset counters appropriate to the new state
    if (newState === 'CLOSED') {
      circuit.consecutiveFailures = 0;
      circuit.failureCount = 0;
    } else if (newState === 'HALF_OPEN') {
      circuit.consecutiveSuccesses = 0;
    }
    
    // Log the transition
    log(`Circuit ${circuit.serviceName} transitioned from ${previousState} to ${newState}: ${reason}`, 'circuit-breaker');
    
    // Emit state change event
    this.emitEvent({
      id: uuidv4(),
      circuitId: circuit.id,
      serviceName: circuit.serviceName,
      type: 'STATE_CHANGED',
      timestamp: Date.now(),
      previousState,
      newState,
      metadata: { reason }
    });
  }
  
  /**
   * Creates a standardized error response
   */
  private createErrorResponse(
    circuit: CircuitBreakerState, 
    error: string, 
    statusCode: number,
    startTime: number
  ): CircuitBreakerResponse {
    return {
      success: false,
      error,
      statusCode,
      circuitState: circuit.state,
      serviceName: circuit.serviceName,
      responseTime: Date.now() - startTime,
      isFallback: false
    };
  }
  
  /**
   * Resets a circuit to closed state
   */
  private resetCircuit(circuit: CircuitBreakerState, reason: string): void {
    circuit.consecutiveFailures = 0;
    circuit.consecutiveSuccesses = 0;
    circuit.failureCount = 0;
    
    // If not already closed, transition
    if (circuit.state !== 'CLOSED') {
      this.transitionState(circuit, 'CLOSED', reason);
    }
    
    this.emitEvent({
      id: uuidv4(),
      circuitId: circuit.id,
      serviceName: circuit.serviceName,
      type: 'RESET',
      timestamp: Date.now(),
      metadata: { reason }
    });
    
    log(`Circuit breaker for ${circuit.serviceName} reset to closed state`, 'circuit-breaker');
  }
  
  /**
   * Sets up a recurring health check for a service
   */
  private setupHealthCheck(serviceName: string, interval: number, endpoint: string): void {
    // Clear any existing health check
    if (this.healthCheckIntervals.has(serviceName)) {
      clearInterval(this.healthCheckIntervals.get(serviceName));
    }
    
    // Set up a new health check interval
    const intervalId = setInterval(async () => {
      try {
        await this.performHealthCheck({ serviceName, endpoint });
      } catch (error) {
        log(`Health check error for ${serviceName}: ${error}`, 'circuit-breaker');
      }
    }, interval);
    
    // Store the interval ID
    this.healthCheckIntervals.set(serviceName, intervalId);
  }
  
  /**
   * Emits a circuit event
   */
  private emitEvent(event: CircuitEvent): void {
    this.eventEmitter.emit('circuit-event', event);
  }
  
  /**
   * Cleanup when shutting down
   */
  public dispose(): void {
    // Clear all health check intervals
    Array.from(this.healthCheckIntervals.values()).forEach(interval => {
      clearInterval(interval);
    });
    this.healthCheckIntervals.clear();
    
    // Remove all event listeners
    this.eventEmitter.removeAllListeners();
  }
}

// Create and export a singleton instance
export const mcpCircuitBreakerService = new MCPCircuitBreakerService();