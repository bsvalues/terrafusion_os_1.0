/**
 * TerraFusionPro - Activity Feed Component
 * Displays recent user and system activities in a chronological feed
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Format relative time
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} - Formatted relative time
 */
const formatRelativeTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    // Format as date for older activities
    return date.toLocaleDateString();
  }
};

/**
 * Get icon for activity type
 * @param {string} type - Activity type
 * @returns {string} - Icon for activity type
 */
const getActivityIcon = (type) => {
  switch (type) {
    case 'property_created':
    case 'property_updated':
      return '🏢';
    case 'report_created':
    case 'report_updated':
    case 'report_status_changed':
      return '📄';
    case 'data_uploaded':
    case 'data_imported':
      return '📤';
    case 'user_login':
    case 'user_logout':
    case 'user_added':
      return '👤';
    case 'comment_added':
      return '💬';
    case 'task_created':
    case 'task_completed':
      return '✓';
    case 'system_notification':
      return '🔔';
    default:
      return '⚡';
  }
};

/**
 * Get activity link
 * @param {Object} activity - Activity data
 * @returns {string|null} - URL to related resource
 */
const getActivityLink = (activity) => {
  const { type, resourceType, resourceId } = activity;
  
  if (resourceType === 'property' && resourceId) {
    return `/properties/${resourceId}`;
  } else if (resourceType === 'report' && resourceId) {
    return `/reports/${resourceId}`;
  } else if (resourceType === 'task' && resourceId) {
    return `/tasks/${resourceId}`;
  } else if (resourceType === 'user' && resourceId) {
    return `/users/${resourceId}`;
  }
  
  return null;
};

/**
 * ActivityFeed Component
 * @param {Object} props - Component props
 * @param {Array} props.activities - List of activity items
 * @param {number} props.limit - Maximum number of activities to display (default: 10)
 * @param {boolean} props.groupByDay - Whether to group activities by day (default: false)
 */
const ActivityFeed = ({ 
  activities = [], 
  limit = 10,
  groupByDay = false 
}) => {
  // Limit number of activities
  const displayActivities = activities.slice(0, limit);
  
  // Group activities by date if needed
  const groupedActivities = !groupByDay
    ? { recent: displayActivities }
    : displayActivities.reduce((groups, activity) => {
        const date = new Date(activity.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let groupKey;
        
        if (date.toDateString() === today.toDateString()) {
          groupKey = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
          groupKey = 'Yesterday';
        } else {
          groupKey = date.toLocaleDateString(undefined, { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          });
        }
        
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        
        groups[groupKey].push(activity);
        return groups;
      }, {});
  
  if (displayActivities.length === 0) {
    return (
      <div className="activity-feed empty">
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>No recent activity to display</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="activity-feed">
      {Object.entries(groupedActivities).map(([date, dateActivities]) => (
        <div key={date} className="activity-group">
          {groupByDay && (
            <div className="activity-date-header">{date}</div>
          )}
          
          <ul className="activity-list">
            {dateActivities.map(activity => {
              const activityLink = getActivityLink(activity);
              
              return (
                <li key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="activity-content">
                    {activityLink ? (
                      <Link to={activityLink} className="activity-message">
                        {activity.message}
                      </Link>
                    ) : (
                      <div className="activity-message">
                        {activity.message}
                      </div>
                    )}
                    
                    <div className="activity-meta">
                      <span className="activity-time">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                      
                      {activity.user && (
                        <span className="activity-user">
                          by {activity.user.name || activity.user.username}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;