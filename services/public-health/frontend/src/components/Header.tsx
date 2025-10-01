import React from 'react';
import './Header.css';

interface HeaderProps {
  onTabChange: (tab: string) => void;
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ onTabChange, activeTab }) => {
  const tabs = [
    { id: 'overview', label: 'Health Overview', icon: '🏥' },
    { id: 'facilities', label: 'Health Facilities', icon: '🏨' },
    { id: 'programs', label: 'Health Programs', icon: '📋' },
    { id: 'cases', label: 'Social Services', icon: '👥' },
    { id: 'alerts', label: 'Health Alerts', icon: '🚨' },
    { id: 'surveillance', label: 'Disease Surveillance', icon: '🔬' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <header className="public-health-header">
      {/* Government Authority Banner */}
      <div className="government-banner">
        <div className="banner-content">
          <div className="government-seal">
            <span className="seal-icon">🏛️</span>
            <div className="government-info">
              <div className="government-title">Official U.S. Government System</div>
              <div className="government-classification">Public Health Services | Benton County, Washington</div>
            </div>
          </div>
          
          <div className="health-authority-badges">
            <div className="authority-badge health-district">
              <span className="badge-icon">🏥</span>
              <div className="badge-info">
                <div className="badge-title">Benton Franklin</div>
                <div className="badge-status">Health District</div>
              </div>
            </div>
            
            <div className="authority-badge population-served">
              <span className="badge-icon">👥</span>
              <div className="badge-info">
                <div className="badge-title">Population</div>
                <div className="badge-status">206,873</div>
              </div>
            </div>
            
            <div className="authority-badge emergency-ready">
              <span className="badge-icon">🚑</span>
              <div className="badge-info">
                <div className="badge-title">Emergency</div>
                <div className="badge-status">Ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Header */}
      <div className="main-header">
        <div className="header-left">
          <div className="terrafusion-logo">
            <div className="logo-icon">🌍</div>
            <div className="logo-text">
              <h1 className="service-title">TerraFusion</h1>
              <div className="service-subtitle">Public Health Services</div>
            </div>
          </div>
          
          <div className="health-status-indicator">
            <div className="status-light health-operational"></div>
            <div className="status-info">
              <div className="status-label">Public Health</div>
              <div className="status-value">OPERATIONAL</div>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="health-metrics">
            <div className="metric">
              <div className="metric-value">12</div>
              <div className="metric-label">Health Facilities</div>
            </div>
            <div className="metric">
              <div className="metric-value">5</div>
              <div className="metric-label">Active Programs</div>
            </div>
            <div className="metric">
              <div className="metric-value">3</div>
              <div className="metric-label">Active Cases</div>
            </div>
            <div className="metric">
              <div className="metric-value">1</div>
              <div className="metric-label">Health Alerts</div>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="health-emergency-controls">
            <button className="emergency-alert" title="Issue Health Alert">
              <span className="button-icon">🚨</span>
              <span className="button-text">HEALTH ALERT</span>
            </button>
            
            <div className="system-status">
              <div className="status-indicator operational">
                <div className="status-dot"></div>
                <span>All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <nav className="health-navigation">
        <div className="nav-container">
          <div className="nav-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className="nav-status">
            <div className="health-level-indicator">
              <div className="level-bar">
                <div className="level-fill" style={{ width: '94.2%' }}></div>
              </div>
              <span className="level-text">Health Score: 94.2%</span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Quick Health Actions */}
      <div className="quick-actions-bar">
        <div className="actions-container">
          <div className="action-group">
            <span className="group-label">Health Services:</span>
            <button className="quick-action">
              <span className="action-icon">📋</span>
              <span className="action-text">New Case</span>
            </button>
            <button className="quick-action">
              <span className="action-icon">💉</span>
              <span className="action-text">Schedule Vaccine</span>
            </button>
            <button className="quick-action">
              <span className="action-icon">📊</span>
              <span className="action-text">Health Report</span>
            </button>
          </div>
          
          <div className="action-group">
            <span className="group-label">Emergency:</span>
            <button className="quick-action emergency">
              <span className="action-icon">🚑</span>
              <span className="action-text">Emergency Response</span>
            </button>
            <button className="quick-action">
              <span className="action-icon">📞</span>
              <span className="action-text">Crisis Line</span>
            </button>
            <button className="quick-action">
              <span className="action-icon">🏥</span>
              <span className="action-text">Facility Status</span>
            </button>
          </div>
          
          <div className="health-time">
            <div className="time-display">
              <div className="current-time">{new Date().toLocaleTimeString()}</div>
              <div className="time-zone">Benton County, WA</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;