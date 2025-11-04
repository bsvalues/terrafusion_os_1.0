import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Sidebar Component
 * Main navigation sidebar for the application
 */
const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Toggle sidebar expanded/collapsed state
  const toggleCollapse = () => {
    setCollapsed(prev => !prev);
    // Close expanded sections when collapsing
    if (!collapsed) {
      setExpandedSection(null);
    }
  };
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSection(prev => prev === section ? null : section);
  };
  
  // Check if a route is active
  const isActiveRoute = (route) => {
    return location.pathname === route || 
           (route !== '/' && location.pathname.startsWith(route));
  };
  
  // Navigation items
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      path: '/',
      hasChildren: false
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: '🏠',
      path: '/properties',
      hasChildren: true,
      children: [
        { id: 'all-properties', label: 'All Properties', path: '/properties' },
        { id: 'add-property', label: 'Add New Property', path: '/properties/new' },
        { id: 'property-types', label: 'Property Types', path: '/properties/types' },
        { id: 'import-export', label: 'Import/Export', path: '/properties/import-export' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📝',
      path: '/reports',
      hasChildren: true,
      children: [
        { id: 'all-reports', label: 'All Reports', path: '/reports' },
        { id: 'new-report', label: 'Create New Report', path: '/reports/new' },
        { id: 'report-templates', label: 'Report Templates', path: '/reports/templates' }
      ]
    },
    {
      id: 'forms',
      label: 'Forms',
      icon: '📋',
      path: '/forms',
      hasChildren: true,
      children: [
        { id: 'all-forms', label: 'All Forms', path: '/forms' },
        { id: 'create-form', label: 'Create Form', path: '/forms/new' },
        { id: 'form-submissions', label: 'Submissions', path: '/forms/submissions' },
        { id: 'form-templates', label: 'Form Templates', path: '/forms/templates' }
      ]
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: '📈',
      path: '/analysis',
      hasChildren: true,
      children: [
        { id: 'market-analysis', label: 'Market Analysis', path: '/analysis/market' },
        { id: 'trend-reports', label: 'Trend Reports', path: '/analysis/trends' },
        { id: 'value-predictions', label: 'Value Predictions', path: '/analysis/predictions' },
        { id: 'comparables', label: 'Comparable Properties', path: '/analysis/comparables' }
      ]
    },
    {
      id: 'workflow',
      label: 'Workflow',
      icon: '⏱️',
      path: '/workflow',
      hasChildren: false
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: '/settings',
      hasChildren: false
    }
  ];
  
  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button 
          className="collapse-toggle"
          onClick={toggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navigationItems.map(item => (
            <li 
              key={item.id} 
              className={`nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
            >
              {item.hasChildren ? (
                <>
                  <button 
                    className={`nav-link has-children ${expandedSection === item.id ? 'expanded' : ''}`}
                    onClick={() => toggleSection(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    <span className="expand-icon">{expandedSection === item.id ? '▼' : '▶'}</span>
                  </button>
                  
                  {expandedSection === item.id && (
                    <ul className="subnav-list">
                      {item.children.map(child => (
                        <li 
                          key={child.id} 
                          className={`subnav-item ${isActiveRoute(child.path) ? 'active' : ''}`}
                        >
                          <Link to={child.path} className="subnav-link">
                            <span className="subnav-label">{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link to={item.path} className="nav-link">
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <Link to="/help" className="footer-link" title="Help & Support">
          <span className="footer-icon">❓</span>
          <span className="footer-text">Help & Support</span>
        </Link>
        
        <a 
          href="https://docs.terrafusionpro.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="footer-link"
          title="Documentation"
        >
          <span className="footer-icon">📚</span>
          <span className="footer-text">Documentation</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;