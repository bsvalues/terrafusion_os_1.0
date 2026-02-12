/**
 * TerraFusionPro - useFetch Hook
 * Custom hook for data fetching with built-in loading and error states
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for fetching data from API endpoints
 * @param {string} url - The API endpoint to fetch data from
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @param {boolean} immediate - Whether to fetch immediately on mount
 * @returns {Object} - Data, loading state, error, and refetch function
 */
const useFetch = (url, options = {}, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth() || {};
  const abortControllerRef = useRef(null);
  
  /**
   * Fetch data from the API
   * @param {Object} overrideOptions - Optional override for fetch options
   * @param {string} overrideUrl - Optional override for the URL
   * @returns {Promise<any>} - The fetch result
   */
  const fetchData = async (overrideOptions = {}, overrideUrl = null) => {
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      setError(null);
      
      // Combine default and override options
      const fetchOptions = {
        ...options,
        ...overrideOptions,
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          ...(overrideOptions.headers || {}),
        }
      };
      
      // Add auth token if available
      const token = localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken');
      if (token && !fetchOptions.headers.Authorization) {
        fetchOptions.headers.Authorization = `Bearer ${token}`;
      }
      
      // Perform the fetch
      const response = await fetch(overrideUrl || url, fetchOptions);
      
      // Handle non-success responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      
      // Parse and return the response
      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      // Don't set error state if aborted
      if (err.name !== 'AbortError') {
        setError(err.message || 'An unexpected error occurred');
        console.error('Fetch error:', err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
    
    // Cleanup: abort any in-flight requests when unmounting
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url]);
  
  return { data, loading, error, refetch: fetchData };
};

export default useFetch;