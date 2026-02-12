/**
 * Emergency Resources Service
 * Handles all resource-related API calls
 */

import { apiRequest, API_ENDPOINTS } from '../api';

/**
 * Fetch all resources (units, equipment, personnel)
 */
export const getResources = async () => {
  return await apiRequest(API_ENDPOINTS.EMERGENCY.RESOURCES);
};

/**
 * Fetch units (vehicles and response teams)
 */
export const getUnits = async () => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.RESOURCES}/units`);
};

/**
 * Fetch equipment inventory
 */
export const getEquipment = async () => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.RESOURCES}/equipment`);
};

/**
 * Fetch personnel status
 */
export const getPersonnel = async () => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.RESOURCES}/personnel`);
};

/**
 * Update unit status
 */
export const updateUnitStatus = async (unitId, status) => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.RESOURCES}/units/${unitId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

/**
 * Update equipment availability
 */
export const updateEquipment = async (equipmentId, data) => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.RESOURCES}/equipment/${equipmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Schedule maintenance
 */
export const scheduleMaintenance = async (resourceId, maintenanceData) => {
  return await apiRequest(`${API_ENDPOINTS.EMERGENCY.RESOURCES}/maintenance`, {
    method: 'POST',
    body: JSON.stringify({ resourceId, ...maintenanceData }),
  });
};

export default {
  getResources,
  getUnits,
  getEquipment,
  getPersonnel,
  updateUnitStatus,
  updateEquipment,
  scheduleMaintenance,
};
