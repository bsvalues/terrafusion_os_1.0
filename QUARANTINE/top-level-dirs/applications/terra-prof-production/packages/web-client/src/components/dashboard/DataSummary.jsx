/**
 * TerraFusionPro - Dashboard Data Summary Component
 * Displays key metrics as summary cards on the dashboard
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * DataSummary Component
 * @param {Object} props - Component props
 * @param {number} props.properties - Number of properties
 * @param {number} props.reports - Number of reports
 * @param {number} props.pendingTasks - Number of pending tasks
 * @param {number} props.completedTasks - Number of completed tasks
 */
const DataSummary = ({
  properties = 0,
  reports = 0,
  pendingTasks = 0,
  completedTasks = 0
}) => {
  // Calculate task completion rate
  const totalTasks = pendingTasks + completedTasks;
  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;
  
  return (
    <div className="data-summary">
      {/* Properties Summary */}
      <div className="summary-card">
        <div className="summary-icon properties-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        
        <div className="summary-content">
          <h3 className="summary-title">Properties</h3>
          <div className="summary-value">{properties}</div>
          <div className="summary-description">Active properties</div>
        </div>
        
        <Link to="/properties" className="summary-link">
          View All
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Link>
      </div>
      
      {/* Reports Summary */}
      <div className="summary-card">
        <div className="summary-icon reports-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        
        <div className="summary-content">
          <h3 className="summary-title">Reports</h3>
          <div className="summary-value">{reports}</div>
          <div className="summary-description">Active reports</div>
        </div>
        
        <Link to="/reports" className="summary-link">
          View All
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Link>
      </div>
      
      {/* Tasks Summary */}
      <div className="summary-card">
        <div className="summary-icon tasks-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </div>
        
        <div className="summary-content">
          <h3 className="summary-title">Tasks</h3>
          <div className="summary-value">{pendingTasks}</div>
          <div className="summary-description">Pending tasks</div>
        </div>
        
        <Link to="/tasks" className="summary-link">
          View All
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Link>
      </div>
      
      {/* Completion Rate Summary */}
      <div className="summary-card">
        <div className="summary-icon completion-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        
        <div className="summary-content">
          <h3 className="summary-title">Completion Rate</h3>
          <div className="summary-value">{completionRate}%</div>
          <div className="summary-description">
            {completedTasks} of {totalTasks} tasks completed
          </div>
        </div>
        
        <div className="completion-progress">
          <div 
            className="completion-bar" 
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default DataSummary;