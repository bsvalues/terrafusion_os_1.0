/**
 * Sovereign Dashboard Window (Phase C3)
 *
 * The "Governance Room" for property assessment.
 * Implements the Golden Ratio layout (62% Canvas / 38% Context).
 *
 * @module modules/dashboard/SovereignDashboardWindow
 */

import { colors } from '@/design-system/tokens/colors';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { CostforgeAnalysisWidget } from './components/CostforgeAnalysisWidget';

// ============================================================================
// Types
// ============================================================================

export interface SovereignDashboardProps {
  metadata?: {
    objectId: string;
    objectType?: string; // 'Parcel' | 'District'
    countyId?: string;
  };
}

type DashboardMode = 'monitor' | 'analyze' | 'simulate';

// ============================================================================
// Sub-Components
// ============================================================================

const ContextSidebar: React.FC<{
  mode: DashboardMode;
  onModeChange: (m: DashboardMode) => void;
}> = ({ mode, onModeChange }) => {
  return (
    <div className='h-full flex flex-col gap-6 p-6 overflow-y-auto'>
      {/* Status Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-white/40'>
          Governance Context
        </h2>
        <div className='flex items-center gap-2'>
          <span
            className='w-2 h-2 rounded-full animate-pulse'
            style={{ backgroundColor: colors.brand.transcend[500] }}
          />
          <span className='text-xs font-mono' style={{ color: colors.brand.transcend[500] }}>
            ONLINE
          </span>
        </div>
      </div>

      {/* Mode Selectors */}
      <div className='flex flex-col gap-2'>
        <ModeButton
          label='Monitor'
          active={mode === 'monitor'}
          onClick={() => onModeChange('monitor')}
          icon='📡'
        />
        <ModeButton
          label='Deep Analysis'
          active={mode === 'analyze'}
          onClick={() => onModeChange('analyze')}
          icon='🧠'
        />
        <ModeButton
          label='Simulate Impact'
          active={mode === 'simulate'}
          onClick={() => onModeChange('simulate')}
          icon='🎲'
        />
      </div>

      {/* AI Agent Feed */}
      <div className='flex-1 rounded-sm border border-white/5 bg-black/20 p-4 font-mono text-xs'>
        <div className='text-white/40 mb-2 border-b border-white/10 pb-1'>System Logs</div>
        <div className='space-y-2 text-white/70'>
          <p>
            <span style={{ color: colors.brand.transcend[500] }}>&gt;</span> CostForge Model Loaded
          </p>
          <p>
            <span style={{ color: colors.brand.transcend[500] }}>&gt;</span> Ingesting market
            signals...
          </p>
          <p>
            <span style={{ color: colors.brand.transcend[500] }}>&gt;</span> 97% confidence
            achieved.
          </p>
        </div>
      </div>
    </div>
  );
};

const ModeButton = ({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-3 px-4 py-3 rounded text-left transition-all duration-200',
      active
        ? 'bg-[var(--tf-transcend-highlight)]/10 border border-[var(--tf-transcend-highlight)]/40 text-[var(--tf-transcend-highlight)]'
        : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10 hover:text-white'
    )}
  >
    <span className='text-lg'>{icon}</span>
    <span className='text-sm font-medium tracking-wide'>{label}</span>
  </button>
);

// ============================================================================
// Main Component
// ============================================================================

export const SovereignDashboardWindow: React.FC<SovereignDashboardProps> = ({ metadata }) => {
  const [mode, setMode] = useState<DashboardMode>('analyze');

  return (
    <div
      className='w-full h-full flex bg-[var(--tf-void-black)] text-white overflow-hidden'
      data-testid='sovereign-dashboard'
    >
      {/* 62% Canvas Area - The "Work" Surface */}
      <div className='w-[62%] h-full border-r border-white/10 relative flex flex-col'>
        {/* Canvas Toolbar */}
        <div className='h-12 border-b border-white/10 flex items-center px-4 justify-between bg-black/20'>
          <div className='flex items-center gap-2'>
            <span className='text-xl'>🏘️</span>
            <span className='font-bold text-sm tracking-wide'>
              {metadata?.objectId || 'Benton County Assessment Area'}
            </span>
          </div>
          <div className='text-xs font-mono text-white/30'>CANVAS: ACTIVE</div>
        </div>

        {/* Canvas Content */}
        <div className='flex-1 p-8 bg-gradient-to-br from-[var(--tf-void-black)] to-black overflow-y-auto'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className='h-full'
            >
              {mode === 'analyze' ? (
                <div className='h-full flex flex-col gap-6'>
                  <CostforgeAnalysisWidget />
                  {/* Future widgets can go here */}
                </div>
              ) : (
                <div className='h-full flex items-center justify-center text-white/30'>
                  Module '{mode}' is initializing...
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 38% Context Area - The "Control" Panel */}
      <div className='w-[38%] h-full bg-black'>
        <ContextSidebar mode={mode} onModeChange={setMode} />
      </div>
    </div>
  );
};

export default SovereignDashboardWindow;
