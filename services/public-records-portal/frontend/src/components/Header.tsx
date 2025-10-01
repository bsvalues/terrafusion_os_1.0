import React from 'react';
import './Header.css';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  connectionStatus?: {
    isConnected: boolean;
    lastHeartbeat: string;
    latency: number;
  };
}

const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onTabChange, 
  connectionStatus = { isConnected: false, lastHeartbeat: 'Never', latency: 0 }
}) => {
  const navigationTabs = [
    { id: 'home', label: 'Public Portal', icon: '🏛️' },
    { id: 'search', label: 'Search Records', icon: '🔍' },
    { id: 'request', label: 'Submit FOIA', icon: '📝' },
    { id: 'track', label: 'Track Requests', icon: '📋' },
    { id: 'transparency', label: 'Transparency', icon: '🌟' },
    { id: 'help', label: 'Citizen Help', icon: '❓' }
  ];

  return (
    <header className="public-records-header">
      <div className="header-container">
        
        {/* Logo and Service Title */}
        <div className="header-brand">
          <div className="brand-logo">
            <div className="logo-icon">📋</div>
            <div className="logo-text">
              <div className="service-name">Public Records Portal</div>
              <div className="service-tagline">Transparent Government Access</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="header-navigation">
          <div className="nav-tabs">
            {navigationTabs.map((tab) => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Connection Status */}
        <div className="header-status">
          <div className={`connection-status ${connectionStatus.isConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-indicator">
              <div className="status-dot"></div>
              <div className="status-info">
                <div className="status-text">
                  {connectionStatus.isConnected ? 'Portal Online' : 'Portal Offline'}
                </div>
                {connectionStatus.isConnected && (
                  <div className="status-latency">{connectionStatus.latency}ms</div>
                )}
              </div>
            </div>
          </div>
          
          {/* TerraFusion Brand Badge */}
          <div className="brand-badge">
            <div className="badge-icon">⚡</div>
            <div className="badge-text">
              <div className="powered-by">Powered by</div>
              <div className="terrafusion-brand">TerraFusion OS</div>
            </div>
          </div>
        </div>

      </div>

      {/* Government Notice Banner */}
      <div className="government-notice">
        <div className="notice-container">
          <div className="notice-icon">🏛️</div>
          <div className="notice-content">
            <strong>Official Government Portal</strong> - All requests are subject to applicable laws and regulations. 
            Processing times may vary. For immediate assistance, contact your local government office.
          </div>
          <div className="notice-compliance">
            <span className="compliance-badge">FOIA Compliant</span>
            <span className="compliance-badge">ADA Accessible</span>
            <span className="compliance-badge">Secure Portal</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;