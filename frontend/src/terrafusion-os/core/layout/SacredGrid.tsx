import React, { ReactNode } from "react";

interface SacredGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Base 12-column grid for the OS workspace.
 * All workspace layouts should be built on top of this.
 */
export const SacredGrid: React.FC<SacredGridProps> = ({ children, className = "" }) => {
  return <div className={`grid grid-cols-12 gap-4 h-full ${className}`}>{children}</div>;
};
