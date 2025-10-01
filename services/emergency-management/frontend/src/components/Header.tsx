import React from 'react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const bentonCountyStats = {
    population: 206873,
    areaSqMiles: 1703.4,
    emergencyDirector: "David Blazer",
    dispatchCenter: "Benton County Dispatch",
    eocLocation: "7122 W Okanogan Pl, Kennewick",
    sirens: 15,
    evacuationRoutes: 12,
    shelters: 18,
    activeIncidents: 3,
    resourcesDeployed: 14,
    alertsActive: 2
  };

  const navigationTabs = [
    { id: 'dashboard', label: 'Emergency Dashboard', icon: '🚨' },
    { id: 'incidents', label: 'Active Incidents', icon: '⚠️' },
    { id: 'alerts', label: 'Emergency Alerts', icon: '📢' },
    { id: 'resources', label: 'Emergency Resources', icon: '🚒' },
    { id: 'response', label: 'Response Plans', icon: '📋' },
    { id: 'notifications', label: 'Mass Notifications', icon: '📱' },
    { id: 'coordination', label: 'Multi-Agency Coordination', icon: '🤝' },
    { id: 'recovery', label: 'Recovery Operations', icon: '🔄' },
    { id: 'analytics', label: 'Emergency Analytics', icon: '📊' },
    { id: 'admin', label: 'System Administration', icon: '⚙️' }
  ];

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-top">
          <div className="header-brand">
            <div className="brand-logo">🚨</div>
            <div className="brand-text">
              <h1>TerraFusion Emergency Management</h1>
              <p>Advanced Disaster Response & Crisis Management • Benton County, Washington</p>
            </div>
          </div>
          
          <div className="status-indicators">
            <div className="status-item">
              <div className="status-dot"></div>
              <span>{bentonCountyStats.activeIncidents} Active Incidents</span>
            </div>
            <div className="status-item">
              <div className="status-dot warning"></div>
              <span>{bentonCountyStats.alertsActive} Emergency Alerts</span>
            </div>
            <div className="status-item">
              <div className="status-dot"></div>
              <span>{bentonCountyStats.resourcesDeployed} Resources Deployed</span>
            </div>
            <div className="status-item">
              <div className="status-dot neutral"></div>
              <span>EOC: {bentonCountyStats.eocLocation}</span>
            </div>
          </div>
        </div>

        <div className="county-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Population:</span>
              <span className="info-value">{bentonCountyStats.population.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Coverage:</span>
              <span className="info-value">{bentonCountyStats.areaSqMiles.toLocaleString()} sq mi</span>
            </div>
            <div className="info-item">
              <span className="info-label">Director:</span>
              <span className="info-value">{bentonCountyStats.emergencyDirector}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Dispatch:</span>
              <span className="info-value">{bentonCountyStats.dispatchCenter}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Warning Sirens:</span>
              <span className="info-value">{bentonCountyStats.sirens}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Evacuation Routes:</span>
              <span className="info-value">{bentonCountyStats.evacuationRoutes}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Emergency Shelters:</span>
              <span className="info-value">{bentonCountyStats.shelters}</span>
            </div>
          </div>
        </div>

        <nav className="nav-tabs">
          {navigationTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;