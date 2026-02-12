/**
 * Transportation Services Hooks
 * Custom React hooks for Smart Transportation Portal
 */

import { useState, useEffect, useCallback } from 'react';
import * as trafficService from '../services/transportation/trafficService';
import * as transitService from '../services/transportation/transitService';
import * as parkingService from '../services/transportation/parkingService';

/**
 * Hook for real-time traffic monitoring
 */
export const useTraffic = () => {
  const [trafficFlow, setTrafficFlow] = useState(null);
  const [roadSegments, setRoadSegments] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [flowRes, segmentsRes, incidentsRes] = await Promise.all([
        trafficService.getTrafficFlow(),
        trafficService.getRoadSegments(),
        trafficService.getIncidents(),
      ]);

      if (flowRes.success) setTrafficFlow(flowRes.data);
      if (segmentsRes.success) setRoadSegments(segmentsRes.data);
      if (incidentsRes.success) setIncidents(incidentsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const unsubscribe = trafficService.subscribeToTraffic((update) => {
      if (update.type === 'traffic.segment_update') {
        setRoadSegments(prev => 
          prev.map(segment => 
            segment.id === update.data.id ? update.data : segment
          )
        );
      } else if (update.type === 'traffic.incident_created') {
        setIncidents(prev => [update.data, ...prev]);
      } else if (update.type === 'traffic.incident_cleared') {
        setIncidents(prev => 
          prev.filter(incident => incident.id !== update.data.id)
        );
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      trafficService.unsubscribeFromTraffic();
    };
  }, [fetchData]);

  return {
    trafficFlow,
    roadSegments,
    incidents,
    loading,
    error,
    refetch: fetchData,
  };
};

/**
 * Hook for public transit tracking
 */
export const useTransit = () => {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [routesRes, busesRes, alertsRes] = await Promise.all([
        transitService.getRoutes(),
        transitService.getBuses(),
        transitService.getAlerts(),
      ]);

      if (routesRes.success) setRoutes(routesRes.data);
      if (busesRes.success) setBuses(busesRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const unsubscribe = transitService.subscribeToTransit((update) => {
      if (update.type === 'bus.position_update') {
        setBuses(prev => 
          prev.map(bus => 
            bus.id === update.data.id ? { ...bus, ...update.data } : bus
          )
        );
      } else if (update.type === 'route.status_changed') {
        setRoutes(prev => 
          prev.map(route => 
            route.id === update.data.id ? { ...route, ...update.data } : route
          )
        );
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      transitService.unsubscribeFromTransit();
    };
  }, [fetchData]);

  return {
    routes,
    buses,
    alerts,
    loading,
    error,
    refetch: fetchData,
  };
};

/**
 * Hook for parking facility management
 */
export const useParking = () => {
  const [facilities, setFacilities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [facilitiesRes, reservationsRes] = await Promise.all([
        parkingService.getFacilities(),
        parkingService.getReservations(),
      ]);

      if (facilitiesRes.success) setFacilities(facilitiesRes.data);
      if (reservationsRes.success) setReservations(reservationsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReservation = async (data) => {
    try {
      const result = await parkingService.createReservation(data);
      if (result.success) {
        setReservations(prev => [result.data, ...prev]);
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchData();

    const unsubscribe = parkingService.subscribeToParking((update) => {
      if (update.type === 'facility.occupancy_changed') {
        setFacilities(prev => 
          prev.map(facility => 
            facility.id === update.data.id ? update.data : facility
          )
        );
      } else if (update.type === 'reservation.created') {
        setReservations(prev => [update.data, ...prev]);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      parkingService.unsubscribeFromParking();
    };
  }, [fetchData]);

  return {
    facilities,
    reservations,
    loading,
    error,
    refetch: fetchData,
    createReservation,
  };
};
