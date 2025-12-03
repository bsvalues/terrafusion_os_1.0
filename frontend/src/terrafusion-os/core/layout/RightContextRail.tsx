import React from 'react';
import { useOmniIntent } from '../state/OmniIntentContext';

export const RightContextRail: React.FC = () => {
  const { gravityWell, currentIntent } = useOmniIntent();
  const panels = gravityWell.activePanels;

  const hasPanels = panels.length > 0;

  return (
    <aside className='h-full w-full' data-testid='right-context-rail'>
      <div className='h-full bg-slate-950/80 border-l border-slate-800/70 rounded-l-3xl backdrop-blur px-3 py-4 flex flex-col'>
        <div className='mb-3'>
          <div className='text-[10px] uppercase tracking-[0.3em] text-slate-500'>Context Rail</div>
          {currentIntent && (
            <div
              className='text-[11px] text-slate-400 mt-1'
              data-testid='right-context-rail-intent'
            >
              Intent: <span className='text-cyan-300'>{currentIntent}</span>
            </div>
          )}
        </div>

        <div className='flex-1 overflow-y-auto space-y-3 pr-1'>
          {!hasPanels && (
            <div className='text-[11px] text-slate-500 italic'>
              No active context. Run a TerraCommand or select an object to see tools here.
            </div>
          )}

          {panels.map((panel) => (
            <div
              key={panel.id}
              className='rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-3 text-xs space-y-1'
              data-testid='context-panel'
            >
              <div className='flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500'>
                <span>{panel.type}</span>
                <span className='text-[9px] text-slate-600'>
                  {(panel.relevanceScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className='text-slate-100 text-sm'>{panel.title}</div>
              {panel.subtitle && <div className='text-[11px] text-slate-400'>{panel.subtitle}</div>}
            </div>
          ))}
        </div>

        <div className='pt-3 mt-3 border-t border-slate-800/70 text-[10px] text-slate-500'>
          TerraFusion OS • Context-aware tools surface here.
        </div>
      </div>
    </aside>
  );
};
