/**
 * SuperpowerCard Component
 * Dual-state card: Simple insight for County Staff, Dense analytics for Power Users
 *
 * Core Principle: Same intelligence, different presentation depth
 */

import React from 'react';
import { useDualMode } from './DualModeContext';

interface SuperpowerCardProps {
  // County Staff Mode: Simple insight with explainability
  simpleInsight: string;
  simpleIcon?: string;
  simpleAction?: {
    label: string;
    onClick: () => void;
  };
  statusColor?: 'success' | 'warning' | 'error' | 'info';

  // Explainability - ALWAYS SHOW (both modes)
  explanation?: {
    summary: string; // Plain English: "How we got this number"
    steps?: Array<{ label: string; detail: string; value?: string }>;
    sources?: Array<{ label: string; detail: string }>;
    confidence?: number; // 0-1
  };

  // Power User Mode: Dense analytics
  powerUserData?: {
    metrics?: Array<{ label: string; value: string | number; unit?: string }>;
    charts?: React.ReactNode;
    technicalDetails?: string;
  };

  // Common
  title?: string;
  className?: string;
  onDrillDown?: () => void; // Navigate to detailed breakdown page
}
export const SuperpowerCard: React.FC<SuperpowerCardProps> = ({
  simpleInsight,
  simpleIcon = '💡',
  simpleAction,
  statusColor = 'info',
  explanation,
  powerUserData,
  title,
  className = '',
  onDrillDown,
}) => {
  const { isCountyStaff } = useDualMode();
  const [showExplanation, setShowExplanation] = React.useState(false);

  // Color mapping
  const colorMap = {
    success: {
      bg: 'from-green-900/30 to-emerald-900/30',
      border: 'border-green-500/30',
      text: 'text-green-400',
      button: 'bg-green-600 hover:bg-green-500',
    },
    warning: {
      bg: 'from-yellow-900/30 to-orange-900/30',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-500',
    },
    error: {
      bg: 'from-red-900/30 to-rose-900/30',
      border: 'border-red-500/30',
      text: 'text-red-400',
      button: 'bg-red-600 hover:bg-red-500',
    },
    info: {
      bg: 'from-cyan-900/30 to-blue-900/30',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      button: 'bg-cyan-600 hover:bg-cyan-500',
    },
  };

  const colors = colorMap[statusColor];

  if (isCountyStaff) {
    // County Staff: Large, simple, actionable
    return (
      <div
        className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-2xl p-8 hover:scale-[1.02] transition-transform ${className}`}
      >
        <div className='flex items-start gap-6'>
          {/* Large Icon */}
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}
          >
            <span className='text-4xl'>{simpleIcon}</span>
          </div>

          {/* Content */}
          <div className='flex-1'>
            <h3 className={`text-2xl font-bold ${colors.text} mb-3`}>{simpleInsight}</h3>

            {simpleAction && (
              <button
                onClick={simpleAction.onClick}
                className={`mt-4 px-8 py-4 ${colors.button} rounded-xl text-white font-bold text-lg transition-all hover:scale-105 shadow-lg`}
              >
                {simpleAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Power User: Dense, analytical, detailed
  return (
    <div
      className={`bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.bg} border-b ${colors.border} px-6 py-4`}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <span className='text-2xl'>{simpleIcon}</span>
            <div>
              {title && (
                <h4 className='text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1'>
                  {title}
                </h4>
              )}
              <p className={`text-lg font-semibold ${colors.text}`}>{simpleInsight}</p>
            </div>
          </div>

          {/* Confidence Badge */}
          {powerUserData?.confidence !== undefined && (
            <div className='px-4 py-2 bg-slate-900/50 rounded-lg'>
              <div className='text-xs text-slate-400 mb-1'>Confidence</div>
              <div className={`text-lg font-bold ${colors.text}`}>
                {Math.round(powerUserData.confidence * 100)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      {powerUserData?.metrics && powerUserData.metrics.length > 0 && (
        <div className='grid grid-cols-3 gap-4 p-6 border-b border-slate-700'>
          {powerUserData.metrics.map((metric, index) => (
            <div key={index} className='bg-slate-900/50 rounded-lg p-4'>
              <div className='text-xs text-slate-400 mb-2'>{metric.label}</div>
              <div className={`text-2xl font-bold ${colors.text}`}>
                {metric.value}
                {metric.unit && <span className='text-sm ml-1 text-slate-500'>{metric.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {powerUserData?.charts && (
        <div className='p-6 border-b border-slate-700'>{powerUserData.charts}</div>
      )}

      {/* Technical Details */}
      {powerUserData?.technicalDetails && (
        <div className='p-6 bg-slate-900/30'>
          <div className='text-sm font-mono text-slate-400'>{powerUserData.technicalDetails}</div>
        </div>
      )}

      {/* Action Button (if provided) */}
      {simpleAction && (
        <div className='p-6 border-t border-slate-700'>
          <button
            onClick={simpleAction.onClick}
            className={`w-full px-6 py-3 ${colors.button} rounded-lg text-white font-semibold transition-colors`}
          >
            {simpleAction.label}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * InsightPanel Component
 * Container for multiple SuperpowerCards
 */
interface InsightPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const InsightPanel: React.FC<InsightPanelProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className='text-2xl font-bold text-white mb-6'>{title}</h2>
      <div className='grid grid-cols-1 gap-6'>{children}</div>
    </div>
  );
};
