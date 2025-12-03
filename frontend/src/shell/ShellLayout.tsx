/**
 * TerraFusion Shell Layout - Canonical V2
 *
 * Three-tier OS layout:
 * - Header (county branding, connection status, mode toggle)
 * - Navigation (suite shortcuts)
 * - Content (main workspace)
 * - Taskbar (open suites, AI access)
 * - Right Drawer (AI assistant, optional)
 *
 * Uses Design System V2 tokens from shell-tokens.css and shell-base.css
 */

import React, { ReactNode } from 'react';
import '../styles/shell-base.css';
import '../styles/shell-tokens.css';
import '../styles/terrafusion-brand.css';
import '../styles/terrafusion-os.css';

interface ShellLayoutProps {
  children: ReactNode;
  rightDrawer?: ReactNode;
  rightDrawerCollapsed?: boolean;
  currentSuite?: string;
}

interface TopBarProps {
  countyName?: string;
  environment?: 'development' | 'staging' | 'production';
  currentSuite?: string;
  userName?: string;
  onModeToggle?: () => void;
}

interface NavItem {
  id: string;
  name: string;
  icon: string;
  badge?: number;
}

interface LeftRailProps {
  suites: NavItem[];
  activeSuiteId?: string;
  onSuiteClick: (id: string) => void;
}

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

interface RightDrawerProps {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

/**
 * Top Bar - County branding and system status
 */
export const TopBar: React.FC<TopBarProps> = ({
  countyName = 'Benton County',
  environment = 'development',
  currentSuite,
  userName = 'Admin User',
  onModeToggle,
}) => {
  return (
    <header className='terrafusion-os-header'>
      <div className='tf-header-left'>
        {/* Logo and branding */}
        <div className='tf-logo-cluster'>
          <div className='tf-consciousness-orb quantum-hover' />
          <div>
            <div className='terra-heading text-sm'>TerraFusion OS</div>
            <div className='terra-caption text-xs'>Government. Transcended.</div>
          </div>
        </div>

        {/* County badge */}
        <span className='tf-county-badge'>{countyName} Assessor</span>

        {/* Current suite indicator */}
        {currentSuite && (
          <span
            className='terra-caption'
            style={{
              padding: 'var(--tf-space-2) var(--tf-space-3)',
              borderRadius: 'var(--tf-radius-md)',
              backgroundColor: 'rgba(var(--suite-accent-rgb, 0, 217, 255), 0.1)',
              color: 'var(--suite-accent, var(--tf-color-primary))',
              fontSize: 'var(--tf-text-sm)',
            }}
          >
            🏠 {currentSuite}
          </span>
        )}
      </div>

      <div className='tf-header-right'>
        {/* Mode toggle */}
        {onModeToggle && (
          <button
            className='terrafusion-view-toggle terra-glass tf-ultimate-focusable'
            type='button'
            onClick={onModeToggle}
          >
            County Staff ▸ Quantum Power
          </button>
        )}

        {/* Connection status */}
        <div className='tf-connection-status'>
          <span className='tf-status-indicator connected' />
          <span className='tf-status-text'>TF-Substrate: Connected</span>
        </div>

        {/* Environment indicator */}
        {environment !== 'production' && (
          <span
            className='terra-caption'
            style={{
              padding: 'var(--tf-space-1) var(--tf-space-2)',
              borderRadius: 'var(--tf-radius-sm)',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              color: '#F59E0B',
              fontSize: 'var(--tf-text-xs)',
              fontWeight: 'var(--tf-weight-medium)',
              textTransform: 'uppercase',
            }}
          >
            {environment}
          </span>
        )}

        {/* User info */}
        <div
          className='terra-caption'
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--tf-space-2)',
          }}
        >
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'var(--tf-color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--tf-text-xs)',
              fontWeight: 'var(--tf-weight-semibold)',
            }}
          >
            {userName.charAt(0)}
          </span>
          <span>{userName}</span>
        </div>
      </div>
    </header>
  );
};

/**
 * Left Rail - Suite shortcuts
 */
