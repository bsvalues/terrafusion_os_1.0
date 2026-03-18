import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

import { moduleAPI } from '../services/moduleAPI';
import { useLogger } from '@/hooks/useLogger';

interface Module {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  tier: 'Tier1' | 'Tier2' | 'Tier3';
  status: 'active' | 'inactive' | 'loading' | 'error';
  version: string;
  iconPath?: string;
  launchPath?: string;
  isCore: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  lastLaunchedAt?: string;
}

export const useModules = () => {
  const queryClient = useQueryClient();
  const logger = useLogger('useModules');

  const {
    data: modules = [],
    isLoading,
    error,
  } = useQuery<Module[]>('modules', moduleAPI.getAllModules, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const launchModuleMutation = useMutation(
    (moduleId: string) => moduleAPI.launchModule(parseInt(moduleId)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('modules');
      },
    }
  );

  const stopModuleMutation = useMutation(
    (moduleId: string) => moduleAPI.stopModule(parseInt(moduleId)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('modules');
      },
    }
  );

  const loadModule = async (moduleId: string) => {
    try {
      await launchModuleMutation.mutateAsync(moduleId);
    } catch (error) {
      logger.error('Failed to launch module:', error);
      throw error;
    }
  };

  const unloadModule = async (moduleId: string) => {
    try {
      await stopModuleMutation.mutateAsync(moduleId);
    } catch (error) {
      logger.error('Failed to stop module:', error);
      throw error;
    }
  };

  const getModulesByTier = (tier: 'Tier1' | 'Tier2' | 'Tier3') => {
    return modules.filter((module) => module.tier === tier);
  };

  const getActiveModules = () => {
    return modules.filter((module) => module.status === 'active');
  };

  return {
    modules,
    isLoading,
    error,
    loadModule,
    unloadModule,
    getModulesByTier,
    getActiveModules,
    isLaunching: launchModuleMutation.isLoading,
    isStopping: stopModuleMutation.isLoading,
  };
};
