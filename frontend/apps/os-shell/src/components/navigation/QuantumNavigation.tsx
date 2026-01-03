/**
 * ═══════════════════════════════════════════════════════════════
 * QUANTUM NAVIGATION SYSTEM - TERRAFUSION GOVERNANCE PLATFORM
 * Advanced glassmorphic navigation with terra-cyan theming
 * ═══════════════════════════════════════════════════════════════
 */

import { TerraSphere } from '@/components/brand/TerraSphere';
import { cn } from '@utils/cn';
import * as React from 'react';
import { useState } from 'react';
import './QuantumNavigation.css';

interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  badge?: string | number;
  children?: NavigationItem[];
  onClick?: () => void;
}

interface QuantumNavigationProps {
  items: NavigationItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

interface NavigationItemProps {
  item: NavigationItem;
  level?: number;
  collapsed?: boolean;
  isActive?: boolean;
  onItemClick?: (item: NavigationItem) => void;
}

const NavigationItemComponent: React.FC<NavigationItemProps> = ({
  item,
  level = 0,
  collapsed = false,
  isActive = false,
  onItemClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }

    if (item.onClick) {
      item.onClick();
    }

    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <div className='quantum-nav-item-container'>
      <button
        onClick={handleClick}
        className={cn(
          'quantum-nav-item',
          'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
          'text-left hover:bg-cyan-400/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
          level > 0 && 'ml-4 pl-6',
          isActive && 'bg-cyan-400/20 terra-glow',
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? item.label : undefined}
      >
        {/* Icon */}
        {item.icon && <div className='flex-shrink-0 w-5 h-5 text-cyan-400'>{item.icon}</div>}

        {/* Label and Badge */}
        {!collapsed && (
          <>
            <span className='flex-1 text-gray-200 font-medium'>{item.label}</span>

            {item.badge && (
              <span className='px-2 py-1 text-xs bg-cyan-400/20 text-cyan-400 rounded-full'>
                {item.badge}
              </span>
            )}

            {hasChildren && (
              <div
                className={cn(
                  'w-4 h-4 text-cyan-400 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
              >
                <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            )}
          </>
        )}
      </button>

      {/* Children */}
      {hasChildren && !collapsed && isExpanded && (
        <div className='quantum-nav-children mt-1 space-y-1'>
          {item.children!.map((child) => (
            <NavigationItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              collapsed={collapsed}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const QuantumNavigation: React.FC<QuantumNavigationProps> = ({
  items,
  collapsed = false,
  onToggle,
  className,
}) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const handleItemClick = (item: NavigationItem) => {
    setActiveItem(item.id);
  };

  return (
    <nav
      className={cn(
        'quantum-navigation',
        'h-full flex flex-col bg-gray-900/50 border-r border-cyan-400/20',
        'terra-glass transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className='quantum-nav-header p-4 border-b border-cyan-400/20'>
        <div className='flex items-center gap-3'>
          <TerraSphere size={collapsed ? 'sm' : 'md'} variant='quantum' className='flex-shrink-0' />

          {!collapsed && (
            <div className='flex-1 min-w-0'>
              <h2 className='text-lg font-semibold text-cyan-400 truncate'>TerraFusion</h2>
              <p className='text-xs text-gray-400 truncate'>Quantum Governance</p>
            </div>
          )}

          {onToggle && (
            <button
              onClick={onToggle}
              className={cn(
                'p-2 rounded-lg text-cyan-400 hover:bg-cyan-400/10',
                'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                collapsed && 'w-full justify-center'
              )}
              title={collapsed ? 'Expand Navigation' : 'Collapse Navigation'}
            >
              <div
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  collapsed && 'rotate-180'
                )}
              >
                <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 19l-7-7 7-7m8 14l-7-7 7-7'
                  />
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className='quantum-nav-content flex-1 overflow-y-auto p-2 space-y-1'>
        {items.map((item) => (
          <NavigationItemComponent
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={activeItem === item.id}
            onItemClick={handleItemClick}
          />
        ))}
      </div>

      {/* Footer */}
      <div className='quantum-nav-footer p-4 border-t border-cyan-400/20'>
        {!collapsed ? (
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-xs text-gray-400'>
              <div className='w-2 h-2 rounded-full bg-green-400 animate-pulse'></div>
              <span>System Online</span>
            </div>
            <div className='text-xs text-gray-500'>Quantum Protocol v1.0.0</div>
          </div>
        ) : (
          <div className='flex justify-center'>
            <div
              className='w-2 h-2 rounded-full bg-green-400 animate-pulse'
              title='System Online'
            ></div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Breadcrumb component for navigation context
interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface QuantumBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const QuantumBreadcrumb: React.FC<QuantumBreadcrumbProps> = ({ items, className }) => {
  return (
    <nav
      className={cn('quantum-breadcrumb', 'flex items-center space-x-2 text-sm', className)}
      aria-label='Breadcrumb'
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <div className='text-cyan-400/50'>
              <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </div>
          )}

          {index === items.length - 1 ? (
            <span className='text-cyan-400 font-medium'>{item.label}</span>
          ) : (
            <button
              onClick={item.onClick}
              className='text-gray-400 hover:text-cyan-400 transition-colors duration-200 focus:outline-none focus:text-cyan-400'
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Navigation context for state management
interface NavigationContextType {
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const NavigationContext = React.createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = React.useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  defaultCollapsed = false,
}) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <NavigationContext.Provider
      value={{
        activeItem,
        setActiveItem,
        collapsed,
        setCollapsed,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export type { BreadcrumbItem, NavigationItem };
export default QuantumNavigation;
