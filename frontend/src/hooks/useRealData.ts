import { useState, useEffect, useCallback } from 'react';

import {
  realDataService,
  PropertyStats,
  DatabaseConnectionStatus,
  RealProperty,
  RealPermit,
  DatabaseHealth,
} from '../services/RealDataService';

export interface UseRealDataResult {
  // Connection Status
  connectionStatus: DatabaseConnectionStatus | null;
  isConnectionLoading: boolean;
  connectionError: string | null;

  // Property Stats
  propertyStats: PropertyStats | null;
  isStatsLoading: boolean;
  statsError: string | null;

  // Database Health
  databaseHealth: DatabaseHealth | null;
  isHealthLoading: boolean;
  healthError: string | null;

  // Methods
  refreshConnectionStatus: () => Promise<void>;
  refreshPropertyStats: () => Promise<void>;
  refreshDatabaseHealth: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useRealData = (
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
): UseRealDataResult => {
  // Connection Status State
  const [connectionStatus, setConnectionStatus] = useState<DatabaseConnectionStatus | null>(null);
  const [isConnectionLoading, setIsConnectionLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Property Stats State
  const [propertyStats, setPropertyStats] = useState<PropertyStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Database Health State
  const [databaseHealth, setDatabaseHealth] = useState<DatabaseHealth | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Refresh Connection Status
  const refreshConnectionStatus = useCallback(async () => {
    setIsConnectionLoading(true);
    setConnectionError(null);

    try {
      const status = await realDataService.getConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConnectionError(errorMessage);
      console.error('Failed to fetch connection status:', error);
    } finally {
      setIsConnectionLoading(false);
    }
  }, []);

  // Refresh Property Stats
  const refreshPropertyStats = useCallback(async () => {
    setIsStatsLoading(true);
    setStatsError(null);

    try {
      const stats = await realDataService.getPropertyStats();
      setPropertyStats(stats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatsError(errorMessage);
      console.error('Failed to fetch property stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Refresh Database Health
  const refreshDatabaseHealth = useCallback(async () => {
    setIsHealthLoading(true);
    setHealthError(null);

    try {
      const health = await realDataService.getDatabaseHealth();
      setDatabaseHealth(health);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setHealthError(errorMessage);
      console.error('Failed to fetch database health:', error);
    } finally {
      setIsHealthLoading(false);
    }
  }, []);

  // Refresh All Data
  const refreshAll = useCallback(async () => {
    await Promise.all([refreshConnectionStatus(), refreshPropertyStats(), refreshDatabaseHealth()]);
  }, [refreshConnectionStatus, refreshPropertyStats, refreshDatabaseHealth]);

  // Initial Load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto Refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAll();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshAll]);

  return {
    // Connection Status
    connectionStatus,
    isConnectionLoading,
    connectionError,

    // Property Stats
    propertyStats,
    isStatsLoading,
    statsError,

    // Database Health
    databaseHealth,
    isHealthLoading,
    healthError,

    // Methods
    refreshConnectionStatus,
    refreshPropertyStats,
    refreshDatabaseHealth,
    refreshAll,
  };
};

// Property Search Hook
export interface UsePropertySearchResult {
  properties: RealProperty[];
  isLoading: boolean;
  error: string | null;
  search: (query: string, page?: number, pageSize?: number) => Promise<void>;
  clearResults: () => void;
}

export const usePropertySearch = (): UsePropertySearchResult => {
  const [properties, setProperties] = useState<RealProperty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, page: number = 1, pageSize: number = 50) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await realDataService.getProperties(page, pageSize, query);
      setProperties(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
      console.error('Property search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setProperties([]);
    setError(null);
  }, []);

  return {
    properties,
    isLoading,
    error,
    search,
    clearResults,
  };
};

// Permits Hook
export interface UsePermitsResult {
  permits: RealPermit[];
  isLoading: boolean;
  error: string | null;
  loadPermits: (page?: number, pageSize?: number) => Promise<void>;
}

export const usePermits = (): UsePermitsResult => {
  const [permits, setPermits] = useState<RealPermit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPermits = useCallback(async (page: number = 1, pageSize: number = 50) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await realDataService.getPermits(page, pageSize);
      setPermits(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load permits';
      setError(errorMessage);
      console.error('Failed to load permits:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permits,
    isLoading,
    error,
    loadPermits,
  };
};
