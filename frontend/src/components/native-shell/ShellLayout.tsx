/**
 * TerraFusion OS - Shell Layout Component
 *
 * Three-tier shell structure:
 * - Top Bar (county, env, suite, search, user)
 * - Left Rail (suite navigation)
 * - Main Workspace (suite content)
 * - Right Drawer (AI assistant)
 *
 * Uses TerraFusion Design System V2 tokens.
 */

import React from 'react';

interface ShellLayoutProps {
  /** Top bar content (county name, environment, search, user menu) */
  topBar?: React.ReactNode;

  /** Left rail content (suite navigation) */
  leftRail?: React.ReactNode;

  /** Main workspace content (active suite) */
  children: React.ReactNode;

  /** Right drawer content (AI assistant) */
  rightDrawer?: React.ReactNode;

  /** Whether right drawer is collapsed */
  rightDrawerCollapsed?: boolean;

  /** Current suite ID for accent color */
  currentSuite?: string;
}

export function ShellLayout({
  topBar,
  leftRail,
  children,
  rightDrawer,
  rightDrawerCollapsed = false,
  currentSuite,
}: ShellLayoutProps) {
  return (
    <div className='tf-shell' data-suite={currentSuite}>
      {/* Top Bar */}
      {topBar && <div className='tf-topbar'>{topBar}</div>}

      {/* Shell Body (3-column layout) */}
      <div className='tf-shell-body'>
        {/* Left Suite Rail */}
        {leftRail && <aside className='tf-leftrail'>{leftRail}</aside>}

        {/* Main Workspace */}
        <main className='tf-workspace'>{children}</main>

        {/* Right Drawer (AI Assistant) */}
        {rightDrawer && (
          <aside className={`tf-rightdrawer ${rightDrawerCollapsed ? 'collapsed' : ''}`}>
            {!rightDrawerCollapsed && rightDrawer}
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Top Bar Component
 */
interface TopBarProps {
  countyName?: string;
  environment?: 'development' | 'staging' | 'production';
  currentSuite?: string;
  onSearch?: (query: string) => void;
  userName?: string;
}

export function TopBar({
  countyName = 'Benton County',
  environment = 'development',
  currentSuite,
  onSearch,
  userName = 'Admin User',
}: TopBarProps) {
  return (
    <>
      {/* Left section */}
      <div className='tf-topbar-left'>
        <div className='tf-topbar-logo'>
          <span>⚡</span>
          <span>TerraFusion OS</span>
        </div>

        <div
          className='tf-divider'
          style={{ height: '1.5rem', width: '1px', margin: '0 var(--tf-space-2)' }}
        />

        <div className='tf-topbar-breadcrumb'>
          <span>{countyName}</span>
          <span className='tf-topbar-breadcrumb-separator'>›</span>
          <span className='tf-badge tf-badge-info' style={{ textTransform: 'uppercase' }}>
            {environment}
          </span>
          {currentSuite && (
            <>
              <span className='tf-topbar-breadcrumb-separator'>›</span>
              <span style={{ color: 'var(--suite-accent, var(--tf-color-primary))' }}>
                {currentSuite}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Center section (search) */}
      <div className='tf-topbar-center'>
        <div className='tf-topbar-search'>
          <input
            type='search'
            className='tf-input'
            placeholder='Search suites, properties, parcels...'
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Right section */}
      <div className='tf-topbar-right'>
        <div className='tf-topbar-actions'>
          <button className='tf-btn tf-btn-ghost' title='Notifications'>
            🔔
          </button>
          <button className='tf-btn tf-btn-ghost' title='Settings'>
            ⚙️
          </button>
          <button className='tf-btn tf-btn-ghost' title='Help'>
            ❓
          </button>
          <div
            className='tf-divider'
            style={{ height: '1.5rem', width: '1px', margin: '0 var(--tf-space-2)' }}
          />
          <button className='tf-btn tf-btn-ghost'>
            <span>{userName}</span>
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Left Suite Rail Component
 */
interface LeftRailProps {
  suites: Array<{
    id: string;
    name: string;
    icon: string;
    badge?: number;
  }>;
  activeSuiteId?: string;
  onSuiteClick?: (suiteId: string) => void;
}

export function LeftRail({ suites, activeSuiteId, onSuiteClick }: LeftRailProps) {
  return (
    <div className='tf-leftrail-section'>
      <div className='tf-leftrail-section-title'>Suites</div>
      <nav className='tf-leftrail-nav'>
        {suites.map((suite) => (
          <a
            key={suite.id}
            href={`#${suite.id}`}
            className={`tf-suite-nav-item ${activeSuiteId === suite.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onSuiteClick?.(suite.id);
            }}
          >
            <span className='tf-suite-nav-item-icon'>{suite.icon}</span>
            <span>{suite.name}</span>
            {suite.badge !== undefined && suite.badge > 0 && (
              <span className='tf-suite-nav-item-badge'>{suite.badge}</span>
            )}
          </a>
        ))}
      </nav>
    </div>
  );
}

/**
 * Workspace Header Component
 */
interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function WorkspaceHeader({ title, subtitle, actions }: WorkspaceHeaderProps) {
  return (
    <div className='tf-workspace-header'>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className='tf-workspace-title'>{title}</h1>
          {subtitle && <p className='tf-workspace-subtitle'>{subtitle}</p>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Right Drawer Component
 */
interface RightDrawerProps {
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
}

export function RightDrawer({ title = 'AI Assistant', onClose, children }: RightDrawerProps) {
  return (
    <>
      <div className='tf-rightdrawer-header'>
        <h2 className='tf-rightdrawer-title'>{title}</h2>
        {onClose && (
          <button className='tf-btn tf-btn-ghost' onClick={onClose}>
            ✕
          </button>
        )}
      </div>
      <div className='tf-rightdrawer-content'>{children}</div>
    </>
  );
}
