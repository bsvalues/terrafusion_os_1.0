/**
 * TerraFusion Native Shell - Mode Toggle Component
 * Switches between County Staff and Power User modes
 */

import React from 'react';
import { useDualMode } from './DualModeContext';

export const ModeToggle: React.FC = () => {
  const { mode, toggleMode, isCountyStaff, isPowerUser } = useDualMode();

  return (
    <div className='fixed top-4 right-4 z-50'>
      <button
        onClick={toggleMode}
        className='group relative bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl p-3 shadow-lg hover:border-cyan-500 transition-all duration-300'
        title='Toggle mode (Ctrl+M)'
      >
        <div className='flex items-center gap-3'>
          {/* Icon */}
          <div className='relative w-10 h-10'>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                isCountyStaff ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
            >
              <span className='text-2xl'>👤</span>
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                isPowerUser ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
            >
              <span className='text-2xl'>🔬</span>
            </div>
          </div>

          {/* Label */}
          <div className='text-left'>
            <div className='text-xs text-slate-400 uppercase tracking-wide'>Mode</div>
            <div className='text-sm font-semibold text-white capitalize'>
              {isCountyStaff ? 'County Staff' : 'Power User'}
            </div>
          </div>

          {/* Toggle Indicator */}
          <div className='ml-2'>
            <div className='relative w-12 h-6 bg-slate-700 rounded-full'>
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-cyan-500 rounded-full transition-all duration-300 ${
                  isPowerUser ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className='absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
          <div className='bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-400 whitespace-nowrap'>
            Press <kbd className='px-1 bg-slate-700 rounded'>Ctrl+M</kbd>
          </div>
        </div>

        {/* Glow Effect */}
        <div className='absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:to-cyan-500/20 transition-all duration-300' />
      </button>

      {/* Mode Description */}
      <div className='mt-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-xs text-slate-400 max-w-xs'>
        {isCountyStaff ? (
          <>
            <div className='font-semibold text-white mb-1'>County Staff Mode</div>
            <div>
              Simple, guided interface with one-click actions. Complex analytics hidden behind the
              scenes.
            </div>
          </>
        ) : (
          <>
            <div className='font-semibold text-white mb-1'>Power User Mode</div>
            <div>
              Full analytical controls, detailed metrics, and advanced configuration options.
            </div>
          </>
        )}
      </div>
    </div>
  );
};
