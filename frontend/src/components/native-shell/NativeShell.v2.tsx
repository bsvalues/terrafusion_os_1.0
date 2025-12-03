/**
 * TerraFusion Native Shell V2 - Design System Implementation
 *
 * Shell v2 with clean OS aesthetic:
 * - Uses TerraFusion Design System tokens
 * - Three-tier layout (TopBar + LeftRail + Workspace + RightDrawer)
 * - Calm OS, not busy SaaS dashboard
 * - Suite-specific accent colors
 * - High signal, low noise
 */

import React, { useEffect, useState } from 'react';
import { AIDrawer } from './AIDrawer';
import { DualModeProvider } from './DualModeContext';
import { ModeToggle } from './ModeToggle';
import { LeftRail, RightDrawer, ShellLayout, TopBar, WorkspaceHeader } from './ShellLayout';
import { suiteRegistry } from './SuiteRegistry';
import { AssessmentSuite } from './suites/AssessmentSuite';

// Suite navigation items
const SUITE_NAV_ITEMS = [
  { id: 'assessment', name: 'Assessment', icon: '🏠', badge: 0 },
  { id: 'levy', name: 'Levy', icon: '💰', badge: 0 },
  { id: 'gis', name: 'GIS', icon: '🗺️', badge: 0 },
  { id: 'collections', name: 'Collections', icon: '📊', badge: 3 },
  { id: 'sync', name: 'Sync', icon: '🔄', badge: 0 },
  { id: 'flow', name: 'Flow', icon: '⚡', badge: 0 },
  { id: 'insights', name: 'Insights', icon: '💡', badge: 0 },
  { id: 'agent', name: 'Agent', icon: '🤖', badge: 0 },
  { id: 'admin', name: 'Admin', icon: '⚙️', badge: 0 },
];

export const NativeShell: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [activeSuiteId, setActiveSuiteId] = useState<string | undefined>();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(true);

  // Handle routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      setCurrentRoute(hash);

      // Extract suite ID from route
      const suiteMatch = hash.match(/^\/suite\/([^/]+)/);
      if (suiteMatch) {
        setActiveSuiteId(suiteMatch[1]);
      } else {
        setActiveSuiteId(undefined);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSuiteClick = (suiteId: string) => {
    window.location.hash = `#/suite/${suiteId}`;
  };

  const renderContent = () => {
    // Root route: Show launcher
    if (currentRoute === '/') {
      return (
        <>
          <WorkspaceHeader title='TerraFusion OS' subtitle='Select a suite to begin' />
          <div className='tf-workspace-content'>
            <SuiteLauncherGrid />
          </div>
        </>
      );
    }

    // Suite route: Show suite content
    const suiteMatch = currentRoute.match(/^\/suite\/([^/]+)/);
    if (suiteMatch) {
      const suiteId = suiteMatch[1];
      const suite = suiteRegistry.getSuite(suiteId);

      if (!suite) {
        return (
          <div className='tf-workspace-content'>
            <div className='tf-empty'>
              <div className='tf-empty-icon'>⚠️</div>
              <h2 className='tf-empty-title'>Suite Not Found</h2>
              <p className='tf-empty-description'>The suite "{suiteId}" could not be loaded.</p>
              <button
                onClick={() => (window.location.hash = '#/')}
                className='tf-btn tf-btn-primary'
              >
                Return to Launcher
              </button>
            </div>
          </div>
        );
      }

      if (suite.status === 'loading') {
        return (
          <div className='tf-workspace-content'>
            <div className='tf-loading'>
              <div style={{ textAlign: 'center' }}>
                <div className='w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
                <h2 className='tf-empty-title'>Loading {suite.manifest.label}</h2>
                <p className='tf-empty-description'>
                  Starting engines and mounting applications...
                </p>
              </div>
            </div>
          </div>
        );
      }

      if (suite.status === 'error') {
        return (
          <div className='tf-workspace-content'>
            <div className='tf-empty'>
              <div className='tf-empty-icon'>❌</div>
              <h2 className='tf-empty-title'>Suite Failed to Load</h2>
              <p className='tf-empty-description' style={{ color: 'var(--tf-status-error)' }}>
                {suite.error}
              </p>
              <button
                onClick={() => (window.location.hash = '#/')}
                className='tf-btn tf-btn-primary'
              >
                Return to Launcher
              </button>
            </div>
          </div>
        );
      }

      // Suite active: Render suite-specific component
      if (suiteId === 'assessment') {
        return <AssessmentSuite />;
      }

      // Default: Show suite placeholder
      return (
        <>
          <WorkspaceHeader
            title={suite.manifest.label}
            subtitle={suite.manifest.description}
            actions={
              <button
                onClick={() => (window.location.hash = '#/')}
                className='tf-btn tf-btn-secondary'
              >
                ← Back to Launcher
              </button>
            }
          />
          <div className='tf-workspace-content'>
            <div className='tf-card'>
              <div className='tf-card-header' style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--tf-text-4xl)', marginBottom: 'var(--tf-space-4)' }}>
                  {suite.manifest.icon || '📦'}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 'var(--tf-space-4)',
                  marginBottom: 'var(--tf-space-6)',
                }}
              >
                <div className='tf-card' style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      color: 'var(--suite-accent, var(--tf-color-primary))',
                      fontSize: 'var(--tf-text-2xl)',
                      fontWeight: 'var(--tf-weight-bold)',
                    }}
                  >
                    {suite.mountedApps.size}
                  </div>
                  <div
                    style={{
                      color: 'var(--tf-color-text-secondary)',
                      fontSize: 'var(--tf-text-sm)',
                    }}
                  >
                    Web Apps Running
                  </div>
                </div>

                <div className='tf-card' style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      color: 'var(--suite-accent, var(--tf-color-primary))',
                      fontSize: 'var(--tf-text-2xl)',
                      fontWeight: 'var(--tf-weight-bold)',
                    }}
                  >
                    {suite.mountedModules.size}
                  </div>
                  <div
                    style={{
                      color: 'var(--tf-color-text-secondary)',
                      fontSize: 'var(--tf-text-sm)',
                    }}
                  >
                    Native Modules
                  </div>
                </div>

                <div className='tf-card' style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      color: 'var(--suite-accent, var(--tf-color-primary))',
                      fontSize: 'var(--tf-text-2xl)',
                      fontWeight: 'var(--tf-weight-bold)',
                    }}
                  >
                    {suite.manifest.aiAgents.length}
                  </div>
                  <div
                    style={{
                      color: 'var(--tf-color-text-secondary)',
                      fontSize: 'var(--tf-text-sm)',
                    }}
                  >
                    AI Agents
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', color: 'var(--tf-color-text-tertiary)' }}>
                <p style={{ marginBottom: 'var(--tf-space-2)' }}>
                  🚧 Suite implementation in progress
                </p>
                <p style={{ fontSize: 'var(--tf-text-sm)' }}>
                  Web apps and native modules will be mounted here
                </p>
              </div>
            </div>
          </div>
        </>
      );
    }

    // 404
    return (
      <div className='tf-workspace-content'>
        <div className='tf-empty'>
          <div className='tf-empty-icon'>🔍</div>
          <h2 className='tf-empty-title'>Page Not Found</h2>
          <p className='tf-empty-description'>The requested route does not exist.</p>
          <button onClick={() => (window.location.hash = '#/')} className='tf-btn tf-btn-primary'>
            Return to Launcher
          </button>
        </div>
      </div>
    );
  };

  return (
    <DualModeProvider defaultMode='county-staff' persistMode={true}>
      {/* Mode Toggle (always visible) */}
      <ModeToggle />

      <ShellLayout
        currentSuite={activeSuiteId}
        topBar={
          <TopBar
            countyName='Benton County'
            environment='development'
            currentSuite={
              activeSuiteId ? SUITE_NAV_ITEMS.find((s) => s.id === activeSuiteId)?.name : undefined
            }
            userName='Admin User'
          />
        }
        leftRail={
          <LeftRail
            suites={SUITE_NAV_ITEMS}
            activeSuiteId={activeSuiteId}
            onSuiteClick={handleSuiteClick}
          />
        }
        rightDrawer={
          <RightDrawer title='AI Assistant' onClose={() => setAiDrawerOpen(false)}>
            <AIDrawer activeSuiteId={activeSuiteId} />
          </RightDrawer>
        }
        rightDrawerCollapsed={!aiDrawerOpen}
      >
        {renderContent()}
      </ShellLayout>
    </DualModeProvider>
  );
};

/**
 * Suite Launcher Grid
 * Clean "home screen" design using design tokens
 */
function SuiteLauncherGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--tf-space-6)',
        padding: 'var(--tf-space-2)',
      }}
    >
      {SUITE_NAV_ITEMS.map((suite) => (
        <button
          key={suite.id}
          onClick={() => (window.location.hash = `#/suite/${suite.id}`)}
          className='tf-card'
          style={{
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid var(--tf-color-border)',
            transition: 'all var(--tf-transition-base)',
          }}
          data-suite={suite.id}
        >
          <div
            style={{
              fontSize: 'var(--tf-text-4xl)',
              marginBottom: 'var(--tf-space-4)',
            }}
          >
            {suite.icon}
          </div>

          <h3
            style={{
              fontSize: 'var(--tf-text-xl)',
              fontWeight: 'var(--tf-weight-semibold)',
              color: 'var(--tf-color-text-primary)',
              marginBottom: 'var(--tf-space-2)',
            }}
          >
            {suite.name}
          </h3>

          {suite.badge > 0 && (
            <span
              className='tf-badge'
              style={{
                backgroundColor: 'rgba(var(--suite-accent-rgb, 0, 217, 255), 0.15)',
                color: 'var(--suite-accent, var(--tf-color-primary))',
              }}
            >
              {suite.badge} updates
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default NativeShell;
