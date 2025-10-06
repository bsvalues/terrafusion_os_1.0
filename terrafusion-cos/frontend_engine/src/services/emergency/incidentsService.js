/**
 * Emergency Incidents Service
 * Handles all incident-related API calls and WebSocket connections
 */

import { apiRequest, WebSocketClient, API_ENDPOINTS, WS_ENDPOINTS } from '../api';

/**
 * Fetch all incidents
 */
export const getIncidents = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = `${API_ENDPOINTS.EMERGENCY.INCIDENTS}${queryParams ? `?${queryParams}` : ''}`;
  return await apiRequest(endpoint);
};

/**
 * Fetch single incident by ID
 */
export const getIncidentById = async (id) => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.INCIDENTS}/${id}`);
};

/**
 * Create new incident
 */
export const createIncident = async (incidentData) => {
  return await apiRequest(API_ENDPOINTS.EMERGENCY.INCIDENTS, {
    method: 'POST',
    body: JSON.stringify(incidentData),
  });
};

/**
 * Update incident
 */
export const updateIncident = async (id, incidentData) => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.INCIDENTS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(incidentData),
  });
};

/**
 * Delete incident
 */
export const deleteIncident = async (id) => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.INCIDENTS}/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Get incident statistics
 */
export const getIncidentStats = async () => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.INCIDENTS}/stats`);
};

/**
 * WebSocket connection for real-time incident updates
 */
export class IncidentsWebSocket extends WebSocketClient {
  constructor() {
    super(WS_ENDPOINTS.EMERGENCY_INCIDENTS);
  }

  subscribeToIncidents(callback) {
    this.on('message', (data) => {
      if (data.type === 'incident_update') {
        callback(data.payload);
      }
    });
  }

  subscribeToStats(callback) {
    this.on('message', (data) => {
      if (data.type === 'stats_update') {
        callback(data.payload);
      }
    });
  }
}

export default {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  getIncidentStats,
  IncidentsWebSocket,
};
