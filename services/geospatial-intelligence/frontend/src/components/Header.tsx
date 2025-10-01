import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="gis-header">
      <div className="header-container">
        <div className="header-left">
          <div className="gis-logo">
            <span className="logo-icon">🌍</span>
            <div className="logo-text">
              <h1>TerraFusion OS</h1>
              <p>Geospatial Intelligence Services</p>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="county-info">
            <div className="county-badge">
              <span className="county-icon">🗺️</span>
              <div className="county-details">
                <h3>Benton County, Washington</h3>
                <p>Advanced GIS & Satellite Intelligence Platform</p>
              </div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="gis-stats">
            <div className="stat-item">
              <span className="stat-icon">🛰️</span>
              <div className="stat-info">
                <div className="stat-value">847</div>
                <div className="stat-label">Satellite Images</div>
              </div>
            </div>
            
            <div className="stat-item">
              <span className="stat-icon">📊</span>
              <div className="stat-info">
                <div className="stat-value">1,703.4</div>
                <div className="stat-label">Sq Mi Coverage</div>
              </div>
            </div>
            
            <div className="stat-item">
              <span className="stat-icon">🔍</span>
              <div className="stat-info">
                <div className="stat-value">89,247</div>
                <div className="stat-label">Property Parcels</div>
              </div>
            </div>
            
            <div className="stat-item">
              <span className="stat-icon">🌱</span>
              <div className="stat-info">
                <div className="stat-value">156</div>
                <div className="stat-label">Environmental Monitors</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="gis-navigation">
        <div className="nav-container">
          <div className="nav-tabs">
            <button className="nav-tab active">
              <span className="nav-icon">🏠</span>
              <span className="nav-label">GIS Dashboard</span>
            </button>
            
            <button className="nav-tab">
              <span className="nav-icon">🛰️</span>
              <span className="nav-label">Satellite Imagery</span>
            </button>
            
            <button className="nav-tab">
              <span className="nav-icon">🗺️</span>
              <span className="nav-label">Interactive Maps</span>
            </button>
            
            <button className="nav-tab">
              <span className="nav-icon">📊</span>
              <span className="nav-label">Spatial Analysis</span>
            </button>
            
            <button className="nav-tab">
              <span className="nav-icon">🏘️</span>
              <span className="nav-label">Property Boundaries</span>
            </button>
            
            <button className="nav-tab">
              <span className="nav-icon">🌱</span>
              <span className="nav-label">Environmental</span>
            </button>
            
            <button className="nav-tab">
              <span className="nav-icon">🚧</span>
              <span className="nav-label">Infrastructure</span>
            </button>
            
            <button className="nav-tab">
              <span className="nav-icon">📈</span>
              <span className="nav-label">Analytics</span>
            </button>
            
            <button className="nav-tab">
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Admin</span>
            </button>
          </div>
          
          <div className="nav-actions">
            <button className="action-btn primary">
              <span>🔄</span>
              Sync Data
            </button>
            <button className="action-btn secondary">
              <span>📥</span>
              Export
            </button>
          </div>
        </div>
      </nav>

      <div className="status-bar">
        <div className="status-container">
          <div className="status-left">
            <div className="coverage-status">
              <span className="status-icon">🌍</span>
              <span className="status-text">Full County Coverage Active</span>
              <span className="status-indicator active"></span>
            </div>
          </div>
          
          <div className="status-center">
            <div className="processing-status">
              <span className="status-icon">⚡</span>
              <span className="status-text">Real-time Processing: 23 Active Tasks</span>
            </div>
          </div>
          
          <div className="status-right">
            <div className="data-freshness">
              <span className="status-icon">🕐</span>
              <span className="status-text">Last Update: 2 minutes ago</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;