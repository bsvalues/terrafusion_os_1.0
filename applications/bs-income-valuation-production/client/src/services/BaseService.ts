import { apiRequest } from '@/lib/queryClient';
import { getErrorMessage } from '@/lib/errorHandling';

/**
 * API Response types
 */
export interface ApiResponse<T> {
  ok: boolean;
  json: () => Promise<T>;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * Standard error response type 
 */
export interface ErrorResponse {
  error: string | {
    message: string;
    code?: string;
    type?: string;
    details?: Record<string, any>;
  };
  success?: boolean;
}

/**
 * Base service class for API interactions
 * Provides common utilities and error handling
 */
export abstract class BaseService {
  /**
   * Helper method to safely extract error message from response
   * 
   * @param responseData Data returned from API
   * @param defaultMessage Default message if error extraction fails
   * @returns Extracted error message or default message
   */
  protected static getErrorMessage(responseData: unknown, defaultMessage = 'Unknown error occurred'): string {
    return getErrorMessage(responseData, defaultMessage);
  }

  /**
   * Make a GET request to the API
   * 
   * @param endpoint API endpoint path
   * @param errorPrefix Prefix for error messages
   * @returns Parsed response data
   * @throws Error with formatted message if request fails
   */
  protected static async get<T>(endpoint: string, errorPrefix = 'Request failed'): Promise<T> {
    try {
      const response = await apiRequest<ApiResponse<T>>(endpoint, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${errorPrefix}: ${this.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      throw error;
    }
  }

  /**
   * Make a POST request to the API
   * 
   * @param endpoint API endpoint path
   * @param data Request payload
   * @param errorPrefix Prefix for error messages
   * @returns Parsed response data
   * @throws Error with formatted message if request fails
   */
  protected static async post<T, U = Record<string, any>>(
    endpoint: string, 
    data: U, 
    errorPrefix = 'Request failed'
  ): Promise<T> {
    try {
      const response = await apiRequest<ApiResponse<T>>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${errorPrefix}: ${this.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  }

  /**
   * Make a PATCH request to the API
   * 
   * @param endpoint API endpoint path
   * @param data Request payload
   * @param errorPrefix Prefix for error messages
   * @returns Parsed response data
   * @throws Error with formatted message if request fails
   */
  protected static async patch<T, U = Record<string, any>>(
    endpoint: string, 
    data: U, 
    errorPrefix = 'Request failed'
  ): Promise<T> {
    try {
      const response = await apiRequest<ApiResponse<T>>(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${errorPrefix}: ${this.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`PATCH ${endpoint} error:`, error);
      throw error;
    }
  }

  /**
   * Make a DELETE request to the API
   * 
   * @param endpoint API endpoint path
   * @param errorPrefix Prefix for error messages
   * @returns Parsed response data
   * @throws Error with formatted message if request fails
   */
  protected static async delete<T>(endpoint: string, errorPrefix = 'Request failed'): Promise<T> {
    try {
      const response = await apiRequest<ApiResponse<T>>(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${errorPrefix}: ${this.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error;
    }
  }

  /**
   * Make a request with file upload
   * 
   * @param endpoint API endpoint path
   * @param formData FormData object with files and other fields
   * @param method HTTP method (POST or PATCH)
   * @param errorPrefix Prefix for error messages
   * @returns Parsed response data
   * @throws Error with formatted message if request fails
   */
  protected static async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    method: 'POST' | 'PATCH' = 'POST',
    errorPrefix = 'Upload failed'
  ): Promise<T> {
    try {
      const response = await apiRequest<ApiResponse<T>>(endpoint, {
        method,
        body: formData,
        // Don't set Content-Type header, browser will set it with the boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${errorPrefix}: ${this.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`${method} ${endpoint} (file upload) error:`, error);
      throw error;
    }
  }
}