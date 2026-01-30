import React from 'react';

// Type-safe wrapper for icons
export const createIconWrapper = (IconComponent: React.ComponentType<any>) => {
  const WrappedIcon: React.FC<any> = (props) => {
    return React.createElement(IconComponent, props);
  };

  WrappedIcon.displayName = IconComponent.displayName;
  return WrappedIcon;
};

// Re-export commonly used icons with proper typing
export * from 'lucide-react';
