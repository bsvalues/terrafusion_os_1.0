/**
 * Parks Facilities Service
 * Handles all facility-related API calls
 */

import { apiRequest, API_ENDPOINTS } from '../api';

/**
 * Fetch all facilities
 */
export const getFacilities = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = `${API_ENDPOINTS.PARKS.FACILITIES}${queryParams ? `?${queryParams}` : ''}`;
  return await apiRequest(endpoint);
};

/**
 * Fetch facility by ID
 */
export const getFacilityById = async (facilityId) => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.FACILITIES}/${facilityId}`);
};

/**
 * Create new facility
 */
export const createFacility = async (facilityData) => {
  return await apiRequest(API_ENDPOINTS.PARKS.FACILITIES, {
    method: 'POST',
    body: JSON.stringify(facilityData),
  });
};

/**
 * Update facility
 */
export const updateFacility = async (facilityId, data) => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.FACILITIES}/${facilityId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Update facility status
 */
export const updateFacilityStatus = async (facilityId, status) => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.FACILITIES}/${facilityId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

/**
 * Get facility statistics
 */
export const getFacilityStats = async () => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.FACILITIES}/stats`);
};

/**
 * Get visitor count
 */
export const getVisitorCount = async (facilityId, dateRange) => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.FACILITIES}/${facilityId}/visitors`, {
    method: 'POST',
    body: JSON.stringify({ dateRange }),
  });
};

export default {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  updateFacilityStatus,
  getFacilityStats,
  getVisitorCount,
};
