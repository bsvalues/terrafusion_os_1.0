import React, {ReactNode, useState} from 'react';
import {cn} from '@/lib/utils';
import {ChevronLeft, ChevronRight} from '@mui/icons-material';
import {Button} from '@/components/ui/button';

interface FullScreenMapLayoutProps {/**
   * The main content (map) to display
   */
  children: ReactNode;

  /**
   * Header content to display above the map
   */
  headerContent?: ReactNode;

  /**
   * Sidebar content to display alongside the map
   */
  sidebarContent?: ReactNode;

  /**
   * Footer content to display below the map
   */
  footerContent?: ReactNode;

  /**
   * Whether the sidebar is collapsed by default
   */
  defaultCollapsed?: boolean;

  /**
   * Sidebar width in pixels when expanded
   */
  sidebarWidth?: number;}

/**
 * A layout component for creating beautiful full-screen map experiences
 * with collapsible sidebar, header, and footer elements.
 */
export function FullScreenMapLayout({children,
  headerContent,
  sidebarContent,
  footerContent,
  defaultCollapsed = false,
  sidebarWidth = 320,}: FullScreenMapLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed);

  // Calculate the main content width based on sidebar state
  const mainStyle = {
    left: sidebarCollapsed ? '0' : `${sidebarWidth}px`,
    width: sidebarCollapsed ? '100%' : `calc(100% - ${sidebarWidth}px)`,
  };

  // Calculate the sidebar width
  const sidebarStyle = {
    width: sidebarCollapsed ? '0' : `${sidebarWidth}px`,
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">{/* Header (optional) */}
      {headerContent && (<header className="flex-shrink-0 border-b shadow-sm z-30 bg-background">{headerContent}</header>)}

      {/* Main content area */}<div className="flex-grow flex relative overflow-hidden">{/* Sidebar (optional) */}
        {sidebarContent && (<aside
            className={cn(
              'absolute h-full top-0 left-0 z-20 border-r bg-background',
              'transition-all duration-300 ease-in-out overflow-hidden'
            )}
            style={sidebarStyle}
          ><div className="h-full flex flex-col overflow-hidden">{/* Sidebar content */}<div className="flex-grow overflow-y-auto">{sidebarContent}</div></div></aside>)}

        {/* Toggle button for sidebar */}
        {sidebarContent && (<Button
            variant="secondary"
            size="sm"
            onClick={() =>setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              'absolute top-4 z-30 shadow-md',
              'transition-all duration-300 ease-in-out',
              sidebarCollapsed ? 'left-4' : `left-[${sidebarWidth - 16}px]`
            )}
            style={{
              left: sidebarCollapsed ? '1rem' : `${sidebarWidth - 16}px`,
            }}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (<ChevronRight className="h-4 w-4" />) : (<ChevronLeft className="h-4 w-4" />)}</Button>)}

        {/* Main content (Map) */}<main
          className={cn(
            'absolute top-0 h-full bg-muted overflow-hidden',
            'transition-all duration-300 ease-in-out'
          )}
          style={mainStyle}
        >{children}</main></div>{/* Footer (optional) */}
      {footerContent && (<footer className="flex-shrink-0 border-t z-30 bg-background">{footerContent}</footer>)}</div>
  );
}
