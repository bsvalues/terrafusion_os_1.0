/**
 * TerraFusionPro - Status Indicator Component
 * Visual indicator for different status types
 */

import React from 'react';

/**
 * Status mapping configuration
 * Maps status keys to human-readable labels and colors
 */
const STATUS_CONFIG = {
  // Report statuses
  'draft': { label: 'Draft', color: 'gray' },
  'in_review': { label: 'In Review', color: 'blue' },
  'pending': { label: 'Pending', color: 'yellow' },
  'approved': { label: 'Approved', color: 'green' },
  'finalized': { label: 'Finalized', color: 'teal' },
  'rejected': { label: 'Rejected', color: 'red' },
  'archived': { label: 'Archived', color: 'gray' },
  
  // Task statuses
  'not_started': { label: 'Not Started', color: 'gray' },
  'in_progress': { label: 'In Progress', color: 'blue' },
  'completed': { label: 'Completed', color: 'green' },
  'on_hold': { label: 'On Hold', color: 'yellow' },
  'cancelled': { label: 'Cancelled', color: 'red' },
  
  // System statuses
  'online': { label: 'Online', color: 'green' },
  'offline': { label: 'Offline', color: 'red' },
  'warning': { label: 'Warning', color: 'yellow' },
  'maintenance': { label: 'Maintenance', color: 'blue' },
  
  // Generic statuses
  'active': { label: 'Active', color: 'green' },
  'inactive': { label: 'Inactive', color: 'gray' },
  'error': { label: 'Error', color: 'red' },
  'success': { label: 'Success', color: 'green' },
  'warning': { label: 'Warning', color: 'yellow' },
  'info': { label: 'Info', color: 'blue' },
};

/**
 * Status Indicator Component
 * @param {Object} props - Component props
 * @param {string} props.status - Status key
 * @param {string} props.label - Optional override for status label
 * @param {string} props.color - Optional override for status color
 * @param {boolean} props.showDot - Whether to show the status dot
 * @param {boolean} props.showLabel - Whether to show the status label
 * @param {string} props.size - Size of the indicator (sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 */
const StatusIndicator = ({
  status,
  label,
  color,
  showDot = true,
  showLabel = true,
  size = 'md',
  className = ''
}) => {
  // Get status configuration
  const statusConfig = STATUS_CONFIG[status] || { 
    label: label || status || 'Unknown', 
    color: color || 'gray' 
  };
  
  // Parse custom label if provided
  const displayLabel = label || statusConfig.label;
  
  // Parse custom color if provided
  const displayColor = color || statusConfig.color;
  
  return (
    <div className={`status-indicator size-${size} ${className}`}>
      {showDot && (
        <span className={`status-dot color-${displayColor}`}></span>
      )}
      
      {showLabel && (
        <span className="status-label">{displayLabel}</span>
      )}
    </div>
  );
};

export default StatusIndicator;