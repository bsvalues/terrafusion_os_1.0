import React from 'react';
import { useOSMode } from '../state/OSModeContext';
import { useWorkspace } from '../state/WorkspaceContext';

export const TahoeTopStrip: React.FC = () => {
  const { mode } = useOSMode();
  const { activeWorkspaceId } = useWorkspace();

  return (
    <header className='h-14 px-6 flex items-center justify-between bg-slate-950/80 border-b border-slate-800/70 backdrop-blur'>
      <div className='flex items-center gap-3'>
        <div className='w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 shadow-lg shadow-cyan-500/40' />
        <div className='flex flex-col leading-tight'>
          <span className='text-[11px] uppercase tracking-[0.3em] text-slate-500'>TerraFusion</span>
          <span className='text-sm text-slate-200'>Government OS</span>
        </div>
      </div>

      <div className='text-xs text-slate-400'>
        Mode: <span className='text-cyan-300 font-mono'>{mode}</span> • Workspace:{' '}
        <span className='font-mono text-slate-200'>{activeWorkspaceId}</span>
      </div>

      <div className='text-[11px] text-slate-500'>
        Press <span className='text-cyan-300'>⌘K</span> /{' '}
        <span className='text-cyan-300'>Ctrl+K</span> for TerraCommand
      </div>
    </header>
  );
};
