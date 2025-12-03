/**
 * CognitiveScaffold Component
 * Wrapper that simplifies complex UIs for County Staff while preserving depth for Power Users
 *
 * Core Principle: Hide complexity behind simple interface, reveal on demand
 */

import React from 'react';
import { useDualMode } from './DualModeContext';

interface CognitiveScaffoldProps {
  children: React.ReactNode;

  // County Staff Mode
  guidedText: string;
  guidedHint?: string;
  quickActions?: Array<{ label: string; icon?: string; onClick: () => void }>;

  // Power User Mode
  advancedLabel?: string;
  showAdvancedControls?: boolean;

  // Common
  className?: string;
}

export const CognitiveScaffold: React.FC<CognitiveScaffoldProps> = ({
  children,
  guidedText,
  guidedHint,
  quickActions = [],
  advancedLabel,
  showAdvancedControls = true,
  className = '',
}) => {
  const { isCountyStaff } = useDualMode();

  if (isCountyStaff) {
    // County Staff: Guided workflow with simple actions
    return (
      <div
        className={`bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden ${className}`}
      >
        {/* Guided Header */}
        <div className='bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-b border-slate-700 p-6'>
          <div className='flex items-start gap-4'>
            <div className='w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0'>
              <span className='text-2xl'>💡</span>
            </div>
            <div className='flex-1'>
              <h3 className='text-xl font-semibold text-white mb-2'>{guidedText}</h3>
              {guidedHint && <p className='text-slate-400 text-sm'>{guidedHint}</p>}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className='p-6 border-b border-slate-700 bg-slate-900/30'>
            <div className='flex flex-wrap gap-3'>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className='px-6 py-3 bg-cyan-600 rounded-lg text-white font-semibold hover:bg-cyan-500 transition-all hover:scale-105 flex items-center gap-2'
                >
                  {action.icon && <span>{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Simplified Content */}
        <div className='p-6'>{children}</div>

        {/* Help Footer */}
        <div className='bg-slate-900/50 border-t border-slate-700 p-4 text-center'>
          <p className='text-slate-500 text-sm'>
            💬 Need help? Click the AI assistant in the bottom-right corner
          </p>
        </div>
      </div>
    );
  }

  // Power User: Full technical depth
  return (
    <div
      className={`bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden ${className}`}
    >
      {/* Technical Header */}
      {advancedLabel && (
        <div className='bg-slate-900/50 border-b border-slate-700 px-6 py-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-semibold text-slate-400 uppercase tracking-wider'>
              {advancedLabel}
            </h3>
            {showAdvancedControls && (
              <div className='flex items-center gap-2'>
                <button
                  className='p-2 hover:bg-slate-700 rounded transition-colors'
                  title='Configure'
                >
                  <span className='text-slate-400'>⚙️</span>
                </button>
                <button className='p-2 hover:bg-slate-700 rounded transition-colors' title='Export'>
                  <span className='text-slate-400'>📤</span>
                </button>
                <button
                  className='p-2 hover:bg-slate-700 rounded transition-colors'
                  title='Refresh'
                >
                  <span className='text-slate-400'>🔄</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Content */}
      <div className='p-6'>{children}</div>
    </div>
  );
};

/**
 * ProgressiveDisclosure Component
 * Show/hide advanced options based on mode and user choice
 */
interface ProgressiveDisclosureProps {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  label,
  children,
  defaultOpen = false,
}) => {
  const { isPowerUser } = useDualMode();
  const [isOpen, setIsOpen] = React.useState(defaultOpen || isPowerUser);

  // Auto-open for Power Users
  React.useEffect(() => {
    if (isPowerUser) setIsOpen(true);
  }, [isPowerUser]);

  return (
    <div className='border border-slate-700 rounded-lg overflow-hidden'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='w-full px-4 py-3 bg-slate-800/50 hover:bg-slate-800 transition-colors flex items-center justify-between'
      >
        <span className='text-white font-medium'>{label}</span>
        <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && <div className='p-4 bg-slate-900/30'>{children}</div>}
    </div>
  );
};
