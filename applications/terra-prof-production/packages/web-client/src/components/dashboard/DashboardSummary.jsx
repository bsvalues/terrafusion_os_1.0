/**
 * TerraFusionPro - Dashboard Summary Component
 * Provides an overview of key metrics and recent activities
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * DashboardSummary Component
 */
const DashboardSummary = ({ summaryData = {} }) => {
  // Provide some sensible defaults if data isn't passed
  const {
    propertyCount = 0,
    reportCount = 0,
    pendingForms = 0,
    recentActivity = [],
    serviceStatus = {
      healthy: 5,
      warning: 1,
      error: 1,
      total: 7
    }
  } = summaryData;
  
  return (
    <div className="dashboard-summary">
      <div className="summary-metrics">
        <div className="metric-card">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="metric-data">
            <div className="metric-value">{propertyCount}</div>
            <div className="metric-label">Properties</div>
          </div>
          <div className="metric-action">
            <Link to="/properties" className="metric-link">View all</Link>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="metric-data">
            <div className="metric-value">{reportCount}</div>
            <div className="metric-label">Reports</div>
          </div>
          <div className="metric-action">
            <Link to="/reports" className="metric-link">View all</Link>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"></path>
            </svg>
          </div>
          <div className="metric-data">
            <div className="metric-value">{pendingForms}</div>
            <div className="metric-label">Pending Forms</div>
          </div>
          <div className="metric-action">
            <Link to="/forms/assigned" className="metric-link">View all</Link>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
              <line x1="3" y1="20" x2="21" y2="20"></line>
            </svg>
          </div>
          <div className="metric-data">
            <div className="metric-value service-status">
              <span className="status-healthy">{serviceStatus.healthy}</span>
              <span className="status-divider">/</span>
              <span className="status-warning">{serviceStatus.warning}</span>
              <span className="status-divider">/</span>
              <span className="status-error">{serviceStatus.error}</span>
            </div>
            <div className="metric-label">Service Status</div>
          </div>
          <div className="metric-action">
            <Link to="/admin/system-health" className="metric-link">View details</Link>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <div className="section-header">
          <h3 className="section-title">Recent Activity</h3>
          <Link to="/activities" className="section-action">View all</Link>
        </div>
        
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity /* , index */) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <span className="activity-title">{activity.title}</span>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                  <div className="activity-description">{activity.description}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activities">
              <p>No recent activities to display.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Get the appropriate icon for an activity type
 * @param {string} type - The activity type
 * @returns {JSX.Element} - The SVG icon
 */
const getActivityIcon = (type) => {
  switch (type) {
    case 'property':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      );
    case 'report':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      );
    case 'form':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      );
    case 'user':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      );
    case 'system':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      );
  }
};

export default DashboardSummary;