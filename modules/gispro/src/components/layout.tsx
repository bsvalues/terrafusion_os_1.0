import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutGrid, 
  Map, 
  FileText, 
  Users, 
  Settings, 
  ChevronRight, 
  Menu, 
  X,
  Home
 } from '@mui/icons-material';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * Main layout component for the application
 * 
 * Provides a consistent layout with sidebar navigation and header.
 */
export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  useEffect(() => {
    // Close sidebar on mobile when location changes
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-muted"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          <h1 className="text-xl font-semibold">
            {title || "BentonGeoPro"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* User menu or additional header actions can go here */}
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside 
          className={cn(
            "border-r bg-muted/40 w-64 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out",
            isMobile ? "fixed top-0 bottom-0 z-40 pt-16" : "",
            isMobile && !isSidebarOpen ? "-ml-64" : ""
          )}
        >
          <nav className="p-4 flex flex-col gap-2"><>

            <NavLink href="/" icon={<Home size={18} />}>Dashboard</NavLink>
            <NavLink
</>
href="/workflows" icon={<LayoutGrid size={18} />}>Workflows</NavLink><>

            <NavLink href="/map" icon={<Map size={18} />}>Map View</NavLink>
            <NavLink
</>
href="/parcels" icon={<Map size={18} />}>Parcels</NavLink><>

            <NavLink href="/documents" icon={<FileText size={18} />}>Documents</NavLink>
            <NavLink
</>
href="/users" icon={<Users size={18} />}>Users</NavLink><>

            <NavLink href="/legal-description-agent" icon={<FileText size={18} />}>
              Legal Description Agent
            </NavLink>
            <NavLink
</>
href="/collaborative-workspace" icon={<Users size={18} />}>
              Collaborative Workspace
            </NavLink><>

            <NavLink href="/websocket-demo" icon={<Users size={18} />}>
              WebSocket Demo
            </NavLink>
            <NavLink
</>
href="/settings" icon={<Settings size={18} />}>Settings</NavLink>
          </nav>
        </aside>
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

interface NavLinkProps {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Navigation link component used in the sidebar
 */
const NavLink: React.FC<NavLinkProps> = ({ href, icon, children }) => {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}>
        {icon}
        <span>{children}</span>
        {isActive && <ChevronRight size={16} className="ml-auto" />}
      </a>
    </Link>
  );
};

/**
 * Utility hook to check if a media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    mediaQuery.addEventListener('change', listener);
    
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [query]);
  
  return matches;
}