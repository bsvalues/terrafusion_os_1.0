/**
 * useQuantumAnalyticsStatus Hook
 *
 * React hook for monitoring TerraFusion.QuantumAnalytics microservice health.
 * Polls the health endpoint and provides service status information.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

import { useState, useEffect } from 'react';
import { getViteEnv } from '../env/getViteEnv';

interface ServiceInfo {
  version: string;
  port: number;
  status: string;
  timestamp: string;
}

interface QuantumAnalyticsStatusReturn {
  isHealthy: boolean;
  isLoading: boolean;
  error: string | null;
  serviceInfo: ServiceInfo | null;
  lastChecked: Date | null;
}

/**
 * Hook to monitor QuantumAnalytics service health
 *
 * @param pollInterval - Polling interval in milliseconds (default: 10000ms)
 * @returns Service health status and information
 */
export function useQuantumAnalyticsStatus(
  pollInterval: number = 10000
): QuantumAnalyticsStatusReturn {
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Phase 1: Check if service is running on port 3005
        const analyticsBase = getViteEnv().VITE_ANALYTICS_URL || '';
        const response = await fetch(`${analyticsBase}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();

          setIsHealthy(true);
          setServiceInfo({
            version: data.version || '1.0.0',
            port: data.port || 3005,
            status: data.status || 'Healthy',
            timestamp: new Date().toISOString()
          });
          setLastChecked(new Date());
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err: any) {
        if (!isMounted) return;

        setIsHealthy(false);
        setError(err.message);
        setServiceInfo(null);
        setLastChecked(new Date());
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial check
    checkHealth();

    // Set up polling
    const intervalId = setInterval(checkHealth, pollInterval);

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [pollInterval]);

  return {
    isHealthy,
    isLoading,
    error,
    serviceInfo,
    lastChecked
  };
}

export default useQuantumAnalyticsStatus;
