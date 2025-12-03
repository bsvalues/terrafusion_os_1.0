/**
 * TerraFusion Native Shell - Main Entry Point
 * Complete dual-mode shell with launcher, routing, and AI integration
 */

import React, { useEffect, useState } from 'react';
import { AIDrawer } from './AIDrawer';
import { DualModeProvider } from './DualModeContext';
import { ModeToggle } from './ModeToggle';
import { SuiteLauncher } from './SuiteLauncher';
import { suiteRegistry } from './SuiteRegistry';
import { AssessmentSuite } from './suites/AssessmentSuite';

export const NativeShell: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [activeSuiteId, setActiveSuiteId] = useState<string | undefined>();

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

  const renderRoute = () => {
    // Root route: Show launcher
    if (currentRoute === '/') {
      return <SuiteLauncher />;
    }

    // Suite route: Show suite content
    const suiteMatch = currentRoute.match(/^\/suite\/([^/]+)/);
    if (suiteMatch) {
      const suiteId = suiteMatch[1];
      const suite = suiteRegistry.getSuite(suiteId);

      if (!suite) {
        return (
          <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center'>
            <div className='text-center'>
              <div className='text-6xl mb-4'>⚠️</div>
              <h2 className='text-2xl font-bold text-white mb-2'>Suite Not Found</h2>
              <p className='text-slate-400 mb-6'>The suite "{suiteId}" could not be loaded.</p>
              <button
                onClick={() => (window.location.hash = '#/')}
                className='px-6 py-3 bg-cyan-600 rounded-lg text-white font-semibold hover:bg-cyan-500 transition-colors'
              >
                Return to Launcher
              </button>
            </div>
          </div>
        );
      }

      if (suite.status === 'loading') {
        return (
          <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center'>
            <div className='text-center'>
              <div className='w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
              <h2 className='text-2xl font-bold text-white mb-2'>Loading {suite.manifest.label}</h2>
              <p className='text-slate-400'>Starting engines and mounting applications...</p>
            </div>
          </div>
        );
      }

      if (suite.status === 'error') {
        return (
          <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center'>
            <div className='text-center'>
              <div className='text-6xl mb-4'>❌</div>
              <h2 className='text-2xl font-bold text-white mb-2'>Suite Failed to Load</h2>
              <p className='text-red-400 mb-2'>{suite.error}</p>
              <p className='text-slate-400 mb-6'>Please check system logs or contact support.</p>
              <button
                onClick={() => (window.location.hash = '#/')}
                className='px-6 py-3 bg-cyan-600 rounded-lg text-white font-semibold hover:bg-cyan-500 transition-colors'
              >
                Return to Launcher
              </button>
            </div>
          </div>
        );
      }

      // Suite active: Render suite-specific component
      // For now, we have AssessmentSuite implemented. Others show placeholder.
      if (suiteId === 'assessment') {
        return <AssessmentSuite />;
      }

      // Default: Show placeholder for other suites
      return (
        <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'>
          {/* Breadcrumbs */}
          <div className='bg-slate-900/50 border-b border-slate-700 p-4'>
            <div className='max-w-7xl mx-auto flex items-center gap-2 text-sm'>
              <button
                onClick={() => (window.location.hash = '#/')}
                className='text-cyan-500 hover:text-cyan-400 transition-colors'
              >
                Launcher
              </button>
              <span className='text-slate-600'>/</span>
              <span className='text-white font-semibold'>{suite.manifest.label}</span>
            </div>
          </div>

          {/* Suite Content Area */}
          <div className='p-8'>
            <div className='max-w-7xl mx-auto'>
              <div className='bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center'>
                <div className='text-6xl mb-4'>{suite.manifest.icon || '📦'}</div>
                <h2 className='text-3xl font-bold text-white mb-4'>{suite.manifest.label}</h2>
                <p className='text-slate-400 mb-8'>
                  {suite.manifest.description || 'Suite is now active'}
                </p>

                <div className='grid grid-cols-3 gap-6 mb-8'>
                  <div className='bg-slate-900/50 rounded-lg p-4'>
                    <div className='text-cyan-500 text-2xl font-bold'>{suite.mountedApps.size}</div>
                    <div className='text-slate-400 text-sm'>Web Apps Running</div>
                  </div>
                  <div className='bg-slate-900/50 rounded-lg p-4'>
                    <div className='text-cyan-500 text-2xl font-bold'>
                      {suite.mountedModules.size}
                    </div>
                    <div className='text-slate-400 text-sm'>Native Modules</div>
                  </div>
                  <div className='bg-slate-900/50 rounded-lg p-4'>
                    <div className='text-cyan-500 text-2xl font-bold'>
                      {suite.manifest.aiAgents.length}
                    </div>
                    <div className='text-slate-400 text-sm'>AI Agents</div>
                  </div>
                </div>

                <div className='text-slate-500'>
                  <p className='mb-2'>🚧 Suite implementation in progress</p>
                  <p className='text-sm'>Web apps and native modules will be mounted here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 404
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>🔍</div>
          <h2 className='text-2xl font-bold text-white mb-2'>Page Not Found</h2>
          <p className='text-slate-400 mb-6'>The requested route does not exist.</p>
          <button
            onClick={() => (window.location.hash = '#/')}
            className='px-6 py-3 bg-cyan-600 rounded-lg text-white font-semibold hover:bg-cyan-500 transition-colors'
          >
            Return to Launcher
          </button>
        </div>
      </div>
    );
  };

  return (
    <DualModeProvider defaultMode='county-staff' persistMode={true}>
      <div className='relative'>
        {/* Mode Toggle (always visible) */}
        <ModeToggle />

        {/* AI Drawer (adapts to active suite) */}
        <AIDrawer activeSuiteId={activeSuiteId} />

        {/* Main Content */}
        {renderRoute()}
      </div>
    </DualModeProvider>
  );
};

export default NativeShell;
