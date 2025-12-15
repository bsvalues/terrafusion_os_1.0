/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFLOW APP INTEGRATION
 * Revolutionary Mode Switcher for TerraFusion OS
 * THE TERRAFUSION WAY - ELITE ENGINEERING
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@utils/cn';
import { useState } from 'react';
import CostForgeAI from './CostForgeAI';
import TerraAIAssistant from './design/TerraAIAssistant';
import { TerraFlowDashboard } from './design/TerraFlowDashboard';
import TerraLiveTelemetry from './design/TerraLiveTelemetry';

// Import existing components for backward compatibility
import { ComplianceWrapper, TerraFusionCSSProvider } from './components/TerraFusionCSS';
import EliteAIDashboard from './components/dashboard/EliteAIDashboard';
import { TerraSphere } from './components/terrafusion-design-system';

// Mode types
type ViewMode = 'terraflow' | 'legacy' | 'elite' | 'telemetry' | 'ai' | 'costforge';

/**
 * Revolutionary TerraFusion App with Mode Switching
 */
function TerraFusionApp() {
  const [viewMode, setViewMode] = useState<ViewMode>('costforge');

  const renderModeSelector = () => (
    <div className='fixed top-4 right-4 z-50 flex space-x-2'>
      <button
        onClick={() => setViewMode('terraflow')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          viewMode === 'terraflow'
            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
        )}
      >
        🚀 TerraFlow
      </button>
      <button
        onClick={() => setViewMode('elite')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          viewMode === 'elite'
            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
        )}
      >
        🧠 Elite AI
      </button>
      <button
        onClick={() => setViewMode('telemetry')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          viewMode === 'telemetry'
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
        )}
      >
        📡 Live Telemetry
      </button>
      <button
        onClick={() => setViewMode('ai')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          viewMode === 'ai'
            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
        )}
      >
        🤖 AI Assistant
      </button>
      <button
        onClick={() => setViewMode('costforge')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          viewMode === 'costforge'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
        )}
      >
        🏗️ CostForge AI
      </button>
      <button
        onClick={() => setViewMode('legacy')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          viewMode === 'legacy'
            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
        )}
      >
        ⚙️ Legacy
      </button>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'terraflow':
        return <TerraFlowDashboard />;

      case 'telemetry':
        return <TerraLiveTelemetry />;

      case 'ai':
        return <TerraAIAssistant />;

      case 'costforge':
        return <CostForgeAI />;

      case 'elite':
        return (
          <div className='min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-purple-950 p-6'>
            <div className='max-w-7xl mx-auto'>
              <div className='mb-8 flex items-center space-x-4'>
                <TerraSphere size='lg' variant='quantum' />
                <div>
                  <h1 className='text-3xl font-bold text-white'>Elite AI Dashboard</h1>
                  <p className='text-slate-400'>Advanced Intelligence Systems</p>
                </div>
              </div>
              <EliteAIDashboard />
            </div>
          </div>
        );

      case 'legacy':
        return (
          <TerraFusionCSSProvider>
            <ComplianceWrapper>
              <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6'>
                <div className='max-w-7xl mx-auto'>
                  <div className='mb-8 flex items-center space-x-4'>
                    <TerraSphere size='lg' variant='static' />
                    <div>
                      <h1 className='text-3xl font-bold text-white'>Legacy Dashboard</h1>
                      <p className='text-slate-400'>Classic TerraFusion Interface</p>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700/30'>
                      <h2 className='text-xl font-semibold text-white mb-4'>System Overview</h2>
                      <p className='text-slate-300'>
                        Legacy dashboard mode with traditional widget-based layout. This maintains
                        backward compatibility with existing integrations.
                      </p>
                    </div>

                    <div className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/30'>
                      <h3 className='text-lg font-semibold text-white mb-4'>Quick Stats</h3>
                      <div className='space-y-3'>
                        <div className='flex justify-between'>
                          <span className='text-slate-400'>CPU Usage</span>
                          <span className='text-cyan-400'>23%</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-slate-400'>Memory</span>
                          <span className='text-emerald-400'>67%</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-slate-400'>Disk</span>
                          <span className='text-purple-400'>45%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ComplianceWrapper>
          </TerraFusionCSSProvider>
        );

      default:
        return <TerraFlowDashboard />;
    }
  };

  return (
    <div className='relative'>
      {renderModeSelector()}
      {renderContent()}
    </div>
  );
}

export default TerraFusionApp;
