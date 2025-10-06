/**
 * Emergency Services Hooks
 * Custom React hooks for Emergency Management Portal
 */

import { useState, useEffect, useCallback } from 'react';
import * as incidentsService from '../services/emergency/incidentsService';
import * as resourcesService from '../services/emergency/resourcesService';
import * as alertsService from '../services/emergency/alertsService';

/**
 * Hook for managing incidents with real-time updates
 */
export const useIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all incidents
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await incidentsService.getAllIncidents();
      if (result.success) {
        setIncidents(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new incident
  const createIncident = async (data) => {
    try {
      const result = await incidentsService.createIncident(data);
      if (result.success) {
        setIncidents(prev => [result.data, ...prev]);
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update incident
  const updateIncident = async (id, data) => {
    try {
      const result = await incidentsService.updateIncident(id, data);
      if (result.success) {
        setIncidents(prev => 
          prev.map(item => item.id === id ? result.data : item)
        );
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Delete incident
  const deleteIncident = async (id) => {
    try {
      const result = await incidentsService.deleteIncident(id);
      if (result.success) {
        setIncidents(prev => prev.filter(item => item.id !== id));
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchIncidents();

    // Subscribe to WebSocket updates
    const unsubscribe = incidentsService.subscribeToIncidents((update) => {
      if (update.type === 'incident.created') {
        setIncidents(prev => [update.data, ...prev]);
      } else if (update.type === 'incident.updated') {
        setIncidents(prev => 
          prev.map(item => item.id === update.data.id ? update.data : item)
        );
      } else if (update.type === 'incident.deleted') {
        setIncidents(prev => prev.filter(item => item.id !== update.data.id));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      incidentsService.unsubscribeFromIncidents();
    };
  }, [fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    refetch: fetchIncidents,
    createIncident,
    updateIncident,
    deleteIncident,
  };
};

/**
 * Hook for managing resources with real-time tracking
 */
export const useResources = () => {
  const [resources, setResources] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [resourcesRes, equipmentRes, personnelRes] = await Promise.all([
        resourcesService.getAllResources(),
        resourcesService.getEquipment(),
        resourcesService.getPersonnel(),
      ]);

      if (resourcesRes.success) setResources(resourcesRes.data);
      if (equipmentRes.success) setEquipment(equipmentRes.data);
      if (personnelRes.success) setPersonnel(personnelRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateResource = async (id, data) => {
    try {
      const result = await resourcesService.updateResource(id, data);
      if (result.success) {
        setResources(prev => 
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
    fetchData();

    const unsubscribe = resourcesService.subscribeToResources((update) => {
      if (update.type === 'resource.updated') {
        setResources(prev => 
          prev.map(item => item.id === update.data.id ? update.data : item)
        );
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      resourcesService.unsubscribeFromResources();
    };
  }, [fetchData]);

  return {
    resources,
    equipment,
    personnel,
    loading,
    error,
    refetch: fetchData,
    updateResource,
  };
};

/**
 * Hook for managing alerts with real-time distribution
 */
export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [alertsRes, templatesRes, zonesRes] = await Promise.all([
        alertsService.getAllAlerts(),
        alertsService.getTemplates(),
        alertsService.getZones(),
      ]);

      if (alertsRes.success) setAlerts(alertsRes.data);
      if (templatesRes.success) setTemplates(templatesRes.data);
      if (zonesRes.success) setZones(zonesRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAlert = async (data) => {
    try {
      const result = await alertsService.createAlert(data);
      if (result.success) {
        setAlerts(prev => [result.data, ...prev]);
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchData();

    const unsubscribe = alertsService.subscribeToAlerts((update) => {
      if (update.type === 'alert.created') {
        setAlerts(prev => [update.data, ...prev]);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      alertsService.unsubscribeFromAlerts();
    };
  }, [fetchData]);

  return {
    alerts,
    templates,
    zones,
    loading,
    error,
    refetch: fetchData,
    createAlert,
  };
};
