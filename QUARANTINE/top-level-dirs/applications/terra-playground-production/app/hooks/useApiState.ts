import { useState, useCallback } from 'react';
import { useAuthState } from './useAuthState';
import { useErrorState } from './useErrorState';
import { useLoadingState } from './useLoadingState';
import { useNotificationState } from './useNotificationState';

interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export const useApiState = (config: ApiConfig) => {
  const { token } = useAuthState();
  const { setErrorState } = useErrorState();
  const { withLoading } = useLoadingState();
  const { error: notifyError } = useNotificationState();

  const request = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const url = `${config.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...config.headers,
      ...options.headers,
    };

    try {
      const response = await withLoading(
        () =>
          fetch(url, {
            ...options,
            headers,
            signal: config.timeout
              ? AbortSignal.timeout(config.timeout)
              : undefined,
          }),
        'Loading...'
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return {
        data,
        error: null,
        status: response.status,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API request failed';
      setErrorState(err);
      notifyError(errorMessage);
      return {
        data: null,
        error: errorMessage,
        status: 500,
      };
    }
  }, [config, token, withLoading, setErrorState, notifyError]);

  const get = useCallback(<T>(endpoint: string, options: RequestInit = {}) => {
    return request<T>(endpoint, { ...options, method: 'GET' });
  }, [request]);

  const post = useCallback(<T>(
    endpoint: string,
    data: unknown,
    options: RequestInit = {}
  ) => {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [request]);

  const put = useCallback(<T>(
    endpoint: string,
    data: unknown,
    options: RequestInit = {}
  ) => {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [request]);

  const patch = useCallback(<T>(
    endpoint: string,
    data: unknown,
    options: RequestInit = {}
  ) => {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }, [request]);

  const del = useCallback(<T>(endpoint: string, options: RequestInit = {}) => {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  }, [request]);

  return {
    request,
    get,
    post,
    put,
    patch,
    del,
  };
}; 