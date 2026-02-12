/**
 * TerraFusionPro - Card Component
 * Reusable card component for content containers
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Card Component
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.action - Action button/link configuration
 * @param {function} props.onAction - Action callback function
 * @param {string} props.footer - Footer content
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 */
const Card = ({
  title,
  children,
  className = '',
  action,
  onAction,
  footer,
  loading = false,
  error = null
}) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header">
          <h2 className="card-title">{title}</h2>
          
          {action && (
            <>
              {action.url ? (
                <Link to={action.url} className="card-action-link">
                  {action.label || 'View'}
                </Link>
              ) : (
                <button 
                  className="card-action-button"
                  onClick={() => onAction && onAction(action.id || action.label)}
                >
                  {action.label || 'Action'}
                </button>
              )}
            </>
          )}
        </div>
      )}
      
      <div className="card-content">
        {loading ? (
          <div className="card-loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="card-error">
            <div className="error-icon">!</div>
            <p>{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;