/**
 * TerraFusion Elite Government OS Design System
 * FISMA-HIGH Compliant UI Components
 * Government. Transcended.
 */

import React from 'react';

// Core design system exports for government-grade applications
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'quantum' | 'warning' | 'success' | 'error';
}

export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'quantum' }) => {
  const baseStyles = 'rounded-lg border shadow-lg p-4';
  const variantStyles = {
    quantum: 'border-terra-cyan bg-terra-dark-blue text-terra-cyan',
    warning: 'border-yellow-500 bg-yellow-50 text-yellow-800',
    success: 'border-green-500 bg-green-50 text-green-800',
    error: 'border-red-500 bg-red-50 text-red-800'
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`border-b border-current pb-2 mb-4 ${className}`}>
    {children}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={className}>
    {children}
  </div>
);

export const Badge: React.FC<CardProps> = ({ children, className = '', variant = 'quantum' }) => {
  const baseStyles = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  const variantStyles = {
    quantum: 'bg-terra-cyan text-terra-dark-blue',
    warning: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Progress: React.FC<{
  value: number;
  max?: number;
  className?: string;
  variant?: 'quantum' | 'warning' | 'success' | 'error';
}> = ({ value, max = 100, className = '', variant = 'quantum' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const variantStyles = {
    quantum: 'bg-terra-cyan',
    warning: 'bg-yellow-500',
    success: 'bg-green-500',
    error: 'bg-red-500'
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-300 ${variantStyles[variant]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'quantum' | 'warning' | 'success' | 'error';
  disabled?: boolean;
}> = ({ children, onClick, className = '', variant = 'quantum', disabled = false }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2';
  const variantStyles = {
    quantum: 'bg-terra-cyan text-terra-dark-blue hover:bg-terra-cyan-light focus:ring-terra-cyan',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
    error: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<{
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}> = ({ value, onChange, placeholder, className = '', type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-cyan focus:border-terra-cyan ${className}`}
  />
);

export const Textarea: React.FC<{
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}> = ({ value, onChange, placeholder, className = '', rows = 3 }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-cyan focus:border-terra-cyan resize-none ${className}`}
  />
);

export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <hr className={`border-gray-300 my-4 ${className}`} />
);

// Government compliance indicator
export const ComplianceIndicator: React.FC<{
  level: 'FISMA-HIGH' | 'FedRAMP' | 'NIST';
  status: 'compliant' | 'pending' | 'non-compliant';
}> = ({ level, status }) => {
  const statusColors = {
    compliant: 'text-green-600 bg-green-100',
    pending: 'text-yellow-600 bg-yellow-100',
    'non-compliant': 'text-red-600 bg-red-100'
  };

  return (
    <Badge className={statusColors[status]}>
      {level}: {status.toUpperCase()}
    </Badge>
  );
};

// Export default design system
export default {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Progress,
  Button,
  Input,
  Textarea,
  Divider,
  ComplianceIndicator
};
