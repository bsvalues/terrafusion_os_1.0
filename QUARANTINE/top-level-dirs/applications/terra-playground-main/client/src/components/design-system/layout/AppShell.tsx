import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

export interface AppShellProps {
  /**
   * The header component
   */
  header?: ReactNode;
  /**
   * The sidebar component
   */
  sidebar?: ReactNode;
  /**
   * The footer component
   */
  footer?: ReactNode;
  /**
   * Whether the sidebar is collapsible
   */
  collapsible?: boolean;
  /**
   * Default sidebar state (open or collapsed)
   */
  defaultCollapsed?: boolean;
  /**
   * Width of the sidebar when expanded
   */
  sidebarWidth?: string;
  /**
   * Width of the sidebar when collapsed
   */
  collapsedWidth?: string;
  /**
   * Main content
   */
  children: ReactNode;
  /**
   * Additional className for the app shell
   */
  className?: string;
}

/**
 * AppShell component
 *
 * A layout component that provides a common structure for applications,
 * including configurable header, sidebar, and footer.
 *
 * @example
 * ```tsx
 * <AppShell
 *   header={<Header />}
 *   sidebar={<Sidebar />}
 *   footer={<Footer />}
 * >
 *   <main>Content goes here</main>
 * </AppShell>
 * ```
 */
export const AppShell: React.FC<AppShellProps> = ({
  header,
  sidebar,
  footer,
  collapsible = true,
  defaultCollapsed = false,
  sidebarWidth = '260px',
  collapsedWidth = '72px',
  children,
  className,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleSidebar = () => {
    if (collapsible) {
      setCollapsed(!collapsed);
    }
  };

  return (
    <div className={cn('flex h-screen flex-col bg-background', className)}>
      {/* Header */}
      {header && (
        <header className="z-20 border-b border-border bg-card shadow-sm">{header}</header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <aside
            className={cn(
              'border-r border-border bg-card transition-all duration-300 z-10',
              collapsed ? 'w-[' + collapsedWidth + ']' : 'w-[' + sidebarWidth + ']'
            )}
          >
            <div className="h-full flex flex-col overflow-y-auto">
              {/* Pass collapse state and toggle function to sidebar */}
              {React.isValidElement(sidebar)
                ? React.cloneElement(sidebar as React.ReactElement<any>, {
                    collapsed,
                    onToggleCollapse: toggleSidebar,
                  })
                : sidebar}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="h-full">{children}</div>
        </main>
      </div>

      {/* Footer */}
      {footer && <footer className="border-t border-border bg-card shadow-sm">{footer}</footer>}
    </div>
  );
};

export default AppShell;
