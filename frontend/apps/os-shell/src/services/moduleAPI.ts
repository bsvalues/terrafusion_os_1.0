import axios from 'axios';

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';
import { createLogger } from '@/hooks/useLogger';

const logger = createLogger('moduleAPI');
const API_BASE_URL = getViteEnv().VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function describeRegistryFailure(action: string, error: unknown): Error {
  const reason = axios.isAxiosError(error) ? (error.message ?? 'request failed') : String(error);
  logger.warn(`Governed module registry ${action} failed:`, reason);
  return new Error(`Governed module registry unavailable. ${action} cannot continue without the live backend.`);
}

export const moduleAPI = {
  getAllModules: async () => {
    try {
      const response = await api.get('/modules');
      return response.data;
    } catch (error) {
      throw describeRegistryFailure('Desktop module catalog loading', error);
    }
  },

  getModuleById: async (id: number) => {
    try {
      const response = await api.get(`/modules/${id}`);
      return response.data;
    } catch (error) {
      throw describeRegistryFailure(`Module ${id} lookup`, error);
    }
  },

  getModuleByName: async (name: string) => {
    try {
      const response = await api.get(`/modules/by-name/${name}`);
      return response.data;
    } catch (error) {
      throw describeRegistryFailure(`Module ${name} lookup`, error);
    }
  },

  getModulesByTier: async (tier: string) => {
    try {
      const response = await api.get(`/modules/tier/${tier}`);
      return response.data;
    } catch (error) {
      throw describeRegistryFailure(`Module tier ${tier} lookup`, error);
    }
  },

  getActiveModules: async () => {
    try {
      const response = await api.get('/modules/active');
      return response.data;
    } catch (error) {
      throw describeRegistryFailure('Active module status loading', error);
    }
  },

  launchModule: async (id: number) => {
    try {
      const response = await api.post(`/modules/${id}/launch`);
      return response.data;
    } catch (error) {
      logger.warn('Backend not available; module launch blocked', error);
      throw new Error(
        `Module ${id} launch was not executed because the governed module runtime is unavailable.`,
      );
    }
  },

  stopModule: async (id: number) => {
    const response = await api.post(`/modules/${id}/stop`);
    return response.data;
  },

  getModuleHealth: async (id: number) => {
    const response = await api.get(`/modules/${id}/health`);
    return response.data;
  },

  createModule: async (moduleData: any) => {
    const response = await api.post('/modules', moduleData);
    return response.data;
  },

  updateModule: async (id: number, moduleData: any) => {
    const response = await api.put(`/modules/${id}`, moduleData);
    return response.data;
  },

  deleteModule: async (id: number) => {
    const response = await api.delete(`/modules/${id}`);
    return response.data;
  },
};
