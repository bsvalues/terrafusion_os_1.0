import React from 'react';
import { Clock, MapPin, Users, Bus, Car, Zap, AlertTriangle, Navigation } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`transport-header ${className}`}>
      {/* Benton County Transportation Authority Banner */}
      <div className="authority-banner">
        <div className="authority-info">
          <div className="county-seal">
            <div className="seal-icon">🚦</div>
          </div>
          <div className="authority-details">
            <h1 className="authority-title">Benton County Transportation Authority</h1>
            <p className="authority-subtitle">Smart Transportation & Traffic Management Division</p>
            <div className="contact-info">
              <span>Director: Michael Torres</span>
              <span className="separator">•</span>
              <span>📞 (509) 735-3300</span>
              <span className="separator">•</span>
              <span>📧 transportation@co.benton.wa.us</span>
            </div>
          </div>
        </div>
        
        <div className="county-stats">
          <div className="stat-group">
            <div className="stat-item">
              <span className="stat-value">206,873</span>
              <span className="stat-label">Population</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">1,703.4</span>
              <span className="stat-label">Sq Mi Coverage</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">438</span>
              <span className="stat-label">Road Miles</span>
            </div>
          </div>
          
          <div className="infrastructure-stats">
            <div className="infrastructure-item">
              <span className="infra-icon">🚦</span>
              <span className="infra-text">142 Traffic Signals</span>
            </div>
            <div className="infrastructure-item">
              <span className="infra-icon">🚌</span>
              <span className="infra-text">Ben Franklin Transit (28 Routes)</span>
            </div>
            <div className="infrastructure-item">
              <span className="infra-icon">🅿️</span>
              <span className="infra-text">8,430 Parking Spaces</span>
            </div>
          </div>
        </div>
      </div>

      {/* TerraFusion Transportation Navigation */}
      <nav className="transport-navigation">
        <div className="nav-brand">
          <div className="brand-icon">
            <Navigation className="brand-symbol" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">TerraFusion</span>
            <span className="brand-subtitle">Transportation Intelligence</span>
          </div>
        </div>

        <div className="nav-tabs">
          <div className="nav-tab active">
            <Car className="tab-icon" size={16} />
            <span>Dashboard</span>
          </div>
          <div className="nav-tab">
            <MapPin className="tab-icon" size={16} />
            <span>Traffic Flow</span>
          </div>
          <div className="nav-tab">
            <Bus className="tab-icon" size={16} />
            <span>Transit</span>
          </div>
          <div className="nav-tab">
            <Zap className="tab-icon" size={16} />
            <span>Signals</span>
          </div>
          <div className="nav-tab">
            <Users className="tab-icon" size={16} />
            <span>Parking</span>
          </div>
          <div className="nav-tab">
            <AlertTriangle className="tab-icon" size={16} />
            <span>Incidents</span>
          </div>
          <div className="nav-tab">
            <Clock className="tab-icon" size={16} />
            <span>Analytics</span>
          </div>
        </div>

        <div className="system-status">
          <div className="status-indicator operational">
            <div className="status-dot"></div>
            <span>SYSTEM OPERATIONAL</span>
          </div>
          <div className="timestamp">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;