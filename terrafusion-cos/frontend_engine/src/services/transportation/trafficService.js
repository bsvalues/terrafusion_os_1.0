/**
 * Transportation Traffic Service
 * Handles all traffic-related API calls and real-time updates
 */

import { apiRequest, WebSocketClient, API_ENDPOINTS, WS_ENDPOINTS } from '../api';

/**
 * Fetch traffic data
 */
export const getTrafficData = async (timeRange = '30min') => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRAFFIC}?timeRange=${timeRange}`);
};

/**
 * Fetch road segments
 */
export const getRoadSegments = async () => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRAFFIC}/segments`);
};

/**
 * Fetch traffic incidents
 */
export const getTrafficIncidents = async () => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRAFFIC}/incidents`);
};

/**
 * Report new traffic incident
 */
export const reportIncident = async (incidentData) => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRAFFIC}/incidents`, {
    method: 'POST',
    body: JSON.stringify(incidentData),
  });
};

/**
 * Update traffic incident
 */
export const updateIncident = async (incidentId, data) => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRAFFIC}/incidents/${incidentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Get traffic statistics
 */
export const getTrafficStats = async () => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRAFFIC}/stats`);
};

/**
 * WebSocket connection for real-time traffic updates
 */
export class TrafficWebSocket extends WebSocketClient {
  constructor() {
    super(WS_ENDPOINTS.TRAFFIC_FLOW);
  }

  subscribeToTrafficFlow(callback) {
    this.on('message', (data) => {
      if (data.type === 'traffic_update') {
        callback(data.payload);
      }
    });
  }

  subscribeToIncidents(callback) {
    this.on('message', (data) => {
      if (data.type === 'incident_update') {
        callback(data.payload);
      }
    });
  }
}

export default {
  getTrafficData,
  getRoadSegments,
  getTrafficIncidents,
  reportIncident,
  updateIncident,
  getTrafficStats,
  TrafficWebSocket,
};
