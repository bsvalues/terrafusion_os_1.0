/**
 * TerraFusionPro - useMutation Hook
 * Custom hook for performing data mutations (POST, PUT, DELETE)
 */

import { useState } from 'react';
import { notifications } from '../components/layout/NotificationCenter';

/**
 * Custom hook for performing data mutations (POST, PUT, DELETE)
 * @param {string} url - The API endpoint for the mutation
 * @param {Object} options - Fetch options (method, headers, etc.)
 * @param {Object} notifications - Notification configuration
 * @returns {Object} - Mutation function, data, loading state, and error
 */
const useMutation = (
  url,
  options = {},
  notifications = { showSuccess: true, showError: true }
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Perform the mutation
   * @param {Object} payload - The data to send in the request body
   * @param {Object} overrideOptions - Optional override for fetch options
   * @param {string} overrideUrl - Optional override for the URL
   * @returns {Promise<any>} - The mutation result
   */
  const mutate = async (payload, overrideOptions = {}, overrideUrl = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine HTTP method (default to POST)
      const method = options.method || overrideOptions.method || 'POST';
      
      // Combine default and override options
      const fetchOptions = {
        method,
        ...options,
        ...overrideOptions,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          ...(overrideOptions.headers || {}),
        },
        body: JSON.stringify(payload)
      };
      
      // Add auth token if available
      const token = localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken');
      if (token && !fetchOptions.headers.Authorization) {
        fetchOptions.headers.Authorization = `Bearer ${token}`;
      }
      
      // Perform the mutation
      const response = await fetch(overrideUrl || url, fetchOptions);
      
      // Handle non-success responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      
      // Parse and store the response
      const result = await response.json();
      setData(result);
      
      // Show success notification if enabled
      if (notifications.showSuccess) {
        let successMessage = 'Operation completed successfully';
        
        // Customize message based on the HTTP method
        if (method === 'POST') {
          successMessage = notifications.successMessage || 'Item created successfully';
        } else if (method === 'PUT') {
          successMessage = notifications.successMessage || 'Item updated successfully';
        } else if (method === 'DELETE') {
          successMessage = notifications.successMessage || 'Item deleted successfully';
        }
        
        notifications.success(successMessage, {
          title: notifications.successTitle || 'Success',
          ...notifications.successOptions
        });
      }
      
      return result;
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Mutation error:', err);
      
      // Show error notification if enabled
      if (notifications.showError) {
        notifications.error(err.message || 'An unexpected error occurred', {
          title: notifications.errorTitle || 'Error',
          ...notifications.errorOptions
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { mutate, data, loading, error };
};

export default useMutation;