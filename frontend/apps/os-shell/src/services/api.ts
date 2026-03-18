import { getViteEnv } from '@/env/getViteEnv';
import axios from 'axios';
import { getToken } from '@/auth/authStorage';
import { logout as authBridgeLogout, isLogoutInFlight } from '@/auth/authBridge';
import { shouldForceLoginRedirect } from '@/auth/authPolicy';
import { createLogger } from '@/hooks/useLogger';

const logger = createLogger('api');

const env = getViteEnv();
const API_BASE_URL =
  env.VITE_API_URL && env.VITE_API_URL.trim().length > 0 ? env.VITE_API_URL : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests (reads via authStorage bridge)
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('API Error:', error);
    if (error.response?.status === 401) {
      if (!shouldForceLoginRedirect()) {
        logger.warn('[dev-preview] Suppressed auto-logout on 401:', error.config?.url);
        return Promise.reject(error);
      }
      // Delegate to auth bridge — ensures single logout per burst
      if (!isLogoutInFlight()) {
        authBridgeLogout('unauthorized');
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403) {
      // 403 = Forbidden — do NOT logout, just warn
      logger.warn('Forbidden: insufficient permissions for', error.config?.url);
    }
    return Promise.reject(error);
  }
);

// Module API endpoints
export const moduleAPI = {
  getAllModules: async () => {
    const response = await api.get('/modules');
    return response.data;
  },

  getModuleByName: async (name: string) => {
    const response = await api.get(`/modules/${name}`);
    return response.data;
  },

  getModuleStatus: async (name: string) => {
    const response = await api.get(`/modules/${name}/status`);
    return response.data;
  },

  getActiveModules: async () => {
    const response = await api.get('/modules/active');
    return response.data;
  },

  refreshModules: async () => {
    const response = await api.post('/modules/refresh');
    return response.data;
  },
};

// AI Swarm API endpoints
export const swarmAPI = {
  getStatus: async () => {
    const response = await api.get('/swarm/status');
    return response.data;
  },

  getActiveModules: async () => {
    const response = await api.get('/swarm/modules');
    return response.data;
  },

  executeCommand: async (module: string, command: string, parameters?: any) => {
    const response = await api.post('/swarm/execute', {
      Module: module,
      Command: command,
      Parameters: parameters,
    });
    return response.data;
  },

  startModule: async (moduleName: string) => {
    const response = await api.post(`/swarm/modules/${moduleName}/start`);
    return response.data;
  },

  stopModule: async (moduleName: string) => {
    const response = await api.post(`/swarm/modules/${moduleName}/stop`);
    return response.data;
  },

  getMCPToolsStatus: async () => {
    const response = await api.get('/swarm/mcp-tools');
    return response.data;
  },
};

// Database API endpoints
export const databaseAPI = {
  getStatus: async () => {
    const response = await api.get('/database/status');
    return response.data;
  },

  initialize: async () => {
    const response = await api.post('/database/initialize');
    return response.data;
  },

  seedModules: async () => {
    const response = await api.post('/database/seed-modules');
    return response.data;
  },
};

// System health endpoints
export const systemAPI = {
  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Unified API object
export const terraFusionAPI = {
  modules: moduleAPI,
  swarm: swarmAPI,
  database: databaseAPI,
  system: systemAPI,
};

export default api;
