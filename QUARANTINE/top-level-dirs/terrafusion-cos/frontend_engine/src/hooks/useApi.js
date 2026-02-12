/**
 * Custom React Hooks for API Data Fetching
 * Provides consistent patterns for loading states, error handling, and data management
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for fetching data
 */
export const useFetch = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};

/**
 * Hook for WebSocket connections
 */
export const useWebSocket = (WebSocketClass, onMessage) => {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const websocket = new WebSocketClass();
    
    websocket.on('open', () => {
      setConnected(true);
    });

    websocket.on('close', () => {
      setConnected(false);
    });

    websocket.on('message', (data) => {
      if (onMessage) {
        onMessage(data);
      }
    });

    websocket.connect();
    setWs(websocket);

    return () => {
      websocket.disconnect();
    };
  }, []);

  return { ws, connected };
};

/**
 * Hook for mutations (POST, PUT, DELETE)
 */
export const useMutation = (mutationFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mutationFunction(...args);
      if (result.success) {
        setData(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error, data };
};

/**
 * Hook for paginated data
 */
export const usePagination = (fetchFunction, initialPage = 1, pageSize = 10) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction({ page: pageNum, pageSize });
      if (result.success) {
        setData(result.data.items);
        setTotalPages(result.data.totalPages);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pageSize]);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum);
    }
  };

  return {
    data,
    page,
    totalPages,
    loading,
    error,
    nextPage,
    prevPage,
    goToPage,
  };
};

export default {
  useFetch,
  useWebSocket,
  useMutation,
  usePagination,
};
