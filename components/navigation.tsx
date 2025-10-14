/**
 * TerraFusion Navigation & Layout System
 * Day 21 Component Library - Comprehensive Navigation Components
 * 
 * Complete navigation ecosystem with responsive design, accessibility compliance,
 * and seamless integration with property assessment workflows and data visualization.
 * 
 * Features:
 * - Responsive navigation with mobile support
 * - WCAG 2.1 AA accessibility compliance
 * - Multi-level navigation trees and mega menus
 * - Context-aware breadcrumb navigation
 * - Collapsible sidebar with state persistence
 * - Integration with Days 6,15,16,17,18,19,20 components
 * - Property assessment specialized layouts
 */

import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button, ButtonProps } from './button';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { LoadingSpinner } from './loading-states';
import { useNotification } from './notifications';
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from './modal';
import styles from './navigation.module.css';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavigationItem[];
  disabled?: boolean;
  external?: boolean;
  onClick?: () => void;
  metadata?: Record<string, any>;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isCurrentPage?: boolean;
}

export interface NavigationConfig {
  variant?: 'default' | 'compact' | 'minimal';
  orientation?: 'horizontal' | 'vertical';
  collapsible?: boolean;
  showIcons?: boolean;
  showBadges?: boolean;
  maxDepth?: number;
  expandOnHover?: boolean;
  persistState?: boolean;
  responsive?: boolean;
}

export interface LayoutConfig {
  header?: {
    show: boolean;
    height?: number;
    sticky?: boolean;
    background?: string;
  };
  sidebar?: {
    show: boolean;
    width?: number;
    collapsible?: boolean;
    position?: 'left' | 'right';
    overlay?: boolean;
  };
  footer?: {
    show: boolean;
    height?: number;
    sticky?: boolean;
  };
  content?: {
    padding?: number;
    maxWidth?: number;
    centered?: boolean;
  };
}

// ============================================================================
// NAVIGATION CONTEXT
// ============================================================================

