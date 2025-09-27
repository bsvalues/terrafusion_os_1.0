import { useState, useEffect } from 'react';

import { fetchServices, ServicesResponse } from '../services/api';

interface UseServicesReturn {
  data: ServicesResponse | null;
  isLoading: boolean;
  error: string | null;
}

export const useServices = (): UseServicesReturn => {
  const [data, setData] = useState<ServicesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const servicesData = await fetchServices();
        setData(servicesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load services');
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  return { data, isLoading, error };
};
