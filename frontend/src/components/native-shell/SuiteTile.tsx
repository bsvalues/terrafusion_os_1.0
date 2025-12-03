/**
 * TerraFusion Native Shell - Suite Tile Component
 * Dual-mode rendering: County Staff (simple) vs Power User (dense analytics)
 */

import React from 'react';
import { useDualMode } from './DualModeContext';
import { SuiteState } from './types';

interface SuiteTileProps {
  suite: SuiteState;
  onClick: (suiteId: string) => void;
}

export const SuiteTile: React.FC<SuiteTileProps> = ({ suite, onClick }) => {
  const { isCountyStaff, isPowerUser } = useDualMode();
  const { manifest, status } = suite;

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'loading':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      case 'disabled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'loading':
        return 'Loading...';
      case 'error':
        return 'Error';
      case 'disabled':
        return 'Disabled';
      default:
        return 'Click to Launch';
    }
  };

  // COUNTY STAFF MODE: Simple, clean, one-click launch
  if (isCountyStaff) {
    return (
      <button
        onClick={() => onClick(manifest.id)}
        disabled={status === 'loading' || status === 'disabled'}
        className={`
          relative group
          w-full aspect-square
          bg-gradient-to-br from-slate-800 to-slate-900
          border-2 border-slate-700
          rounded-2xl
          p-6
          transition-all duration-300
          hover:scale-105 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          ${status === 'active' ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-950' : ''}
        `}
      >
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${getStatusColor()}`} />

        {/* Suite Icon */}
        <div className='flex items-center justify-center mb-4'>
          <div className='w-20 h-20 rounded-xl bg-cyan-500/10 flex items-center justify-center text-4xl'>
            {manifest.icon || '📦'}
          </div>
        </div>

        {/* Suite Label */}
        <h3 className='text-xl font-semibold text-white text-center mb-2'>{manifest.label}</h3>

        {/* Simple Status */}
        <p className='text-sm text-slate-400 text-center'>{getStatusLabel()}</p>

        {/* Hover Effect */}
        <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-cyan-500/10 transition-all duration-300' />
      </button>
    );
  }

  // POWER USER MODE: Dense analytics, metrics, quick actions
  return (
    <button
      onClick={() => onClick(manifest.id)}
      disabled={status === 'loading' || status === 'disabled'}
      className={`
        relative group
        w-full aspect-square
        bg-gradient-to-br from-slate-800 to-slate-900
        border-2 border-slate-700
        rounded-2xl
        p-4
        transition-all duration-300
        hover:scale-105 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${status === 'active' ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-950' : ''}
        flex flex-col
      `}
    >
      {/* Header Row */}
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <div className='text-2xl'>{manifest.icon || '📦'}</div>
          <div className='text-left'>
            <h3 className='text-sm font-semibold text-white'>{manifest.label}</h3>
            <p className='text-xs text-slate-400 capitalize'>{manifest.category}</p>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      </div>

      {/* Metrics Grid */}
      <div className='grid grid-cols-2 gap-2 mb-3 flex-1'>
        <div className='bg-slate-800/50 rounded-lg p-2'>
          <div className='text-xs text-slate-400'>Apps</div>
          <div className='text-lg font-semibold text-white'>
            {suite.mountedApps.size || manifest.webApps.length}
          </div>
        </div>
        <div className='bg-slate-800/50 rounded-lg p-2'>
          <div className='text-xs text-slate-400'>Modules</div>
          <div className='text-lg font-semibold text-white'>
            {suite.mountedModules.size || manifest.nativeModules.length}
          </div>
        </div>
        <div className='bg-slate-800/50 rounded-lg p-2'>
          <div className='text-xs text-slate-400'>Engines</div>
          <div className='text-lg font-semibold text-white'>
            {suite.activeEngines.size || manifest.engines.length}
          </div>
        </div>
        <div className='bg-slate-800/50 rounded-lg p-2'>
          <div className='text-xs text-slate-400'>AI Agents</div>
          <div className='text-lg font-semibold text-white'>{manifest.aiAgents.length}</div>
        </div>
      </div>

      {/* Status Bar */}
      <div className='flex items-center justify-between text-xs'>
        <span className='text-slate-400'>{getStatusLabel()}</span>
        {status === 'active' && suite.loadedAt && (
          <span className='text-slate-500'>
            {new Date().getTime() - suite.loadedAt.getTime() < 60000
              ? 'Just now'
              : `${Math.floor((new Date().getTime() - suite.loadedAt.getTime()) / 60000)}m ago`}
          </span>
        )}
      </div>

      {/* Dependencies Indicator */}
      {manifest.dependencies && manifest.dependencies.length > 0 && (
        <div className='mt-2 flex gap-1 flex-wrap'>
          {manifest.dependencies.map((dep) => (
            <span key={dep} className='text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300'>
              {dep}
            </span>
          ))}
        </div>
      )}

      {/* Hover Effect */}
      <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-cyan-500/10 transition-all duration-300' />
    </button>
  );
};
