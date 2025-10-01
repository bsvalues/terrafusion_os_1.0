import React from 'react';
import { 
  Clock, 
  MapPin, 
  Users, 
  Settings, 
  BarChart3, 
  Wrench, 
  Building, 
  Gauge, 
  Calendar,
  AlertTriangle,
  TrendingUp,
  Construction
} from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`public-works-header ${className}`}>
      {/* Benton County Public Works Authority Banner */}
      <div className="authority-banner">
        <div className="authority-info">
          <div className="county-seal">
            <div className="seal-icon">🏗️</div>
          </div>
          <div className="authority-details">
            <h1 className="authority-title">Benton County Public Works Department</h1>
            <p className="authority-subtitle">Advanced Infrastructure Management & Engineering Services</p>
            <div className="contact-info">
              <span>Director: Erik Bjornson, PE</span>
              <span className="separator">•</span>
              <span>📞 (509) 735-3564</span>
              <span className="separator">•</span>
              <span>📧 publicworks@co.benton.wa.us</span>
            </div>
          </div>
        </div>
        
        <div className="county-stats">
          <div className="stat-group">
            <div className="stat-item">
              <span className="stat-value">206,873</span>
              <span className="stat-label">Population Served</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">1,247.5</span>
              <span className="stat-label">Road Miles</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">$45M</span>
              <span className="stat-label">Annual Budget</span>
            </div>
          </div>
          
          <div className="infrastructure-stats">
            <div className="infrastructure-item">
              <span className="infra-icon">🌉</span>
              <span className="infra-text">89 Bridges Managed</span>
            </div>
            <div className="infrastructure-item">
              <span className="infra-icon">🚰</span>
              <span className="infra-text">892.3 mi Water Mains</span>
            </div>
            <div className="infrastructure-item">
              <span className="infra-icon">🚛</span>
              <span className="infra-text">67 Fleet Vehicles</span>
            </div>
          </div>
        </div>
      </div>

      {/* TerraFusion Public Works Navigation */}
      <nav className="public-works-navigation">
        <div className="nav-brand">
          <div className="brand-icon">
            <Construction className="brand-symbol" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">TerraFusion</span>
            <span className="brand-subtitle">Infrastructure Intelligence</span>
          </div>
        </div>

        <div className="nav-tabs">
          <div className="nav-tab active">
            <BarChart3 className="tab-icon" size={16} />
            <span>Dashboard</span>
          </div>
          <div className="nav-tab">
            <Building className="tab-icon" size={16} />
            <span>Assets</span>
          </div>
          <div className="nav-tab">
            <Wrench className="tab-icon" size={16} />
            <span>Work Orders</span>
          </div>
          <div className="nav-tab">
            <Settings className="tab-icon" size={16} />
            <span>Maintenance</span>
          </div>
          <div className="nav-tab">
            <Construction className="tab-icon" size={16} />
            <span>Projects</span>
          </div>
          <div className="nav-tab">
            <Calendar className="tab-icon" size={16} />
            <span>Scheduling</span>
          </div>
          <div className="nav-tab">
            <TrendingUp className="tab-icon" size={16} />
            <span>Analytics</span>
          </div>
          <div className="nav-tab">
            <MapPin className="tab-icon" size={16} />
            <span>GIS</span>
          </div>
        </div>

        <div className="system-status">
          <div className="status-indicator operational">
            <div className="status-dot"></div>
            <span>INFRASTRUCTURE OPERATIONAL</span>
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