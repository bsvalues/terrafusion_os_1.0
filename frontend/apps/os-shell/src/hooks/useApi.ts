import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useApi = <T>(endpoint: string) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      // This is a placeholder for future auth implementation
      const headers = {
        // 'Authorization': `Bearer ${your_auth_token}`
      };
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setState({ data, loading: false, error: null });
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.message || 'An unknown error occurred' });
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};
