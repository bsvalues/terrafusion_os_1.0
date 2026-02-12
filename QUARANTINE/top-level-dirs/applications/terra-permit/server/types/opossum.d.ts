/**
 * Type declaration for the opossum circuit breaker library
 */
declare module 'opossum' {
  export interface CircuitBreakerOptions {
    timeout?: number;                 // Time in ms to wait for a response before timing out
    errorThresholdPercentage?: number; // Percentage of failures before opening the circuit
    resetTimeout?: number;            // Time in ms to wait before attempting to close the circuit
    rollingCountTimeout?: number;     // Time window in ms for error rate calculation
    rollingCountBuckets?: number;     // Number of buckets for the rolling window
    name?: string;                    // Name for the circuit
  }

  export interface Stats {
    latencyMean: number;
    latencyMax: number;  // Changed from 'max' to match usage
    latencyMin: number;  // Changed from 'min' to match usage
    percentiles: Record<string, number>;
    // Adding properties that are actually used in our service
    failures: number;
    fallbacks: number;
    successes: number;
    rejects: number;
    fires: number;
    timeouts: number;
  }

  export interface Status {
    // Add missing 'state' property
    state: 'closed' | 'open' | 'half-open';
    stats: Stats;
    errorPercentage: number;
  }

  export default class CircuitBreaker {
    constructor(action: Function, options?: CircuitBreakerOptions);
    
    fire(...args: any[]): Promise<any>;
    fallback(func: Function): CircuitBreaker;
    on(event: string, callback: (error?: any) => void): CircuitBreaker;
    status: Status;
    stats: Stats;
    name: string;
    group: string;
    enabled: boolean;
    pendingClose: boolean;
    closed: boolean;
    open: boolean;
    halfOpen: boolean;
    warmUp: boolean;
    volume: number;
    options: CircuitBreakerOptions;
    
    static isOurError(error: any): boolean;
    static get stats(): any;
    static executionTime: any;
    
    enable(): void;
    disable(): void;
    close(): void;
    open(): void;
    isOpen(): boolean;
    isClosed(): boolean;
  }
}