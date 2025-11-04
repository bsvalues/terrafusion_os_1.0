import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import ThemeContext from '../../contexts/ThemeContext';

/**
 * Header Component
 * Main application header with navigation and user controls
 */
const Header = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!currentUser) return 'U';
    
    const firstName = currentUser.firstName || '';
    const lastName = currentUser.lastName || '';
    
    return `${firstName[0] || ''}${lastName[0] || ''}`;
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };
  
  // Toggle user menu
  const toggleUserMenu = () => {
    setUserMenuOpen(prev => !prev);
    // Close notifications if open
    if (notificationsOpen) setNotificationsOpen(false);
  };
  
  // Toggle notifications
  const toggleNotifications = () => {
    setNotificationsOpen(prev => !prev);
    // Close user menu if open
    if (userMenuOpen) setUserMenuOpen(false);
  };
  
  // Sample notifications (would come from a context or API in a real implementation)
  const notifications = [
    {
      id: 'note-1',
      title: 'Report Completed',
      message: 'Residential Appraisal Report for 123 Main Street is ready for review.',
      time: '10 minutes ago',
      read: false
    },
    {
      id: 'note-2',
      title: 'New Form Submission',
      message: 'Property Inspection Form submitted for 456 Oak Avenue.',
      time: '2 hours ago',
      read: true
    },
    {
      id: 'note-3',
      title: 'System Update',
      message: 'TerraFusionPro platform will be updated tonight at 2:00 AM EST.',
      time: '5 hours ago',
      read: true
    }
  ];
  
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <img 
              src="/assets/images/terrafusion-logo.svg" 
              alt="TerraFusionPro Logo" 
              className="logo-image"
            />
            <span className="logo-text">TerraFusionPro</span>
          </Link>
        </div>
        
        <button className="mobile-menu-toggle">
          <span className="menu-icon"></span>
        </button>
      </div>
      
      <div className="header-search">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search properties, reports, forms..." 
            className="search-input"
          />
          <button className="search-button">
            🔍
          </button>
        </div>
      </div>
      
      <div className="header-right">
        <div className="header-actions">
          <button 
            className="theme-toggle-button" 
            onClick={toggleTheme} 
            title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
          >
            {theme === 'light' ? '🌙' : theme === 'dark' ? '🌓' : '☀️'}
          </button>
          
          <div className="notifications-dropdown">
            <button 
              className={`notifications-button ${notifications.some(n => !n.read) ? 'has-notifications' : ''}`}
              onClick={toggleNotifications}
            >
              🔔
              {notifications.some(n => !n.read) && (
                <span className="notification-badge">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            {notificationsOpen && (
              <div className="dropdown-menu notifications-menu">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  <button className="mark-all-read">Mark all as read</button>
                </div>
                
                <div className="notifications-list">
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      >
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="notification-time">{notification.time}</span>
                        </div>
                        {!notification.read && (
                          <button className="mark-read-button" title="Mark as read">
                            ✓
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="empty-notifications">
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
                
                <div className="dropdown-footer">
                  <Link to="/notifications" className="view-all">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <div className="user-dropdown">
            <button 
              className="user-menu-button"
              onClick={toggleUserMenu}
            >
              {currentUser?.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={`${currentUser.firstName} ${currentUser.lastName}`} 
                  className="user-avatar" 
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {getUserInitials()}
                </div>
              )}
              <span className="user-name">
                {currentUser?.firstName} {currentUser?.lastName}
              </span>
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {userMenuOpen && (
              <div className="dropdown-menu user-menu">
                <div className="user-info">
                  <div className="user-avatar-large">
                    {currentUser?.avatarUrl ? (
                      <img 
                        src={currentUser.avatarUrl} 
                        alt={`${currentUser.firstName} ${currentUser.lastName}`} 
                      />
                    ) : (
                      <div className="avatar-placeholder-large">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  <div className="user-details">
                    <h3>{currentUser?.firstName} {currentUser?.lastName}</h3>
                    <p className="user-email">{currentUser?.email}</p>
                    <p className="user-role">{currentUser?.role || 'User'}</p>
                  </div>
                </div>
                
                <div className="menu-items">
                  <Link to="/profile" className="menu-item" onClick={() => setUserMenuOpen(false)}>
                    <span className="menu-icon">👤</span>
                    <span className="menu-text">My Profile</span>
                  </Link>
                  
                  <Link to="/settings" className="menu-item" onClick={() => setUserMenuOpen(false)}>
                    <span className="menu-icon">⚙️</span>
                    <span className="menu-text">Settings</span>
                  </Link>
                  
                  <Link to="/help" className="menu-item" onClick={() => setUserMenuOpen(false)}>
                    <span className="menu-icon">❓</span>
                    <span className="menu-text">Help & Support</span>
                  </Link>
                  
                  <button className="menu-item logout-button" onClick={handleLogout}>
                    <span className="menu-icon">🚪</span>
                    <span className="menu-text">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;