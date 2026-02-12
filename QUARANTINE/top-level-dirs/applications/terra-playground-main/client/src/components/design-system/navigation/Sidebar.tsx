import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight  } from '@mui/icons-material';

/**
 * Sidebar variants using class-variance-authority
 */
const sidebarVariants = cva('h-full flex flex-col transition-all duration-300', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground',
      primary: 'bg-primary/10 text-foreground',
      dark: 'bg-slate-900 text-white',
      glass: 'tf-glass text-foreground',
    },
    elevation: {
      none: 'shadow-none',
      low: 'shadow-sm',
      medium: 'shadow-md',
      high: 'shadow-lg',
    },
    border: {
      none: 'border-none',
      right: 'border-r border-border',
      left: 'border-l border-border',
    },
  },
  defaultVariants: {
    variant: 'default',
    elevation: 'none',
    border: 'right',
  },
});

export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  /**
   * Logo or header content for the sidebar
   */
  logo?: React.ReactNode;
  /**
   * Footer content for the sidebar
   */
  footer?: React.ReactNode;
  /**
   * Whether the sidebar is collapsible
   */
  collapsible?: boolean;
  /**
   * Whether the sidebar is currently collapsed
   */
  collapsed?: boolean;
  /**
   * Callback for when the sidebar collapse state changes
   */
  onToggleCollapse?: () => void;
  /**
   * Width of the sidebar when expanded
   */
  width?: string;
  /**
   * Width of the sidebar when collapsed
   */
  collapsedWidth?: string;
}

/**
 * Sidebar component
 *
 * A navigation component that displays on the side of the application.
 * Can be collapsible and customized with various styles.
 *
 * @example
 * ```tsx
 * <Sidebar
 *   logo={<Logo />}
 *   collapsible
 *   collapsed={isSidebarCollapsed}
 *   onToggleCollapse={toggleSidebar}
 * >
 *   <SideNavigation items={navigationItems} />
 * </Sidebar>
 * ```
 */
export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      variant,
      elevation,
      border,
      logo,
      footer,
      collapsible = true,
      collapsed = false,
      onToggleCollapse,
      width = '260px',
      collapsedWidth = '72px',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <aside
        ref={ref}
        className={cn(sidebarVariants({ variant, elevation, border }), className)}
        style={{ width: collapsed ? collapsedWidth : width }}
        {...props}
      >
        {/* Logo/Header section */}
        {logo && (
          <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
            <div className={cn('flex-1 transition-opacity duration-200', collapsed && 'opacity-0')}>
              {logo}
            </div>

            {collapsible && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto py-4">{children}</div>

        {/* Footer section */}
        {footer && (
          <div
            className={cn(
              'border-t border-border/50 px-4 py-4',
              collapsed && 'flex items-center justify-center'
            )}
          >
            {footer}
          </div>
        )}
      </aside>
    );
  }
);

Sidebar.displayName = 'Sidebar';

export default Sidebar;
