/**
 * Parks Events Service
 * Handles all event-related API calls
 */

import { apiRequest, API_ENDPOINTS } from '../api';

/**
 * Fetch all events
 */
export const getEvents = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = `${API_ENDPOINTS.PARKS.EVENTS}${queryParams ? `?${queryParams}` : ''}`;
  return await apiRequest(endpoint);
};

/**
 * Fetch event by ID
 */
export const getEventById = async (eventId) => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.EVENTS}/${eventId}`);
};

/**
 * Create new event
 */
export const createEvent = async (eventData) => {
  return await apiRequest(API_ENDPOINTS.PARKS.EVENTS, {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

/**
 * Update event
 */
export const updateEvent = async (eventId, data) => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.EVENTS}/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Cancel event
 */
export const cancelEvent = async (eventId) => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.EVENTS}/${eventId}/cancel`, {
    method: 'POST',
  });
};

/**
 * Get event registrations
 */
export const getEventRegistrations = async (eventId) => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.EVENTS}/${eventId}/registrations`);
};

/**
 * Register for event
 */
export const registerForEvent = async (eventId, registrationData) => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.EVENTS}/${eventId}/register`, {
    method: 'POST',
    body: JSON.stringify(registrationData),
  });
};

/**
 * Get event statistics
 */
export const getEventStats = async () => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.EVENTS}/stats`);
};

/**
 * Get event categories
 */
export const getEventCategories = async () => {
  return await apiRequest(`${API_ENDPOINTS.PARKS.EVENTS}/categories`);
};

export default {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  getEventRegistrations,
  registerForEvent,
  getEventStats,
  getEventCategories,
};
