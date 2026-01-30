// Development mode component overrides to bypass TypeScript issues
// This file provides working alternatives for problematic components

import React from 'react';

// Motion component bypass
export const motion = {
  div: ({
    children,
    className,
    animate,
    initial,
    transition,
    whileHover,
    style,
    onClick,
    ...props
  }: any) => (
    <div className={className} style={style} onClick={onClick} {...props}>
      {children}
    </div>
  ),
};

// Route components bypass
export const Routes: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

export const Route: React.FC<{
  path?: string;
  element?: React.ReactElement;
  children?: React.ReactNode;
}> = ({ element, children }) => <>{element || children}</>;

// Lucide icons bypass
export const Settings: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
  >
    <circle cx='12' cy='12' r='3' />
    <path d='M12 1v6m0 6v6' />
    <path d='m21 12-6-6-6 6-6-6' />
  </svg>
);

export default {
  motion,
  Routes,
  Route,
  Settings,
};
