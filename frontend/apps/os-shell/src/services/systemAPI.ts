import api from './api';

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
