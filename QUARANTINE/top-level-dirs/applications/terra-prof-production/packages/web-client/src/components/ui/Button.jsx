/**
 * TerraFusionPro - Button Component
 * Reusable button component with multiple variants
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Button Component
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (primary, secondary, text, danger)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.fullWidth - Whether button should take full width
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.to - Link destination (if button should be a Link)
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.icon - Icon to display
 * @param {string} props.iconPosition - Icon position (left, right)
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  to,
  children,
  icon,
  iconPosition = 'left',
  ...rest
}) => {
  // Combine class names
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    icon ? 'btn-with-icon' : '',
    icon && iconPosition === 'right' ? 'btn-icon-right' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Render a Link if 'to' prop is provided
  if (to) {
    return (
      <Link 
        to={to} 
        className={buttonClasses}
        onClick={onClick}
        {...rest}
      >
        {renderContent()}
      </Link>
    );
  }
  
  // Render a regular button
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {renderContent()}
    </button>
  );
  
  // Helper to render button content with icon and loading spinner
  function renderContent() {
    if (loading) {
      return (
        <>
          <span className="btn-spinner"></span>
          <span className="btn-text">{children || 'Loading...'}</span>
        </>
      );
    }
    
    if (icon) {
      return (
        <>
          {iconPosition === 'left' && (
            <span className="btn-icon">{icon}</span>
          )}
          <span className="btn-text">{children}</span>
          {iconPosition === 'right' && (
            <span className="btn-icon">{icon}</span>
          )}
        </>
      );
    }
    
    return children;
  }
};

export default Button;