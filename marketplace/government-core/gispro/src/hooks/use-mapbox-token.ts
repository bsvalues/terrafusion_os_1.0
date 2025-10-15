import { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to get and manage Mapbox access token
 * 
 * This hook will:
 * 1. Try to get the token from local storage first
 * 2. If not available, fetch from API endpoint
 * 3. Manage loading and error states
 */
export function useMapboxToken() {
  const [localToken, setLocalToken] = useState<string | null>(null);

  // Try to get token from localStorage on initial render
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('mapbox_token');
      if (storedToken) {
        console.log('Found mapbox token in localStorage');
        setLocalToken(storedToken);
        mapboxgl.accessToken = storedToken;
      } else {
        console.info('Mapbox token not found in cached sources, will need to fetch from API');
      }
    } catch (err) {
      console.warn('Error accessing localStorage:', err);
    }
  }, []);

  // Fetch token from API if not found in localStorage
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['mapbox-token'],
    queryFn: async () => {
      console.log('Fetching Mapbox token from API...');
      try {
        const response = await fetch('/api/mapbox-token', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch Mapbox token:', errorText);
          throw new Error(`API response not OK: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.token) {
          console.error('Mapbox token not found in API response');
          throw new Error('Mapbox token not found in API response');
        }
        
        console.log('Successfully retrieved Mapbox token from API');
        return data.token;
      } catch (err: unknown) {
        console.error('Error in Mapbox token fetch:', err);
        throw err;
      }
    },
    enabled: !localToken, // Only run query if we don't have a token from localStorage
    retry: 3,
    retryDelay: 1000
  });
  
  // Handle successful token retrieval
  useEffect(() => {
    if (data) {
      console.log('Setting Mapbox token from API response');
      
      // Set the token in mapboxgl directly
      mapboxgl.accessToken = data;
      
      // Store in localStorage for future use
      try {
        localStorage.setItem('mapbox_token', data);
      } catch (err: unknown) {
        console.warn('Could not store Mapbox token in localStorage:', err);
      }
      
      setLocalToken(data);
    }
  }, [data]);

  // The token to return is either from localStorage or the API
  const token = localToken || data || '';

  // Set token globally when it changes
  useEffect(() => {
    if (token) {
      console.log('Setting global Mapbox token');
      mapboxgl.accessToken = token;
    }
  }, [token]);

  return { 
    token, 
    isLoading, 
    error: isError ? error : null 
  };
}

export default useMapboxToken;