/**
 * Input Component
 * Reusable form input with validation
 */

import React, { forwardRef } from 'react';

/**
 * Input Component
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, password, email, etc.)
 * @param {string} props.name - Input name
 * @param {string} props.id - Input ID
 * @param {string} props.label - Input label
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Input placeholder
 * @param {boolean} props.required - If the input is required
 * @param {boolean} props.disabled - If the input is disabled
 * @param {string} props.error - Error message
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.hint - Hint text below input
 * @param {Object} props.containerProps - Additional props for the container div
 * @returns {JSX.Element} Input component
 */
const Input = forwardRef(({
  type = 'text',
  name,
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  className = '',
  hint,
  containerProps = {},
  ...props
}, ref) => {
  const inputId = id || name;
  const hasError = !!error;
  
  return (
    <div className={`input-container ${hasError ? 'has-error' : ''}`} {...containerProps}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`form-input ${className} ${hasError ? 'input-error' : ''}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
        {...props}
      />
      
      {hasError && (
        <div id={`${inputId}-error`} className="error-message">
          {error}
        </div>
      )}
      
      {hint && !hasError && (
        <div className="input-hint">
          {hint}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;