/**
 * Button Component
 * Reusable button with multiple states
 */

import React from 'react';

/**
 * Button Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - If the button is disabled
 * @param {boolean} props.loading - If the button is in loading state
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.type - Button type (button, submit, reset)
 * @returns {JSX.Element} Button component
 */
const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false, 
  className = '',
  type = 'button'
}) => {
  const baseClass = 'btn';
  const combinedClasses = `${baseClass} ${className} ${loading ? 'btn-loading' : ''}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedClasses}
    >
      {loading ? (
        <span className="loading-indicator">
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span className="loading-text">Loading...</span>
        </span>
      ) : children}
    </button>
  );
};

export default Button;