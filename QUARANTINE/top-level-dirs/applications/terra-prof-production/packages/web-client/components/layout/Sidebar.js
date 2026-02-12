/**
 * Sidebar Component
 * Main navigation sidebar for the application
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Sidebar Navigation Item Component
 * @param {Object} props - Component props
 * @param {string} props.to - Link destination
 * @param {string} props.label - Navigation label
 * @param {string} props.icon - Icon name or SVG 
 * @param {boolean} props.isActive - Whether this item is active
 * @returns {JSX.Element} Navigation item component
 */
const NavItem = ({ to, label, icon, isActive }) => {
  return (
    <li className={`nav-item ${isActive ? 'active' : ''}`}>
      <Link to={to} className="nav-link">
        {icon && <span className="nav-icon">{icon}</span>}
        <span className="nav-label">{label}</span>
      </Link>
    </li>
  );
};

/**
 * Sidebar Component
 * @returns {JSX.Element} Sidebar component
 */
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Navigation items
  const navItems = [
    { 
      to: '/dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      adminOnly: false
    },
    { 
      to: '/upload', 
      label: 'Upload Files', 
      icon: '📁',
      adminOnly: false
    },
    { 
      to: '/sync', 
      label: 'Sync Data', 
      icon: '🔄',
      adminOnly: false
    },
    { 
      to: '/properties', 
      label: 'Properties', 
      icon: '🏠',
      adminOnly: false
    },
    { 
      to: '/reports', 
      label: 'Reports', 
      icon: '📝',
      adminOnly: false
    },
    { 
      to: '/admin', 
      label: 'Administration', 
      icon: '⚙️',
      adminOnly: true
    }
  ];

  // Filter items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.adminOnly) return true;
    return user && user.isAdmin;
  });

  const toggleSidebar = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-text">TerraFusionPro</span>
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {isAuthenticated ? (
        <>
          <div className="user-info">
            <div className="user-avatar">
              {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="user-details">
                <div className="user-name">{user ? user.name : 'User'}</div>
                <div className="user-role">{user && user.isAdmin ? 'Administrator' : 'User'}</div>
              </div>
            )}
          </div>

          <nav className="sidebar-nav">
            <ul className="nav-list">
              {filteredNavItems.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  isActive={location.pathname === item.to}
                />
              ))}
            </ul>
          </nav>
        </>
      ) : (
        <nav className="sidebar-nav">
          <ul className="nav-list">
            <NavItem
              to="/login"
              label="Login"
              icon="🔑"
              isActive={location.pathname === '/login'}
            />
            <NavItem
              to="/register"
              label="Register"
              icon="📝"
              isActive={location.pathname === '/register'}
            />
          </ul>
        </nav>
      )}

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="version">Version 1.0.0</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;