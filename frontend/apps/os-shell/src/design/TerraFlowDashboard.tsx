/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFLOW REVOLUTIONARY LAYOUT
 * Warmwind-Inspired Design with Living Telemetry
 * NO MORE CANVAS CHAOS - PURE ELEGANCE
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@utils/cn';
import React, { useState } from 'react';
import {
  TerraChat,
  TerraMetric,
  TerraModal,
  TerraPanel,
  TerraSphere,
  useTerraFlow,
} from './TerraFlowEngine';

/**
 * Revolutionary TerraFlow Dashboard
 * Replaces the old canvas-heavy approach with elegant living surfaces
 */
export const TerraFlowDashboard: React.FC = () => {
  const { metrics } = useTerraFlow();

  // Modal state management
  const [activeModal, setActiveModal] = useState<'property' | 'tax' | 'ai' | null>(null);

  // Mock data for demonstration
  const mockMessages = [
    {
      text: 'System health optimal. All modules operating within parameters.',
      isAI: true,
      confidence: 0.95,
    },
    { text: 'Initiating quantum governance protocols...', isAI: true, confidence: 0.92 },
    { text: 'Show me the property valuation metrics', isAI: false },
    {
      text: 'Displaying current valuation data. Confidence level: 94%',
      isAI: true,
      confidence: 0.94,
    },
  ];

  const mockTrend = [65, 72, 68, 85, 92, 88, 95, 87, 91, 96];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6'>
      {/* Header with System Health */}
      <div className='mb-8 flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <TerraSphere systemHealth={metrics.systemHealth} size='lg' variant='quantum' />
          <div>
            <h1 className='text-3xl font-bold text-white'>TerraFusion OS</h1>
            <p className='text-slate-400'>Quantum Governance Platform</p>
          </div>
        </div>

        <div className='flex items-center space-x-6'>
          <div className='text-right'>
            <div className='text-sm text-slate-400'>System Status</div>
            <div
              className={cn(
                'text-lg font-semibold',
                metrics.systemHealth > 0.8 ? 'text-cyan-400' : 'text-amber-400'
              )}
            >
              {metrics.systemHealth > 0.9
                ? 'Optimal'
                : metrics.systemHealth > 0.7
                  ? 'Good'
                  : 'Attention Required'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Warmwind Inspired */}
      <div className='grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {/* Primary Metrics Panel */}
        <TerraPanel
          className='lg:col-span-2'
          systemHealth={metrics.systemHealth}
          aiConfidence={metrics.aiConfidence}
        >
          <h2 className='text-xl font-semibold text-white mb-6'>System Metrics</h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            <TerraMetric
              value={Math.round(metrics.systemHealth * 100)}
              label='System Health'
              unit='%'
              confidence={metrics.systemHealth}
              trend={mockTrend}
            />
            <TerraMetric
              value={Math.round(metrics.aiConfidence * 100)}
              label='AI Confidence'
              unit='%'
              confidence={metrics.aiConfidence}
              trend={mockTrend.map((v) => v * 0.9)}
            />
            <TerraMetric
              value={metrics.dataIngestionRate}
              label='Data Rate'
              unit='/sec'
              confidence={0.88}
              trend={mockTrend.map((v) => v * 12)}
            />
            <TerraMetric
              value={1847}
              label='Active Users'
              confidence={0.92}
              trend={mockTrend.map((v) => v * 18)}
            />
          </div>
        </TerraPanel>

        {/* AI Assistant Panel */}
        <TerraPanel
          className='lg:col-span-1'
          aiConfidence={metrics.aiConfidence}
          systemHealth={metrics.systemHealth}
        >
          <h3 className='text-lg font-semibold text-white mb-4'>TerraVoice AI</h3>
          <TerraChat
            messages={mockMessages}
            isTyping={metrics.mcpChannelActivity}
            mcpActive={metrics.mcpChannelActivity}
          />
        </TerraPanel>

        {/* Quick Actions */}
        <TerraPanel className='lg:col-span-1'>
          <h3 className='text-lg font-semibold text-white mb-4'>Quick Actions</h3>
          <div className='space-y-3'>
            <button
              onClick={() => setActiveModal('property')}
              className='w-full p-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 transition-all hover:shadow-lg hover:shadow-cyan-500/10'
            >
              🏘️ Launch Property Assessment
            </button>
            <button
              onClick={() => setActiveModal('tax')}
              className='w-full p-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-300 transition-all hover:shadow-lg hover:shadow-emerald-500/10'
            >
              📊 Generate Tax Reports
            </button>
            <button
              onClick={() => setActiveModal('ai')}
              className='w-full p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition-all hover:shadow-lg hover:shadow-purple-500/10'
            >
              🧠 AI Analysis
            </button>
          </div>
        </TerraPanel>

        {/* Performance Analytics */}
        <TerraPanel className='lg:col-span-2'>
          <h3 className='text-lg font-semibold text-white mb-4'>Performance Analytics</h3>
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <TerraSphere systemHealth={0.92} size='sm' />
              <div className='mt-2 text-sm text-slate-300'>CPU Usage</div>
              <div className='text-lg font-semibold text-cyan-400'>23%</div>
            </div>
            <div className='text-center'>
              <TerraSphere systemHealth={0.87} size='sm' />
              <div className='mt-2 text-sm text-slate-300'>Memory</div>
              <div className='text-lg font-semibold text-emerald-400'>67%</div>
            </div>
            <div className='text-center'>
              <TerraSphere systemHealth={0.95} size='sm' />
              <div className='mt-2 text-sm text-slate-300'>Network</div>
              <div className='text-lg font-semibold text-cyan-400'>12ms</div>
            </div>
          </div>
        </TerraPanel>

        {/* Module Status */}
        <TerraPanel className='lg:col-span-1'>
          <h3 className='text-lg font-semibold text-white mb-4'>Active Modules</h3>
          <div className='space-y-3'>
            {[
              { name: 'CAMA Core', status: 0.95, color: 'cyan' },
              { name: 'GIS Engine', status: 0.88, color: 'emerald' },
              { name: 'Tax Levy', status: 0.92, color: 'purple' },
              { name: 'Harris PACS', status: 0.85, color: 'amber' },
            ].map((module) => (
              <div key={module.name} className='flex items-center justify-between'>
                <span className='text-sm text-slate-300'>{module.name}</span>
                <div className='flex items-center space-x-2'>
                  <TerraSphere systemHealth={module.status} size='sm' />
                  <span className='text-xs text-slate-400'>{Math.round(module.status * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </TerraPanel>

        {/* Real-time Activity Feed */}
        <TerraPanel className='lg:col-span-3 xl:col-span-4'>
          <h3 className='text-lg font-semibold text-white mb-4'>Live Activity Stream</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {[
              { label: 'Property Valuations', value: '1,247', change: '+12%' },
              { label: 'Tax Assessments', value: '892', change: '+8%' },
              { label: 'GIS Queries', value: '3,456', change: '+23%' },
              { label: 'AI Predictions', value: '567', change: '+15%' },
            ].map((item) => (
              <div
                key={item.label}
                className='text-center p-4 border border-slate-700/50 rounded-lg'
              >
                <div className='text-2xl font-bold text-white'>{item.value}</div>
                <div className='text-sm text-slate-400'>{item.label}</div>
                <div className='text-xs text-emerald-400'>{item.change}</div>
              </div>
            ))}
          </div>
        </TerraPanel>
      </div>

      {/* Revolutionary Modal System */}
      {activeModal && (
        <TerraModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          type={activeModal}
        />
      )}
    </div>
  );
};

export default TerraFlowDashboard;