interface NavigationContextType {
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
  expandedItems: Set<string>;
  toggleExpanded: (id: string) => void;
  collapsedSidebar: boolean;
  toggleSidebar: () => void;
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  config: NavigationConfig;
  setConfig: (config: Partial<NavigationConfig>) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider: React.FC<{ 
  children: React.ReactNode;
  initialConfig?: NavigationConfig;
}> = ({ children, initialConfig = {} }) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [config, setConfigState] = useState<NavigationConfig>({
    variant: 'default',
    orientation: 'vertical',
    collapsible: true,
    showIcons: true,
    showBadges: true,
    maxDepth: 3,
    expandOnHover: false,
    persistState: true,
    responsive: true,
    ...initialConfig,
  });

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsedSidebar(prev => !prev);
  }, []);

  const setConfig = useCallback((newConfig: Partial<NavigationConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Persist state in localStorage
  useEffect(() => {
    if (config.persistState && typeof window !== 'undefined') {
      const saved = localStorage.getItem('terrafusion-navigation-state');
      if (saved) {
        try {
          const { expandedItems: savedExpanded, collapsedSidebar: savedCollapsed } = JSON.parse(saved);
          setExpandedItems(new Set(savedExpanded));
          setCollapsedSidebar(savedCollapsed);
        } catch (e) {
          console.warn('Failed to restore navigation state:', e);
        }
      }
    }
  }, [config.persistState]);

  useEffect(() => {
    if (config.persistState && typeof window !== 'undefined') {
      const state = {
        expandedItems: Array.from(expandedItems),
        collapsedSidebar,
      };
      localStorage.setItem('terrafusion-navigation-state', JSON.stringify(state));
    }
  }, [expandedItems, collapsedSidebar, config.persistState]);

  return (
    <NavigationContext.Provider value={{
      activeItem,
      setActiveItem,
      expandedItems,
      toggleExpanded,
      collapsedSidebar,
      toggleSidebar,
      breadcrumbs,
      setBreadcrumbs,
      config,
      setConfig,
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

// ============================================================================
// BREADCRUMB COMPONENT
// ============================================================================

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  showRoot?: boolean;
  className?: string;
  onItemClick?: (item: BreadcrumbItem) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items: propItems,
  separator = '/',
  maxItems = 5,
  showRoot = true,
  className = '',
  onItemClick,
}) => {
  const { breadcrumbs } = useNavigation();
  const items = propItems || breadcrumbs;

  const displayItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    let processedItems = [...items];
    
    if (!showRoot && processedItems.length > 1) {
      processedItems = processedItems.slice(1);
    }

    if (processedItems.length > maxItems) {
      const firstItem = processedItems[0];
      const lastItems = processedItems.slice(-2);
      return [firstItem, { id: '...', label: '...', isEllipsis: true } as any, ...lastItems];
    }

    return processedItems;
  }, [items, showRoot, maxItems]);

  const handleItemClick = (item: BreadcrumbItem, e: React.MouseEvent) => {
    if (item.isCurrentPage || (item as any).isEllipsis) {
      e.preventDefault();
      return;
    }
    onItemClick?.(item);
  };

  return (
    <nav 
      aria-label="Breadcrumb navigation" 
      className={`flex items-center space-x-1 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = (item as any).isEllipsis;

          return (
            <li key={item.id} className="flex items-center">
              {index > 0 && (
                <span 
                  className="mx-2 text-gray-400" 
                  role="presentation" 
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}
              
              {isEllipsis ? (
                <span className="text-gray-500 px-2">...</span>
              ) : isLast || item.isCurrentPage ? (
                <span 
                  className="text-gray-900 font-medium flex items-center"
                  aria-current="page"
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  onClick={(e) => handleItemClick(item, e)}
                  className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                  aria-label={`Navigate to ${item.label}`}
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// ============================================================================ 
// NAVIGATION MENU COMPONENT
// ============================================================================

export interface NavigationMenuProps {
  items: NavigationItem[];
  variant?: 'horizontal' | 'vertical' | 'mega';
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
  maxDepth?: number;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items,
  variant = 'horizontal',
  className = '',
  onItemClick,
  maxDepth = 3,
}) => {
  const { activeItem, setActiveItem, expandedItems, toggleExpanded, config } = useNavigation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleItemClick = (item: NavigationItem, e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }

    if (item.children && item.children.length > 0) {
      e.preventDefault();
      toggleExpanded(item.id);
    } else {
      setActiveItem(item.id);
      onItemClick?.(item);
      
      if (item.onClick) {
        item.onClick();
      }
    }
  };

  const renderMenuItem = (item: NavigationItem, depth: number = 0) => {
    if (depth >= maxDepth) return null;

    const isActive = activeItem === item.id;
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isHovered = hoveredItem === item.id;

    return (
      <li key={item.id} className={`navigation-item depth-${depth}`}>
        <a
          href={item.href || '#'}
          onClick={(e) => handleItemClick(item, e)}
          onMouseEnter={() => config.expandOnHover && setHoveredItem(item.id)}
          onMouseLeave={() => config.expandOnHover && setHoveredItem(null)}
          className={`
            flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${isActive 
              ? 'bg-blue-100 text-blue-900' 
              : item.disabled 
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
            ${variant === 'horizontal' ? 'inline-flex' : 'w-full'}
          `}
          aria-current={isActive ? 'page' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-disabled={item.disabled}
          target={item.external ? '_blank' : undefined}
          rel={item.external ? 'noopener noreferrer' : undefined}
        >
          {config.showIcons && item.icon && (
            <span className="mr-2 flex-shrink-0">{item.icon}</span>
          )}
          
          <span className="truncate">{item.label}</span>
          
          {config.showBadges && item.badge && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {item.badge}
            </Badge>
          )}
          
          {hasChildren && (
            <span className="ml-auto flex-shrink-0">
              {variant === 'horizontal' ? '▼' : isExpanded ? '▼' : '▶'}
            </span>
          )}
          
          {item.external && (
            <span className="ml-1 text-xs" aria-label="Opens in new window">
              ↗
            </span>
          )}
        </a>

        {hasChildren && (isExpanded || (config.expandOnHover && isHovered)) && (
          <ul 
            className={`
              navigation-submenu
              ${variant === 'horizontal' 
                ? 'absolute top-full left-0 bg-white border rounded-md shadow-lg min-w-48 z-50' 
                : 'ml-4 mt-1 space-y-1'
              }
            `}
            role="menu"
          >
            {item.children.map((child) => renderMenuItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav 
      className={`navigation-menu navigation-menu-${variant} ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <ul 
        className={`
          ${variant === 'horizontal' 
            ? 'flex space-x-1' 
            : variant === 'mega'
              ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
              : 'space-y-1'
          }
        `}
        role="menubar"
      >
        {items.map((item) => renderMenuItem(item))}
      </ul>
    </nav>
  );
};

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

export interface SidebarProps {
  items: NavigationItem[];
  width?: number;
  collapsible?: boolean;
  position?: 'left' | 'right';
  overlay?: boolean;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onItemClick?: (item: NavigationItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  width = 256,
  collapsible = true,
  position = 'left',
  overlay = false,
  className = '',
  header,
  footer,
  onItemClick,
}) => {
  const { collapsedSidebar, toggleSidebar, activeItem, setActiveItem } = useNavigation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const sidebarWidth = collapsedSidebar ? 64 : width;
  const isVisible = !overlay || !collapsedSidebar;

  const handleItemClick = (item: NavigationItem) => {
    setActiveItem(item.id);
    onItemClick?.(item);
    
    // Close sidebar on mobile after selection
    if (isMobile && overlay) {
      toggleSidebar();
    }
  };

  const renderSidebarItem = (item: NavigationItem, depth: number = 0) => {
    const isActive = activeItem === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className={`sidebar-item depth-${depth}`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={`
                  w-full justify-start px-3 py-2 h-auto
                  ${depth > 0 ? `ml-${depth * 4}` : ''}
                  ${collapsedSidebar ? 'px-2' : ''}
                `}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
              >
                {item.icon && (
                  <span className={`flex-shrink-0 ${collapsedSidebar ? '' : 'mr-2'}`}>
                    {item.icon}
                  </span>
                )}
                
                {!collapsedSidebar && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    {hasChildren && (
                      <span className="ml-auto text-xs">▶</span>
                    )}
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {collapsedSidebar && (
              <TooltipContent side={position === 'left' ? 'right' : 'left'}>
                {item.label}
                {item.badge && ` (${item.badge})`}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {hasChildren && !collapsedSidebar && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map(child => renderSidebarItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (overlay && collapsedSidebar && isMobile) {
    return null;
  }

  return (
    <>
      {overlay && isVisible && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Dynamic width based on collapsed state - using CSS custom properties */}
      <aside
        className={`${styles.sidebar}
          ${overlay ? 'fixed' : 'relative'} 
          ${position === 'left' ? 'left-0' : 'right-0'}
          top-0 h-full bg-white border-r shadow-sm z-50 transition-all duration-300
          ${className}
        `}
        style={{ ['--sidebar-width' as string]: `${sidebarWidth}px` }}
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        {header && (
          <div className="border-b p-4">
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="absolute top-4 right-4"
                aria-label={collapsedSidebar ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsedSidebar ? '▶' : '◀'}
              </Button>
            )}
            {!collapsedSidebar && header}
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {items.map(item => renderSidebarItem(item))}
          </div>
        </nav>

        {/* Footer */}
        {footer && !collapsedSidebar && (
          <div className="border-t p-4">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
};

// ============================================================================
// TOP NAVIGATION BAR COMPONENT
// ============================================================================

export interface TopNavProps {
  brand?: React.ReactNode;
  items?: NavigationItem[];
  actions?: React.ReactNode;
  sticky?: boolean;
  height?: number;
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  brand,
  items = [],
  actions,
  sticky = true,
  height = 64,
  className = '',
  onItemClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header 
      className={`
        ${sticky ? 'sticky top-0' : ''} 
        bg-white border-b shadow-sm z-40 w-full
        ${className}
      `}
      style={{ height }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          {/* Brand */}
          {brand && (
            <div className="flex-shrink-0">
              {brand}
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8" role="navigation">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.href || '#'}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                  onItemClick?.(item);
                }}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium transition-colors
                  ${item.disabled 
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:text-blue-600'
                  }
                `}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
                {item.badge && (
                  <Badge variant="secondary" className="ml-2">
                    {item.badge}
                  </Badge>
                )}
                {item.external && <span className="ml-1 text-xs">↗</span>}
              </a>
            ))}
          </nav>

          {/* Actions */}
          {actions && (
            <div className="flex items-center space-x-4">
              {actions}
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="px-4 py-2 space-y-1">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.href || '#'}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                  onItemClick?.(item);
                  setMobileMenuOpen(false);
                }}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${item.disabled 
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

// ============================================================================
// MEGA MENU COMPONENT
// ============================================================================

export interface MegaMenuSection {
  title: string;
  items: NavigationItem[];
}

export interface MegaMenuProps {
  trigger: React.ReactNode;
  sections: MegaMenuSection[];
  width?: number;
  columns?: number;
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  trigger,
  sections,
  width = 800,
  columns = 3,
  className = '',
  onItemClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: NavigationItem) => {
    setIsOpen(false);
    onItemClick?.(item);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className="absolute top-full left-0 bg-white border rounded-lg shadow-lg z-50 p-6"
          style={{ width }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className={`grid grid-cols-${columns} gap-8`}>
            {sections.map((section, index) => (
              <div key={index} className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={item.href || '#'}
                        onClick={(e) => {
                          if (item.onClick) {
                            e.preventDefault();
                            item.onClick();
                          }
                          handleItemClick(item);
                        }}
                        className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {item.icon && <span className="mr-2">{item.icon}</span>}
                        <div>
                          <div className="font-medium">{item.label}</div>
                          {item.metadata?.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.metadata.description}
                            </div>
                          )}
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// NAVIGATION TREE COMPONENT
// ============================================================================

export interface NavigationTreeProps {
  items: NavigationItem[];
  defaultExpanded?: string[];
  maxDepth?: number;
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
  onToggleExpand?: (itemId: string, expanded: boolean) => void;
}

export const NavigationTree: React.FC<NavigationTreeProps> = ({
  items,
  defaultExpanded = [],
  maxDepth = 5,
  className = '',
  onItemClick,
  onToggleExpand,
}) => {
  const { activeItem, setActiveItem, expandedItems, toggleExpanded } = useNavigation();
  const [localExpanded, setLocalExpanded] = useState(new Set(defaultExpanded));

  const isExpanded = (itemId: string) => {
    return expandedItems.has(itemId) || localExpanded.has(itemId);
  };

  const handleToggleExpand = (itemId: string) => {
    const wasExpanded = isExpanded(itemId);
    toggleExpanded(itemId);
    setLocalExpanded(prev => {
      const newSet = new Set(prev);
      if (wasExpanded) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
    onToggleExpand?.(itemId, !wasExpanded);
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      handleToggleExpand(item.id);
    } else {
      setActiveItem(item.id);
      onItemClick?.(item);
    }
  };

  const renderTreeItem = (item: NavigationItem, depth: number = 0) => {
    if (depth >= maxDepth) return null;

    const isActive = activeItem === item.id;
    const expanded = isExpanded(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <li key={item.id} className="tree-item">
        <div
          className={`
            flex items-center py-1 px-2 rounded cursor-pointer transition-colors
            ${isActive ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'}
            ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => !item.disabled && handleItemClick(item)}
        >
          {hasChildren && (
            <button
              className="mr-1 text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(item.id);
              }}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? '▼' : '▶'}
            </button>
          )}
          
          {item.icon && (
            <span className={`${hasChildren ? 'mr-2' : 'mr-2 ml-4'}`}>
              {item.icon}
            </span>
          )}
          
          <span className="flex-1 truncate text-sm">{item.label}</span>
          
          {item.badge && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {item.badge}
            </Badge>
          )}
        </div>

        {hasChildren && expanded && (
          <ul className="tree-children">
            {item.children.map(child => renderTreeItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className={`navigation-tree ${className}`}>
      <ul className="tree-root space-y-1">
        {items.map(item => renderTreeItem(item))}
      </ul>
    </div>
  );
};

// ============================================================================
// MOBILE NAVIGATION COMPONENT
// ============================================================================

export interface MobileNavProps {
  items: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  items,
  isOpen,
  onClose,
  className = '',
  onItemClick,
}) => {
  const { activeItem, setActiveItem } = useNavigation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      toggleExpanded(item.id);
    } else {
      setActiveItem(item.id);
      onItemClick?.(item);
      onClose();
    }
  };

  const renderMobileItem = (item: NavigationItem, depth: number = 0) => {
    const isActive = activeItem === item.id;
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="mobile-nav-item">
        <button
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center justify-between px-4 py-3 text-left text-base
            ${isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-900 hover:bg-gray-50'}
            ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ paddingLeft: `${16 + depth * 20}px` }}
          disabled={item.disabled}
        >
          <div className="flex items-center">
            {item.icon && <span className="mr-3">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-2">
                {item.badge}
              </Badge>
            )}
          </div>
          
          {hasChildren && (
            <span className="text-gray-400">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children.map(child => renderMobileItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Mobile Navigation */}
      <div className={`
        fixed inset-y-0 right-0 w-80 max-w-full bg-white shadow-xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${className}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close navigation"
          >
            ✕
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto">
          {items.map(item => renderMobileItem(item))}
        </div>
      </div>
    </>
  );
};

// ============================================================================
// LAYOUT WRAPPER COMPONENT
// ============================================================================

export interface LayoutProps {
  config: LayoutConfig;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  config,
  header,
  sidebar,
  footer,
  children,
  className = '',
}) => {
  const { collapsedSidebar } = useNavigation();

  const headerHeight = config.header?.height || 64;
  const footerHeight = config.footer?.height || 48;
  const sidebarWidth = config.sidebar?.width || 256;
  const collapsedSidebarWidth = 64;

  const currentSidebarWidth = collapsedSidebar ? collapsedSidebarWidth : sidebarWidth;

  return (
    <div className={`layout-container min-h-screen flex flex-col ${className}`}>
      {/* Header */}
      {config.header?.show && header && (
        <div
          className={`
            header-container flex-shrink-0 
            ${config.header.sticky ? 'sticky top-0 z-30' : ''}
          `}
          style={{ 
            height: headerHeight,
            backgroundColor: config.header.background || 'white',
          }}
        >
          {header}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        {config.sidebar?.show && sidebar && (
          <div
            className={`
              sidebar-container flex-shrink-0 transition-all duration-300
              ${config.sidebar.overlay ? 'absolute z-20' : 'relative'}
              ${config.sidebar.position === 'right' ? 'order-2' : ''}
            `}
            style={{ width: currentSidebarWidth }}
          >
            {sidebar}
          </div>
        )}

        {/* Content */}
        <main
          className={`
            content-container flex-1 overflow-auto
            ${config.content?.centered ? 'mx-auto' : ''}
          `}
          style={{
            padding: config.content?.padding || 16,
            maxWidth: config.content?.maxWidth || 'none',
            marginLeft: config.sidebar?.show && !config.sidebar.overlay && config.sidebar.position !== 'right' 
              ? currentSidebarWidth 
              : 0,
            marginRight: config.sidebar?.show && !config.sidebar.overlay && config.sidebar.position === 'right' 
              ? currentSidebarWidth 
              : 0,
          }}
        >
          {children}
        </main>
      </div>

      {/* Footer */}
      {config.footer?.show && footer && (
        <div
          className={`
            footer-container flex-shrink-0
            ${config.footer.sticky ? 'sticky bottom-0' : ''}
          `}
          style={{ height: footerHeight }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PROPERTY ASSESSMENT SPECIALIZED NAVIGATION
// ============================================================================

export interface PropertyNavProps {
  propertyId?: string;
  assessmentPhase?: 'inspection' | 'analysis' | 'valuation' | 'report';
  onPhaseChange?: (phase: string) => void;
  className?: string;
}

export const PropertyNav: React.FC<PropertyNavProps> = ({
  propertyId,
  assessmentPhase = 'inspection',
  onPhaseChange,
  className = '',
}) => {
  const phases = [
    { id: 'inspection', label: 'Property Inspection', icon: '🏠', href: `/property/${propertyId}/inspection` },
    { id: 'analysis', label: 'Data Analysis', icon: '📊', href: `/property/${propertyId}/analysis` },
    { id: 'valuation', label: 'Valuation', icon: '💰', href: `/property/${propertyId}/valuation` },
    { id: 'report', label: 'Report Generation', icon: '📄', href: `/property/${propertyId}/report` },
  ];

  return (
    <nav className={`property-nav ${className}`} aria-label="Property assessment phases">
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {phases.map((phase, index) => {
          const isActive = phase.id === assessmentPhase;
          const isCompleted = phases.findIndex(p => p.id === assessmentPhase) > index;
          
          return (
            <button
              key={phase.id}
              onClick={() => onPhaseChange?.(phase.id)}
              className={`
                flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : isCompleted
                    ? 'text-green-600 hover:bg-white hover:bg-opacity-50'
                    : 'text-gray-600 hover:bg-white hover:bg-opacity-50'
                }
              `}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="mr-2">{phase.icon}</span>
              <span className="hidden sm:inline">{phase.label}</span>
              <span className="sm:hidden">{phase.id}</span>
              {isCompleted && <span className="ml-2 text-green-500">✓</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ============================================================================
// QUICK ACCESS TOOLBAR
// ============================================================================

export interface QuickAccessItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string | number;
  disabled?: boolean;
}

export interface QuickAccessToolbarProps {
  items: QuickAccessItem[];
  position?: 'top' | 'bottom' | 'floating';
  className?: string;
}

export const QuickAccessToolbar: React.FC<QuickAccessToolbarProps> = ({
  items,
  position = 'floating',
  className = '',
}) => {
  return (
    <div 
      className={`
        quick-access-toolbar flex items-center space-x-2 p-2 bg-white border rounded-lg shadow-sm
        ${position === 'floating' ? 'fixed bottom-4 right-4 z-40' : ''}
        ${position === 'top' ? 'border-b' : ''}
        ${position === 'bottom' ? 'border-t' : ''}
        ${className}
      `}
    >
      {items.map((item) => (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                disabled={item.disabled}
                className="relative"
                aria-label={item.label}
              >
                {item.icon}
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 text-xs min-w-[16px] h-4 flex items-center justify-center p-0"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.label}
              {item.badge && ` (${item.badge})`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};