export const LeftRail: React.FC<LeftRailProps> = ({ suites, activeSuiteId, onSuiteClick }) => {
  return (
    <nav className='terrafusion-os-navigation'>
      <button
        className={`terrafusion-nav-button ${!activeSuiteId ? 'active' : ''}`}
        onClick={() => (window.location.hash = '#/')}
      >
        🧭 Suites
      </button>

      {suites.map((suite) => (
        <button
          key={suite.id}
          className={`terrafusion-nav-button ${activeSuiteId === suite.id ? 'active' : ''}`}
          onClick={() => onSuiteClick(suite.id)}
          title={suite.name}
        >
          {suite.icon} {suite.name}
          {suite.badge !== undefined && suite.badge > 0 && (
            <span
              className='tf-badge'
              style={{
                marginLeft: 'auto',
                fontSize: 'var(--tf-text-xs)',
                padding: 'var(--tf-space-1) var(--tf-space-2)',
                borderRadius: 'var(--tf-radius-full)',
                backgroundColor: 'var(--tf-color-primary)',
                color: 'var(--tf-color-background)',
                fontWeight: 'var(--tf-weight-semibold)',
              }}
            >
              {suite.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

/**
 * Workspace Header - Optional header for content area
 */
export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div
      className='tf-workspace-header'
      style={{
        padding: 'var(--tf-space-6)',
        borderBottom: '1px solid var(--tf-color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--tf-space-4)',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 'var(--tf-text-2xl)',
            fontWeight: 'var(--tf-weight-bold)',
            color: 'var(--tf-color-text-primary)',
            marginBottom: subtitle ? 'var(--tf-space-1)' : 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 'var(--tf-text-sm)',
              color: 'var(--tf-color-text-secondary)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className='tf-workspace-actions'>{actions}</div>}
    </div>
  );
};

/**
 * Right Drawer - AI assistant or context panel
 */
export const RightDrawer: React.FC<RightDrawerProps> = ({
  title = 'AI Assistant',
  children,
  onClose,
}) => {
  return (
    <aside className='terrafusion-os-rightdrawer'>
      <div
        className='tf-drawer-header'
        style={{
          padding: 'var(--tf-space-4)',
          borderBottom: '1px solid var(--tf-color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontSize: 'var(--tf-text-base)',
            fontWeight: 'var(--tf-weight-semibold)',
            color: 'var(--tf-color-text-primary)',
          }}
        >
          {title}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className='tf-btn-icon'
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--tf-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--tf-color-border)',
              backgroundColor: 'transparent',
              color: 'var(--tf-color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
      </div>
      <div
        className='tf-drawer-content'
        style={{
          padding: 'var(--tf-space-4)',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </aside>
  );
};

/**
 * Main Shell Layout
 */
export const ShellLayout: React.FC<ShellLayoutProps> = ({
  children,
  rightDrawer,
  rightDrawerCollapsed = false,
  currentSuite,
}) => {
  return (
    <div
      className='terrafusion-os-container calm-mode'
      style={
        {
          '--current-suite': currentSuite,
        } as React.CSSProperties
      }
    >
      {children}

      {/* Right drawer (conditionally rendered) */}
      {!rightDrawerCollapsed && rightDrawer}

      {/* Taskbar */}
      <footer className='terrafusion-os-taskbar'>
        <div className='tf-taskbar-left'>
          <span className='terra-caption'>Open suites:</span>
          {currentSuite && (
            <span
              className='terra-caption'
              style={{
                padding: 'var(--tf-space-1) var(--tf-space-3)',
                borderRadius: 'var(--tf-radius-md)',
                backgroundColor: 'rgba(var(--suite-accent-rgb, 0, 217, 255), 0.15)',
                color: 'var(--suite-accent, var(--tf-color-primary))',
                fontSize: 'var(--tf-text-sm)',
              }}
            >
              {currentSuite}
            </span>
          )}
        </div>
        <button className='tf-transcendent-button tf-ultimate-focusable'>🤖 Open AI Drawer</button>
      </footer>
    </div>
  );
};
