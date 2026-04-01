/**
 * API Service
 * 
 * This service provides a wrapper for making external API requests
 * with built-in circuit breaker functionality for resilience.
 */

import { circuitBreakerService } from './circuitBreakerService';
import { log } from '../vite';
import fetch, { RequestInit, Response } from 'node-fetch';

interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiServiceOptions {
  baseUrl?: string;
  defaultTimeout?: number;
  defaultRetries?: number;
  defaultRetryDelay?: number;
  circuitBreakerOptions?: {
    enabled: boolean;
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
  };
}

export class ApiService {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;
  private circuitBreakerEnabled: boolean;
  private circuitBreakerOptions: any;
  
  constructor(options: ApiServiceOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.defaultTimeout = options.defaultTimeout || 30000;
    this.defaultRetries = options.defaultRetries || 3;
    this.defaultRetryDelay = options.defaultRetryDelay || 1000;
    this.circuitBreakerEnabled = options.circuitBreakerOptions?.enabled || false;
    this.circuitBreakerOptions = options.circuitBreakerOptions || {};
  }
  
  /**
   * Make an HTTP request with circuit breaker protection
   * @param url The URL to request
   * @param options Request options
   * @returns Promise with the response
   */
  async request<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const fullUrl = this.baseUrl ? `${this.baseUrl}${url}` : url;
    const timeout = options.timeout || this.defaultTimeout;
    const retries = options.retries ?? this.defaultRetries;
    const retryDelay = options.retryDelay || this.defaultRetryDelay;
    
    // Create a unique circuit breaker name based on the URL
    // Strip query params and use just the path
    const urlPath = new URL(fullUrl).pathname;
    const circuitName = `api-${urlPath.replace(/\//g, '-')}`;
    
    // If circuit breaker is enabled, use it to protect the request
    if (this.circuitBreakerEnabled) {
      return this.executeWithCircuitBreaker<T>(circuitName, fullUrl, options, timeout, retries, retryDelay);
    } else {
      // Otherwise, make a regular request with retry logic
      return this.executeWithRetry<T>(fullUrl, options, timeout, retries, retryDelay);
    }
  }
  
  /**
   * Make a GET request
   * @param url The URL to request
   * @param options Request options
   * @returns Promise with the response
   */
  async get<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }
  
  /**
   * Make a POST request
   * @param url The URL to request
   * @param body The request body
   * @param options Request options
   * @returns Promise with the response
   */
  async post<T>(url: string, body: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Make a PUT request
   * @param url The URL to request
   * @param body The request body
   * @param options Request options
   * @returns Promise with the response
   */
  async put<T>(url: string, body: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Make a PATCH request
   * @param url The URL to request
   * @param body The request body
   * @param options Request options
   * @returns Promise with the response
   */
  async patch<T>(url: string, body: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Make a DELETE request
   * @param url The URL to request
   * @param options Request options
   * @returns Promise with the response
   */
  async delete<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
  
  /**
   * Execute a request with circuit breaker protection
   */
  private async executeWithCircuitBreaker<T>(
    circuitName: string, 
    url: string, 
    options: ApiRequestOptions,
    timeout: number,
    retries: number,
    retryDelay: number
  ): Promise<T> {
    // Register the circuit breaker if it doesn't exist
    let breaker = circuitBreakerService.get(circuitName);
    
    if (!breaker) {
      breaker = circuitBreakerService.register(
        circuitName,
        async (requestOptions: { url: string, options: ApiRequestOptions }) => {
          return this.executeWithRetry<T>(requestOptions.url, requestOptions.options, timeout, retries, retryDelay);
        },
        this.circuitBreakerOptions
      );
    }
    
    try {
      // Execute the request through the circuit breaker
      return await circuitBreakerService.execute<{ url: string, options: ApiRequestOptions }, T>(
        circuitName,
        { url, options }
      );
    } catch (error: any) {
      if (error.message.includes('Circuit breaker') && error.message.includes('open')) {
        throw new Error(`Service unavailable: ${url} (circuit open)`);
      }
      throw error;
    }
  }
  
  /**
   * Execute a request with retry logic
   */
  private async executeWithRetry<T>(
    url: string, 
    options: ApiRequestOptions,
    timeout: number,
    retries: number,
    retryDelay: number
  ): Promise<T> {
    let lastError: Error;
    
    // Try to make the request with retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create a request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Make the request
        const response = await fetch(url, {
          ...options,
          signal: controller.signal as any
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Check if the response is successful
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
        }
        
        // Parse and return the response
        return await this.parseResponse<T>(response);
      } catch (error: any) {
        lastError = error;
        
        // Log the error
        log(`API request to ${url} failed (attempt ${attempt + 1}/${retries + 1}): ${error.message}`, 'apiService');
        
        // If this is not the last attempt, wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }
    
    // If we get here, all attempts failed
    throw lastError!;
  }
  
  /**
   * Parse the response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Explicitly casting to any first to avoid TypeScript's type checking restrictions
      // This is safe because we're expecting the caller to know the correct return type
      const data: any = await response.json();
      return data as T;
    } else if (contentType.includes('text/')) {
      return await response.text() as unknown as T;
    } else {
      // For other content types, return as buffer
      return await response.buffer() as unknown as T;
    }
  }
}

// Create a default instance
export const apiService = new ApiService({
  circuitBreakerOptions: {
    enabled: true,
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
  }
});