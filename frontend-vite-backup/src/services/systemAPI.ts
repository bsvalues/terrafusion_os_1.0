// NO HARDCODED PORTS! Use environment variables.
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:${TF_STATIC_PORT:-8080}/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const systemAPI = {
  getSystemHealth: async () => {
    const response = await api.get('/system/health');
    return response.data;
  },

  getSystemStats: async () => {
    const response = await api.get('/system/stats');
    return response.data;
  },

  getSystemLogs: async (level?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (limit) params.append('limit', limit.toString());

    const response = await api.get(`/system/logs?${params}`);
    return response.data;
  },

  restartSystem: async () => {
    const response = await api.post('/system/restart');
    return response.data;
  },

  backupSystem: async () => {
    const response = await api.post('/system/backup');
    return response.data;
  },
};
