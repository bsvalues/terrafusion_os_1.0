import axios from 'axios';

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';
const API_BASE_URL = getViteEnv().VITE_API_URL || 'http://localhost:5000/api';

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
