import React from 'react';
import './Header.css';

interface HeaderProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ connectionStatus, currentTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'monitoring', label: 'Monitoring', icon: '📈' },
    { id: 'diagnostics', label: 'Diagnostics', icon: '🔍' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'alerts', label: 'Alerts', icon: '🚨' }
  ];

  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'connected': return '#00ff88';
      case 'connecting': return '#ffaa00';
      case 'disconnected': return '#ff3333';
      default: return '#888888';
    }
  };

  const getConnectionText = (status: string) => {
    switch (status) {
      case 'connected': return 'Operations Center Online';
      case 'connecting': return 'Establishing Connection...';
      case 'disconnected': return 'Operations Center Offline';
      default: return 'Unknown Status';
    }
  };

  return (
    <header className="operations-header">
      <div className="header-left">
        <div className="logo-section">
          <div className="service-icon">⚙️</div>
          <div className="service-info">
            <h1 className="service-title">Operations Tools</h1>
            <p className="service-tagline">Government. Transcended.</p>
          </div>
        </div>
      </div>

      <div className="header-center">
        <nav className="tab-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${currentTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="header-right">
        <div className="connection-status">
          <div 
            className="status-indicator"
            style={{ backgroundColor: getConnectionColor(connectionStatus) }}
          ></div>
          <span className="status-text">{getConnectionText(connectionStatus)}</span>
        </div>
        <div className="user-info">
          <span className="user-name">Operations Admin</span>
          <div className="user-avatar">OA</div>
        </div>
      </div>
    </header>
  );
};

export default Header;