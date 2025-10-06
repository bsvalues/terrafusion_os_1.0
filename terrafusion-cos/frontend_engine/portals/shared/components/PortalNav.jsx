/**
 * PortalNav - Sidebar navigation for portal pages
 * Displays portal branding, navigation links, and user menu
 */

import { NavLink, useLocation } from 'react-router-dom';
import { usePortal } from '../context/PortalContext';
import './PortalNav.css';

const PortalNav = () => {
  const { portalName, sidebarCollapsed, toggleSidebar, user } = usePortal();
  const location = useLocation();

  // Get navigation items based on portal
  const getNavigationItems = () => {
    const basePortalPath = `/${portalName}`;
    
    switch (portalName) {
      case 'education':
        return [
          { path: `${basePortalPath}`, label: 'Dashboard', icon: '📊', exact: true },
          { path: `${basePortalPath}/students`, label: 'Students', icon: '👥' },
          { path: `${basePortalPath}/classes`, label: 'Classes', icon: '📚' },
          { path: `${basePortalPath}/attendance`, label: 'Attendance', icon: '✓' },
          { path: `${basePortalPath}/grades`, label: 'Grades', icon: '📝' },
          { path: `${basePortalPath}/reports`, label: 'Reports', icon: '📈' },
        ];
      case 'emergency':
        return [
          { path: `${basePortalPath}`, label: 'Dashboard', icon: '🚨', exact: true },
          { path: `${basePortalPath}/incidents`, label: 'Incidents', icon: '⚠️' },
          { path: `${basePortalPath}/resources`, label: 'Resources', icon: '🚒' },
          { path: `${basePortalPath}/alerts`, label: 'Alerts', icon: '📢' },
          { path: `${basePortalPath}/map`, label: 'Live Map', icon: '🗺️' },
        ];
      case 'transportation':
        return [
          { path: `${basePortalPath}`, label: 'Dashboard', icon: '🚗', exact: true },
          { path: `${basePortalPath}/traffic`, label: 'Traffic', icon: '🚦' },
          { path: `${basePortalPath}/transit`, label: 'Transit', icon: '🚌' },
          { path: `${basePortalPath}/parking`, label: 'Parking', icon: '🅿️' },
          { path: `${basePortalPath}/analytics`, label: 'Analytics', icon: '📊' },
        ];
      case 'parks':
        return [
          { path: `${basePortalPath}`, label: 'Dashboard', icon: '🌳', exact: true },
          { path: `${basePortalPath}/facilities`, label: 'Facilities', icon: '🏞️' },
          { path: `${basePortalPath}/reservations`, label: 'Reservations', icon: '📅' },
          { path: `${basePortalPath}/maintenance`, label: 'Maintenance', icon: '🔧' },
          { path: `${basePortalPath}/events`, label: 'Events', icon: '🎉' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const getPortalTitle = () => {
    switch (portalName) {
      case 'education': return 'Education Management';
      case 'emergency': return 'Emergency Management';
      case 'transportation': return 'Smart Transportation';
      case 'parks': return 'Parks & Recreation';
      default: return 'TerraFusion Portal';
    }
  };

  return (
    <nav className={`portal-nav ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="portal-nav-header">
        <div className="portal-nav-brand">
          <span className="portal-nav-logo">🌍</span>
          {!sidebarCollapsed && (
            <div className="portal-nav-title">
              <h1>TerraFusion</h1>
              <p>{getPortalTitle()}</p>
            </div>
          )}
        </div>
        <button 
          className="portal-nav-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="portal-nav-menu">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => 
              `portal-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="portal-nav-icon">{item.icon}</span>
            {!sidebarCollapsed && <span className="portal-nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </div>

      <div className="portal-nav-footer">
        <div className="portal-nav-user">
          <div className="portal-nav-user-avatar">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="portal-nav-user-info">
              <p className="portal-nav-user-name">{user?.name || 'User'}</p>
              <p className="portal-nav-user-role">{user?.role || 'Guest'}</p>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default PortalNav;
