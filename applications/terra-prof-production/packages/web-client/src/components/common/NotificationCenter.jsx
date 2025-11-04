import React, { useContext, useEffect } from 'react';
import NotificationContext from '../../contexts/NotificationContext';

/**
 * NotificationCenter Component
 * Displays application notifications from the NotificationContext
 */
const NotificationCenter = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);
  
  // Get icon by notification type
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };
  
  // Get class by notification type
  const getTypeClass = (type) => {
    return `notification-${type}`;
  };
  
  // Handle notification click
  const handleNotificationClick = (id) => {
    removeNotification(id);
  };
  
  // Render notifications
  return (
    <div className="notification-center">
      <div className="notification-container">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`notification ${getTypeClass(notification.type)}`}
            onClick={() => handleNotificationClick(notification.id)}
          >
            <div className="notification-icon">
              {getIcon(notification.type)}
            </div>
            
            <div className="notification-content">
              <div className="notification-header">
                <h4 className="notification-title">{notification.title}</h4>
                <button 
                  className="notification-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                >
                  ×
                </button>
              </div>
              
              <div className="notification-message">
                {notification.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationCenter;