/**
 * TerraFusion Native Shell - Canonical Implementation
 *
 * ONE TRUE SHELL for TerraFusion OS.
 *
 * Architecture:
 * - Uses ShellLayout for 3-tier structure
 * - Uses SuiteLauncher for home screen
 * - Loads suite-specific components on demand
 * - Integrates with TF-Substrate backend
 * - Coordinates with WPF native shell (WebView2 host)
 *
 * Government. Transcended.
 */

import React, { useEffect, useState } from 'react';
import { AIDrawer } from '../components/native-shell/AIDrawer';
import { DualModeProvider } from '../components/native-shell/DualModeContext';
import { ModeToggle } from '../components/native-shell/ModeToggle';
import { getSuiteById } from '../suites';
import { LeftRail, RightDrawer, ShellLayout, TopBar, WorkspaceHeader } from './ShellLayout';
import { SuiteLauncher } from './SuiteLauncher';

// Suite navigation items from manifest
const SUITE_NAV_ITEMS = [
  { id: 'assessment', name: 'Assessment', icon: '📊', badge: 0 },
  { id: 'levy', name: 'Levy', icon: '💰', badge: 0 },
  { id: 'gis', name: 'GIS', icon: '🗺️', badge: 0 },
  { id: 'collections', name: 'Collections', icon: '💼', badge: 3 },
  { id: 'sync', name: 'Sync', icon: '🔄', badge: 0 },
  { id: 'flow', name: 'Flow', icon: '⚡', badge: 0 },
  { id: 'insights', name: 'Insights', icon: '📈', badge: 0 },
  { id: 'agent', name: 'Agent', icon: '🤖', badge: 0 },
  { id: 'admin', name: 'Admin', icon: '⚙️', badge: 0 },
];

export const NativeShell: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [activeSuiteId, setActiveSuiteId] = useState<string | undefined>();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(true); // TerraFusion: AI drawer visible by default

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

  const handleOpenSuite = (suiteId: string) => {
    window.location.hash = `#/suite/${suiteId}`;
  };

  const handleShowDetails = (suiteId: string) => {
    const suite = getSuiteById(suiteId);
    if (suite) {
      console.log('Suite details:', suite);
      // TODO: Open transparency drawer with suite architecture diagram
      alert(
        `Suite: ${suite.label}\n\nComponents:\n` +
          `- Web Apps: ${suite.webApps.join(', ')}\n` +
          `- Native Modules: ${suite.nativeModules.join(', ')}\n` +
          `- Engines: ${suite.engines.join(', ')}\n` +
          `- APIs: ${suite.apis.join(', ')}\n` +
          `- AI Agents: ${suite.aiAgents.join(', ')}`
      );
    }
  };

  const renderContent = () => {
    // Root route: Show launcher
    if (currentRoute === '/') {
      return (
        <div className='terrafusion-os-workspace'>
          <SuiteLauncher onOpenSuite={handleOpenSuite} onShowDetails={handleShowDetails} />
        </div>
      );
    }

    // Suite route: Show suite content
    const suiteMatch = currentRoute.match(/^\/suite\/([^/]+)/);
    if (suiteMatch) {
      const suiteId = suiteMatch[1];
      const suite = getSuiteById(suiteId);

      if (!suite) {
        return (
          <div className='terrafusion-os-workspace'>
            <main className='terrafusion-os-content'>
              <div className='tf-empty' style={{ padding: 'var(--tf-space-12)' }}>
                <div className='tf-empty-icon' style={{ fontSize: 'var(--tf-text-4xl)' }}>
                  ⚠️
                </div>
                <h2 className='terra-heading text-xl' style={{ marginBottom: 'var(--tf-space-2)' }}>
                  Suite Not Found
                </h2>
                <p className='terra-body text-sm' style={{ marginBottom: 'var(--tf-space-4)' }}>
                  The suite "{suiteId}" could not be loaded.
                </p>
                <button
                  onClick={() => (window.location.hash = '#/')}
                  className='tf-btn tf-btn-primary'
                >
                  Return to Launcher
                </button>
              </div>
            </main>
          </div>
        );
      }

      // Suite found: Render placeholder (TODO: load actual suite components)
      return (
        <div className='terrafusion-os-workspace'>
          <LeftRail
            suites={SUITE_NAV_ITEMS}
            activeSuiteId={activeSuiteId}
            onSuiteClick={handleSuiteClick}
          />

          <main className='terrafusion-os-content'>
            <WorkspaceHeader
              title={suite.label}
              subtitle={suite.description}
              actions={
                <button
                  onClick={() => (window.location.hash = '#/')}
                  className='tf-btn tf-btn-secondary'
                >
                  ← Back to Launcher
                </button>
              }
            />

            <div style={{ padding: 'var(--tf-space-6)' }}>
              <div
                className='tf-card'
                style={{
                  textAlign: 'center',
                  padding: 'var(--tf-space-8)',
                }}
              >
                <div style={{ fontSize: 'var(--tf-text-4xl)', marginBottom: 'var(--tf-space-4)' }}>
                  {suite.icon}
                </div>

                <h2
                  className='terra-heading text-2xl'
                  style={{ marginBottom: 'var(--tf-space-4)' }}
                >
                  {suite.label}
                </h2>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 'var(--tf-space-4)',
                    marginBottom: 'var(--tf-space-6)',
                  }}
                >
                  <div
                    className='tf-card'
                    style={{ textAlign: 'center', padding: 'var(--tf-space-4)' }}
                  >
                    <div
                      style={{
                        color: suite.accentColor || 'var(--tf-color-primary)',
                        fontSize: 'var(--tf-text-2xl)',
                        fontWeight: 'var(--tf-weight-bold)',
                      }}
                    >
                      {suite.webApps.length + suite.nativeModules.length}
                    </div>
                    <div className='terra-caption'>Apps</div>
                  </div>

                  <div
                    className='tf-card'
                    style={{ textAlign: 'center', padding: 'var(--tf-space-4)' }}
                  >
                    <div
                      style={{
                        color: suite.accentColor || 'var(--tf-color-primary)',
                        fontSize: 'var(--tf-text-2xl)',
                        fontWeight: 'var(--tf-weight-bold)',
                      }}
                    >
                      {suite.engines.length}
                    </div>
                    <div className='terra-caption'>Engines</div>
                  </div>

                  <div
                    className='tf-card'
                    style={{ textAlign: 'center', padding: 'var(--tf-space-4)' }}
                  >
                    <div
                      style={{
                        color: suite.accentColor || 'var(--tf-color-primary)',
                        fontSize: 'var(--tf-text-2xl)',
                        fontWeight: 'var(--tf-weight-bold)',
                      }}
                    >
                      {suite.aiAgents.length}
                    </div>
                    <div className='terra-caption'>AI Agents</div>
                  </div>
                </div>

                <div className='terra-caption' style={{ marginBottom: 'var(--tf-space-4)' }}>
                  🚧 Suite implementation in progress
                </div>

                <div
                  style={{ display: 'flex', gap: 'var(--tf-space-3)', justifyContent: 'center' }}
                >
                  <button
                    className='tf-btn tf-btn-secondary'
                    onClick={handleShowDetails.bind(null, suiteId)}
                  >
                    Show Components
                  </button>
                  <button className='tf-btn tf-btn-primary' disabled>
                    Launch {suite.webApps[0] || 'App'}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      );
    }

    // 404
    return (
      <div className='terrafusion-os-workspace'>
        <main className='terrafusion-os-content'>
          <div className='tf-empty' style={{ padding: 'var(--tf-space-12)' }}>
            <div className='tf-empty-icon' style={{ fontSize: 'var(--tf-text-4xl)' }}>
              🔍
            </div>
            <h2 className='terra-heading text-xl' style={{ marginBottom: 'var(--tf-space-2)' }}>
              Page Not Found
            </h2>
            <p className='terra-body text-sm' style={{ marginBottom: 'var(--tf-space-4)' }}>
              The requested route does not exist.
            </p>
            <button onClick={() => (window.location.hash = '#/')} className='tf-btn tf-btn-primary'>
              Return to Launcher
            </button>
          </div>
        </main>
      </div>
    );
  };

  return (
    <DualModeProvider defaultMode='county-staff' persistMode={true}>
      {/* TerraFusion Mode Toggle (always visible) */}
      <ModeToggle />

      <ShellLayout
        currentSuite={activeSuiteId}
        rightDrawer={
          <RightDrawer title='AI Assistant' onClose={() => setAiDrawerOpen(false)}>
            <AIDrawer activeSuiteId={activeSuiteId} />
          </RightDrawer>
        }
        rightDrawerCollapsed={!aiDrawerOpen}
      >
        <TopBar
          countyName='Benton County'
          environment='development'
          currentSuite={activeSuiteId ? getSuiteById(activeSuiteId)?.label : undefined}
          userName='Admin User'
        />

        {renderContent()}
      </ShellLayout>
    </DualModeProvider>
  );
};

export default NativeShell;
