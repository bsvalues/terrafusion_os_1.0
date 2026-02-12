/**
 * TerraFusionPro - Service Health Component
 * Displays health status of microservices in the platform
 */

import React, { useState, useEffect } from 'react';
import useFetch from '../../hooks/useFetch';

/**
 * ServiceHealth Component
 * @param {Object} props - Component props
 * @param {boolean} props.showDetails - Whether to show detailed status info
 * @param {boolean} props.autoRefresh - Whether to automatically refresh status
 * @param {number} props.refreshInterval - Refresh interval in milliseconds (default: 30000)
 */
const ServiceHealth = ({ 
  showDetails = false, 
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Use the useFetch hook to get health data
  const { 
    data: healthData, 
    loading, 
    error, 
    refetch: refreshHealth 
  } = useFetch('/api/health', {}, true);
  
  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      refreshHealth();
      setLastUpdated(new Date());
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, refreshHealth]);
  
  // Handle manual refresh
  const handleManualRefresh = () => {
    refreshHealth();
    setLastUpdated(new Date());
  };
  
  // Calculate overall health status
  const calculateOverallHealth = (services) => {
    if (!services || services.length === 0) return 'unknown';
    
    const totalServices = services.length;
    const healthyServices = services.filter(svc => svc.status === 'healthy').length;
    const degradedServices = services.filter(svc => svc.status === 'degraded').length;
    
    if (healthyServices === totalServices) {
      return 'healthy';
    } else if (healthyServices + degradedServices === totalServices) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  };
  
  // Get status class for styling
  const getStatusClass = (status) => {
    switch (status) {
      case 'healthy': 
        return 'status-healthy';
      case 'degraded': 
        return 'status-degraded';
      case 'unhealthy': 
        return 'status-unhealthy';
      default: 
        return 'status-unknown';
    }
  };
  
  // Format uptime in human-readable format
  const formatUptime = (uptimeSeconds) => {
    if (!uptimeSeconds) return 'Unknown';
    
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  // Display loading state
  if (loading && !healthData) {
    return (
      <div className="service-health loading">
        <div className="loading-indicator">
          Loading service health status...
        </div>
      </div>
    );
  }
  
  // Display error state
  if (error && !healthData) {
    return (
      <div className="service-health error">
        <div className="error-message">
          <p>Failed to load service health data</p>
          <button onClick={handleManualRefresh} className="refresh-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Default services if data not available
  const services = healthData?.services || [
    { id: 'api-gateway', name: 'API Gateway', status: 'unknown' },
    { id: 'user-service', name: 'User Service', status: 'unknown' },
    { id: 'property-service', name: 'Property Service', status: 'unknown' },
    { id: 'report-service', name: 'Report Service', status: 'unknown' },
    { id: 'form-service', name: 'Form Service', status: 'unknown' },
    { id: 'analysis-service', name: 'Analysis Service', status: 'unknown' }
  ];
  
  const overallStatus = calculateOverallHealth(services);
  const overallStatusClass = getStatusClass(overallStatus);
  
  return (
    <div className="service-health">
      <div className="health-header">
        <div className={`overall-status ${overallStatusClass}`}>
          <div className="status-indicator"></div>
          <div className="status-label">
            {overallStatus === 'healthy' ? 'All Systems Operational' : 
             overallStatus === 'degraded' ? 'Partial System Outage' :
             overallStatus === 'unhealthy' ? 'Major System Outage' :
             'System Status Unknown'}
          </div>
        </div>
        
        <div className="refresh-control">
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button 
            onClick={handleManualRefresh} 
            className="refresh-btn"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="services-list">
        {services.map(service => (
          <div key={service.id} className="service-item">
            <div className="service-info">
              <div className="service-name">{service.name}</div>
              <div className={`service-status ${getStatusClass(service.status)}`}>
                <div className="status-indicator"></div>
                <div className="status-label">
                  {service.status === 'healthy' ? 'Operational' :
                   service.status === 'degraded' ? 'Degraded' :
                   service.status === 'unhealthy' ? 'Outage' :
                   'Unknown'}
                </div>
              </div>
            </div>
            
            {showDetails && (
              <div className="service-details">
                <div className="detail-item">
                  <span className="detail-label">Uptime:</span>
                  <span className="detail-value">{formatUptime(service.uptime)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Response Time:</span>
                  <span className="detail-value">
                    {service.responseTime ? `${service.responseTime}ms` : 'Unknown'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Version:</span>
                  <span className="detail-value">{service.version || 'Unknown'}</span>
                </div>
                {service.lastIncident && (
                  <div className="detail-item incident">
                    <span className="detail-label">Last Incident:</span>
                    <span className="detail-value">{service.lastIncident}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="service-footer">
        <button 
          className="details-toggle"
          onClick={() => window.location.href = '/system/health'}
        >
          View Detailed Health Report
        </button>
      </div>
    </div>
  );
};

export default ServiceHealth;