import React from 'react';
import { Users, Bell, Settings, LogOut, User, HelpCircle, Search } from 'lucide-react';

interface HeaderProps {
  currentPath?: string;
}

const Header: React.FC<HeaderProps> = ({ currentPath = '/' }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        {/* Logo and Branding */}
        <div className="header-brand">
          <div className="logo-container">
            <div className="logo">
              <div className="logo-icon">
                <Users size={32} />
              </div>
              <div className="logo-text">
                <h1>TerraFusion OS</h1>
                <span className="tagline">Government. Transcended.</span>
              </div>
            </div>
          </div>
          <div className="service-title">
            <h2>Citizen Services Portal</h2>
            <p>Comprehensive service request management and delivery system</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="header-nav">
          <a 
            href="/dashboard" 
            className={`nav-link ${currentPath === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </a>
          <a 
            href="/catalog" 
            className={`nav-link ${currentPath === '/catalog' ? 'active' : ''}`}
          >
            Service Catalog
          </a>
          <a 
            href="/tracking" 
            className={`nav-link ${currentPath === '/tracking' ? 'active' : ''}`}
          >
            Request Tracking
          </a>
          <a 
            href="/appointments" 
            className={`nav-link ${currentPath === '/appointments' ? 'active' : ''}`}
          >
            Appointments
          </a>
          <a 
            href="/feedback" 
            className={`nav-link ${currentPath === '/feedback' ? 'active' : ''}`}
          >
            Feedback
          </a>
        </nav>

        {/* Search Bar */}
        <div className="header-search">
          <div className="search-container">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search services, requests..." 
              className="search-input"
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="header-actions">
          {/* Notifications */}
          <button className="action-button notifications" title="Notifications">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>

          {/* Help */}
          <button className="action-button" title="Help & Support">
            <HelpCircle size={20} />
          </button>

          {/* Settings */}
          <button className="action-button" title="Settings">
            <Settings size={20} />
          </button>

          {/* User Menu */}
          <div className="user-menu">
            <button className="user-button">
              <User size={20} />
              <span className="user-name">Admin User</span>
            </button>
            <div className="user-dropdown">
              <a href="/profile" className="dropdown-item">
                <User size={16} />
                Profile
              </a>
              <a href="/settings" className="dropdown-item">
                <Settings size={16} />
                Settings
              </a>
              <div className="dropdown-divider"></div>
              <a href="/logout" className="dropdown-item logout">
                <LogOut size={16} />
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-content">
          <div className="status-item">
            <div className="status-indicator online"></div>
            <span>System Status: All Services Operational</span>
          </div>
          <div className="status-item">
            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="status-item">
            <span>Active Users: 1,247</span>
          </div>
          <div className="status-item">
            <span>Pending Requests: 48,818</span>
          </div>
          <div className="status-item">
            <span>Satisfaction Score: 94.7%</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;