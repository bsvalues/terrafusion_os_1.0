import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Dashboard Layout
 *
 * A responsive grid layout for dashboard elements
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4', className)}>
      {children}
    </div>
  );
};

interface DashboardItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 'full';
  rowSpan?: 1 | 2 | 3;
}

/**
 * Dashboard Item
 *
 * A container for individual dashboard elements with configurable size
 */
export const DashboardItem: React.FC<DashboardItemProps> = ({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
}) => {
  // Define column span classes
  const colSpanClasses = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    full: 'col-span-full',
  };

  // Define row span classes
  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
  };

  return (
    <div className={cn(colSpanClasses[colSpan], rowSpanClasses[rowSpan], 'h-full', className)}>
      {children}
    </div>
  );
};

/**
 * Dashboard Header
 *
 * A header section for the dashboard with title and actions
 */
export const DashboardHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, description, actions, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-4 pt-6',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tf-heading">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 tf-font-body">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};

/**
 * Dashboard Section
 *
 * A section divider for the dashboard
 */
export const DashboardSection: React.FC<{
  title: string;
  description?: string;
  className?: string;
}> = ({ title, description, className }) => {
  return (
    <div className={cn('col-span-full mb-4 mt-6 px-4', className)}>
      <h2 className="text-xl font-semibold tf-heading">{title}</h2>
      {description && <p className="text-muted-foreground mt-1 tf-font-body">{description}</p>}
    </div>
  );
};
