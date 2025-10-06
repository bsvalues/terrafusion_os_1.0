/**
 * Transportation Transit Service
 * Handles all public transit-related API calls and real-time tracking
 */

import { apiRequest, WebSocketClient, API_ENDPOINTS, WS_ENDPOINTS } from '../api';

/**
 * Fetch all transit routes
 */
export const getRoutes = async () => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRANSIT}/routes`);
};

/**
 * Fetch active buses
 */
export const getActiveBuses = async () => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRANSIT}/buses`);
};

/**
 * Fetch bus by ID
 */
export const getBusById = async (busId) => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRANSIT}/buses/${busId}`);
};

/**
 * Fetch transit alerts
 */
export const getTransitAlerts = async () => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRANSIT}/alerts`);
};

/**
 * Get route schedule
 */
export const getRouteSchedule = async (routeId) => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRANSIT}/routes/${routeId}/schedule`);
};

/**
 * Get transit statistics
 */
export const getTransitStats = async () => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRANSIT}/stats`);
};

/**
 * Update bus status
 */
export const updateBusStatus = async (busId, status) => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.TRANSIT}/buses/${busId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

/**
 * WebSocket connection for real-time transit tracking
 */
export class TransitWebSocket extends WebSocketClient {
  constructor() {
    super(WS_ENDPOINTS.TRANSIT_TRACKING);
  }

  subscribeToRoutes(callback) {
    this.on('message', (data) => {
      if (data.type === 'route_update') {
        callback(data.payload);
      }
    });
  }

  subscribeToBuses(callback) {
    this.on('message', (data) => {
      if (data.type === 'bus_location') {
        callback(data.payload);
      }
    });
  }

  subscribeToAlerts(callback) {
    this.on('message', (data) => {
      if (data.type === 'transit_alert') {
        callback(data.payload);
      }
    });
  }
}

export default {
  getRoutes,
  getActiveBuses,
  getBusById,
  getTransitAlerts,
  getRouteSchedule,
  getTransitStats,
  updateBusStatus,
  TransitWebSocket,
};
