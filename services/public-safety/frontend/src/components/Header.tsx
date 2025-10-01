import React, { useState, useEffect } from 'react';
import './Header.css';

interface HeaderProps {
  onEmergencyAlert?: () => void;
  onSyncData?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onEmergencyAlert, onSyncData }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState({
    operational: true,
    responseTime: 4.2,
    unitsAvailable: 23,
    emergencyLevel: 'normal'
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate system status updates
  useEffect(() => {
    const statusTimer = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        responseTime: Math.max(3.0, Math.min(8.0, prev.responseTime + (Math.random() - 0.5) * 0.5)),
        unitsAvailable: Math.max(15, Math.min(35, prev.unitsAvailable + Math.floor((Math.random() - 0.5) * 3)))
      }));
    }, 10000);

    return () => clearInterval(statusTimer);
  }, []);

  const handleEmergencyAlert = () => {
    if (onEmergencyAlert) {
      onEmergencyAlert();
    }
    // Trigger emergency alert procedures
    console.log('Emergency Alert Activated');
  };

  const handleSyncData = () => {
    if (onSyncData) {
      onSyncData();
    }
    // Trigger data synchronization
    console.log('Data Sync Initiated');
  };

  return (
    <header className="public-safety-header">
      {/* Government Authority Banner */}
      <div className="government-banner">
        <div className="banner-content">
          <div className="government-seal">
            <div className="seal-icon">🚔</div>
            <div className="government-info">
              <div className="government-title">Benton County Public Safety & Law Enforcement</div>
              <div className="government-classification">Official Use Only - Law Enforcement Sensitive</div>
            </div>
          </div>
          
          <div className="law-enforcement-badges">
            <div className="authority-badge sheriff-office">
              <div className="badge-icon">🛡️</div>
              <div className="badge-info">
                <div className="badge-title">Sheriff's Office</div>
                <div className="badge-status">89 Officers</div>
              </div>
            </div>
            
            <div className="authority-badge police-departments">
              <div className="badge-icon">👮</div>
              <div className="badge-info">
                <div className="badge-title">Police Depts</div>
                <div className="badge-status">162 Officers</div>
              </div>
            </div>
            
            <div className="authority-badge fire-ems">
              <div className="badge-icon">🚒</div>
              <div className="badge-info">
                <div className="badge-title">Fire & EMS</div>
                <div className="badge-status">312 Personnel</div>
              </div>
            </div>
            
            <div className="authority-badge dispatch-center">
              <div className="badge-icon">📡</div>
              <div className="badge-info">
                <div className="badge-title">911 Dispatch</div>
                <div className="badge-status">24 Dispatchers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="main-header">
        <div className="header-left">
          <div className="terrafusion-logo">
            <div className="logo-icon">🚔</div>
            <div className="logo-text">
              <h1 className="service-title">Public Safety Command</h1>
              <p className="service-subtitle">Advanced Law Enforcement & Emergency Response</p>
            </div>
          </div>
          
          <div className="safety-status-indicator">
            <div className={`status-light ${systemStatus.operational ? 'operational' : 'alert'}`}></div>
            <div className="status-info">
              <div className="status-label">System Status</div>
              <div className="status-value">{systemStatus.operational ? 'Operational' : 'Alert'}</div>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="safety-metrics">
            <div className="metric">
              <div className="metric-value">{systemStatus.responseTime.toFixed(1)}m</div>
              <div className="metric-label">Avg Response</div>
            </div>
            <div className="metric">
              <div className="metric-value">{systemStatus.unitsAvailable}</div>
              <div className="metric-label">Units Available</div>
            </div>
            <div className="metric">
              <div className="metric-value">206,847</div>
              <div className="metric-label">Population</div>
            </div>
            <div className="metric">
              <div className="metric-value">1,703</div>
              <div className="metric-label">Sq Miles</div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="emergency-controls">
            <button 
              className="emergency-alert"
              onClick={handleEmergencyAlert}
              title="Activate Emergency Alert"
            >
              <span className="button-icon">🚨</span>
              Emergency Alert
            </button>
            
            <div className="system-status">
              <div className={`status-indicator ${systemStatus.operational ? 'operational' : 'alert'}`}>
                <div className="status-dot"></div>
                <span>{systemStatus.emergencyLevel.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="safety-navigation">
        <div className="nav-container">
          <div className="nav-tabs">
            <button className="nav-tab active">
              <span className="tab-icon">🏠</span>
              <span className="tab-label">Command Center</span>
            </button>
            <button className="nav-tab">
              <span className="tab-icon">📞</span>
              <span className="tab-label">911 Dispatch</span>
            </button>
            <button className="nav-tab">
              <span className="tab-icon">👮</span>
              <span className="tab-label">Officers</span>
            </button>
            <button className="nav-tab">
              <span className="tab-icon">📋</span>
              <span className="tab-label">Incidents</span>
            </button>
            <button className="nav-tab">
              <span className="tab-icon">🔍</span>
              <span className="tab-label">Investigations</span>
            </button>
            <button className="nav-tab">
              <span className="tab-icon">🚒</span>
              <span className="tab-label">Fire & EMS</span>
            </button>
            <button className="nav-tab">
              <span className="tab-icon">📊</span>
              <span className="tab-label">Analytics</span>
            </button>
            <button className="nav-tab">
              <span className="tab-icon">⚙️</span>
              <span className="tab-label">Admin</span>
            </button>
          </div>
          
          <div className="nav-status">
            <div className="readiness-indicator">
              <div className="readiness-bar">
                <div className="readiness-fill" style={{ width: '94%' }}></div>
              </div>
              <div className="readiness-text">94% Ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="quick-actions-bar">
        <div className="actions-container">
          <div className="action-group">
            <span className="group-label">Emergency</span>
            <button className="quick-action emergency">
              <span className="action-icon">🚨</span>
              Mass Alert
            </button>
            <button className="quick-action emergency">
              <span className="action-icon">📢</span>
              Public Notice
            </button>
          </div>
          
          <div className="action-group">
            <span className="group-label">Dispatch</span>
            <button className="quick-action">
              <span className="action-icon">🚓</span>
              Patrol Unit
            </button>
            <button className="quick-action">
              <span className="action-icon">🚒</span>
              Fire/EMS
            </button>
            <button className="quick-action">
              <span className="action-icon">🚁</span>
              Air Support
            </button>
          </div>
          
          <div className="action-group">
            <span className="group-label">Resources</span>
            <button className="quick-action">
              <span className="action-icon">🗺️</span>
              Map View
            </button>
            <button className="quick-action">
              <span className="action-icon">📱</span>
              Mobile Units
            </button>
          </div>
          
          <div className="safety-time">
            <div className="time-display">
              <div className="current-time">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              <div className="time-zone">PST</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;