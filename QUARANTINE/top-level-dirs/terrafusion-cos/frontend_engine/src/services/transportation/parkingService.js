/**
 * Transportation Parking Service
 * Handles all parking-related API calls and real-time occupancy updates
 */

import { apiRequest, WebSocketClient, API_ENDPOINTS, WS_ENDPOINTS } from '../api';

/**
 * Fetch all parking facilities
 */
export const getFacilities = async () => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.PARKING}/facilities`);
};

/**
 * Fetch facility by ID
 */
export const getFacilityById = async (facilityId) => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.PARKING}/facilities/${facilityId}`);
};

/**
 * Fetch parking reservations
 */
export const getReservations = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = `${API_ENDPOINTS.TRANSPORTATION.PARKING}/reservations${queryParams ? `?${queryParams}` : ''}`;
  return await apiRequest(endpoint);
};

/**
 * Create parking reservation
 */
export const createReservation = async (reservationData) => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.PARKING}/reservations`, {
    method: 'POST',
    body: JSON.stringify(reservationData),
  });
};

/**
 * Update reservation
 */
export const updateReservation = async (reservationId, data) => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.PARKING}/reservations/${reservationId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Cancel reservation
 */
export const cancelReservation = async (reservationId) => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.PARKING}/reservations/${reservationId}`, {
    method: 'DELETE',
  });
};

/**
 * Get parking statistics
 */
export const getParkingStats = async () => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.PARKING}/stats`);
};

/**
 * Check availability
 */
export const checkAvailability = async (facilityId, dateTime) => {
  return await apiRequest(`${API_ENDPOINTS.TRANSPORTATION.PARKING}/facilities/${facilityId}/availability`, {
    method: 'POST',
    body: JSON.stringify({ dateTime }),
  });
};

/**
 * WebSocket connection for real-time parking occupancy
 */
export class ParkingWebSocket extends WebSocketClient {
  constructor() {
    super(WS_ENDPOINTS.PARKING_OCCUPANCY);
  }

  subscribeToOccupancy(callback) {
    this.on('message', (data) => {
      if (data.type === 'occupancy_update') {
        callback(data.payload);
      }
    });
  }

  subscribeToReservations(callback) {
    this.on('message', (data) => {
      if (data.type === 'reservation_update') {
        callback(data.payload);
      }
    });
  }
}

export default {
  getFacilities,
  getFacilityById,
  getReservations,
  createReservation,
  updateReservation,
  cancelReservation,
  getParkingStats,
  checkAvailability,
  ParkingWebSocket,
};
