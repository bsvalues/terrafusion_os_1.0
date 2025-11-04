/**
 * TerraFusionPro - Service Health Monitor Component
 * Displays the current health status of all microservices
 */

import React, { useState, useEffect } from 'react';

/**
 * ServiceHealthMonitor Component
 * @param {Object} props - Component props
 * @param {Object[]} props.services - Array of service objects with health data
 * @param {function} props.onRefresh - Function to call when refresh is requested
 * @param {boolean} props.isLoading - Whether data is currently loading
 */
const ServiceHealthMonitor = ({ services = [], onRefresh = () => {}, isLoading = false }) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Update lastUpdated timestamp when services data changes
  useEffect(() => {
    if (services.length > 0 && !isLoading) {
      setLastUpdated(new Date());
    }
  }, [services, isLoading]);
  
  // Format the last updated timestamp
  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString();
  };
  
  // Calculate stats for the header
  const calculateStats = () => {
    return {
      total: services.length,
      healthy: services.filter(s => s.status === 'healthy').length,
      warning: services.filter(s => s.status === 'warning').length,
      error: services.filter(s => s.status === 'error').length
    };
  };
  
  const stats = calculateStats();
  
  // Handle refresh button click
  const handleRefresh = () => {
    onRefresh();
  };
  
  return (
    <div className="service-health-monitor">
      <div className="monitor-header">
        <h3 className="monitor-title">Service Health</h3>
        <div className="monitor-stats">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-item healthy">
            <span className="stat-label">Healthy:</span>
            <span className="stat-value">{stats.healthy}</span>
          </div>
          <div className="stat-item warning">
            <span className="stat-label">Warning:</span>
            <span className="stat-value">{stats.warning}</span>
          </div>
          <div className="stat-item error">
            <span className="stat-label">Error:</span>
            <span className="stat-value">{stats.error}</span>
          </div>
        </div>
        <div className="monitor-actions">
          <span className="last-updated">
            Last updated: {formatLastUpdated()}
          </span>
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <svg 
              viewBox="0 0 24 24" 
              width="16" 
              height="16" 
              stroke="currentColor" 
              fill="none" 
              strokeWidth="2"
              className={isLoading ? 'spinning' : ''}
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
      
      <div className="service-list">
        {isLoading ? (
          <div className="loading-indicator">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2" className="spinning">
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
            <span>Loading service health data...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="no-services">
            <p>No services available to monitor.</p>
          </div>
        ) : (
          <div className="service-grid">
            {services.map((service /* , index */) => (
              <ServiceCard key={index} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ServiceCard Component
 * Displays health information for a single service
 * @param {Object} props - Component props
 * @param {Object} props.service - Service data object
 */
const ServiceCard = ({ service }) => {
  const { name, status, description, port, lastChecked, responseTime, endpoint } = service;
  
  // Get status icon based on health status
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'warning':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        );
      case 'error':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
    }
  };
  
  // Format last checked time
  const formatLastChecked = () => {
    if (!lastChecked) return 'Never';
    
    // If it's a Date object, format it
    if (lastChecked instanceof Date) {
      return lastChecked.toLocaleTimeString();
    }
    
    // If it's a string timestamp, convert to Date and format
    try {
      return new Date(lastChecked).toLocaleTimeString();
    } catch (e) {
      return lastChecked;
    }
  };
  
  return (
    <div className={`service-card ${status}`}>
      <div className="service-header">
        <div className="service-status">
          {getStatusIcon()}
        </div>
        <div className="service-name">{name}</div>
      </div>
      
      <div className="service-details">
        {description && (
          <div className="service-description">
            {description}
          </div>
        )}
        
        <div className="service-meta">
          {port && (
            <div className="service-port">
              <span className="meta-label">Port:</span>
              <span className="meta-value">{port}</span>
            </div>
          )}
          
          {responseTime && (
            <div className="service-response-time">
              <span className="meta-label">Response:</span>
              <span className="meta-value">{responseTime}ms</span>
            </div>
          )}
          
          {endpoint && (
            <div className="service-endpoint">
              <span className="meta-label">Endpoint:</span>
              <span className="meta-value">{endpoint}</span>
            </div>
          )}
          
          <div className="service-last-checked">
            <span className="meta-label">Checked:</span>
            <span className="meta-value">{formatLastChecked()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceHealthMonitor;