/**
 * Parks & Recreation Hooks
 * Custom React hooks for Parks & Recreation Portal
 */

import { useState, useEffect, useCallback } from 'react';
import * as facilitiesService from '../services/parks/facilitiesService';
import * as eventsService from '../services/parks/eventsService';

/**
 * Hook for parks facility management
 */
export const useFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await facilitiesService.getAllFacilities();
      if (result.success) {
        setFacilities(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFacility = async (id, data) => {
    try {
      const result = await facilitiesService.updateFacility(id, data);
      if (result.success) {
        setFacilities(prev => 
          prev.map(item => item.id === id ? result.data : item)
        );
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchFacilities();

    const unsubscribe = facilitiesService.subscribeToFacilities((update) => {
      if (update.type === 'facility.visitor_update') {
        setFacilities(prev => 
          prev.map(facility => 
            facility.id === update.data.id ? update.data : facility
          )
        );
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      facilitiesService.unsubscribeFromFacilities();
    };
  }, [fetchFacilities]);

  return {
    facilities,
    loading,
    error,
    refetch: fetchFacilities,
    updateFacility,
  };
};

/**
 * Hook for community events management
 */
export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await eventsService.getAllEvents();
      if (result.success) {
        setEvents(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = async (data) => {
    try {
      const result = await eventsService.createEvent(data);
      if (result.success) {
        setEvents(prev => [result.data, ...prev]);
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const registerForEvent = async (eventId, data) => {
    try {
      const result = await eventsService.createRegistration({ ...data, event_id: eventId });
      if (result.success) {
        // Update event registration count
        setEvents(prev => 
          prev.map(event => 
            event.id === eventId 
              ? { ...event, registrations: event.registrations + 1 }
              : event
          )
        );
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchEvents();

    const unsubscribe = eventsService.subscribeToEvents((update) => {
      if (update.type === 'event.registration_created') {
        setEvents(prev => 
          prev.map(event => 
            event.id === update.data.event_id 
              ? { ...event, registrations: event.registrations + 1 }
              : event
          )
        );
      } else if (update.type === 'event.created') {
        setEvents(prev => [update.data, ...prev]);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      eventsService.unsubscribeFromEvents();
    };
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    createEvent,
    registerForEvent,
  };
};
