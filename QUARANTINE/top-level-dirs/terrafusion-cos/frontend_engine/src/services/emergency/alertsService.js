/**
 * Emergency Alerts Service
 * Handles all alert-related API calls
 */

import { apiRequest, API_ENDPOINTS } from '../api';

/**
 * Fetch all active alerts
 */
export const getAlerts = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = `${API_ENDPOINTS.EMERGENCY.ALERTS}${queryParams ? `?${queryParams}` : ''}`;
  return await apiRequest(endpoint);
};

/**
 * Fetch alert templates
 */
export const getAlertTemplates = async () => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.ALERTS}/templates`);
};

/**
 * Fetch distribution zones
 */
export const getDistributionZones = async () => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.ALERTS}/zones`);
};

/**
 * Create new alert
 */
export const createAlert = async (alertData) => {
  return await apiRequest(API_ENDPOINTS.EMERGENCY.ALERTS, {
    method: 'POST',
    body: JSON.stringify(alertData),
  });
};

/**
 * Update alert
 */
export const updateAlert = async (alertId, alertData) => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.ALERTS}/${alertId}`, {
    method: 'PUT',
    body: JSON.stringify(alertData),
  });
};

/**
 * Cancel alert
 */
export const cancelAlert = async (alertId) => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.ALERTS}/${alertId}/cancel`, {
    method: 'POST',
  });
};

/**
 * Get alert statistics
 */
export const getAlertStats = async () => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.ALERTS}/stats`);
};

/**
 * Subscribe user to zone
 */
export const subscribeToZone = async (userId, zoneId) => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.ALERTS}/zones/${zoneId}/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

export default {
  getAlerts,
  getAlertTemplates,
  getDistributionZones,
  createAlert,
  updateAlert,
  cancelAlert,
  getAlertStats,
  subscribeToZone,
};
