/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION SYSTEMGPT GUARDRAIL PANEL
 * Phase 26: Autonomous Guardrails (v1) - Read-only decision display
 * Shows last guardrail evaluation result from SystemGPT Console
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import { LastGuardrailDecision } from '../../../api/systemDiagnosticsApi';

// ═══════════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════════

interface SystemGptGuardrailPanelProps {
  /** Last guardrail decision from diagnostics (null if none yet) */
  decision: LastGuardrailDecision | null | undefined;
  /** County name for display context */
  countyName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get status badge style based on decision kind
 */
function getDecisionBadgeStyle(
  kind: string,
  allow: boolean
): { bg: string; text: string; border: string } {
  if (!allow) {
    // Denied decisions
    return {
      bg: 'bg-red-500/20',
      text: 'text-red-300',
      border: 'border-red-500/50',
    };
  }

  // Allowed but with conditions
  switch (kind) {
    case 'ThrottledByCapacity':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-300',
        border: 'border-amber-500/50',
      };
    case 'SafeModeRecommended':
      return {
        bg: 'bg-orange-500/20',
        text: 'text-orange-300',
        border: 'border-orange-500/50',
      };
    case 'Sanitized':
      return {
        bg: 'bg-purple-500/20',
        text: 'text-purple-300',
        border: 'border-purple-500/50',
      };
    case 'ForceExplainOnValuation':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-500/50',
      };
    case 'Allowed':
    default:
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/50',
      };
  }
}

/**
 * Get icon for decision kind
 */
function getDecisionIcon(kind: string, allow: boolean): string {
  if (!allow) {
    return '🚫';
  }

  switch (kind) {
    case 'ThrottledByCapacity':
      return '⏱️';
    case 'SafeModeRecommended':
      return '⚠️';
    case 'Sanitized':
      return '🧹';
    case 'ForceExplainOnValuation':
      return '📝';
    case 'Allowed':
    default:
      return '✅';
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) {
    return `${diffHrs}h ago`;
  }

  return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Phase 26: Guardrail Decision Panel
 * Read-only display of the last autonomous guardrail evaluation.
 */
export const SystemGptGuardrailPanel: React.FC<SystemGptGuardrailPanelProps> = ({
  decision,
  countyName = 'County',
}) => {
  // No decision yet
  if (!decision) {
    return (
      <div className='rounded-lg border border-slate-700/50 bg-slate-800/40 p-4'>
        <div className='mb-2 flex items-center gap-2'>
          <span className='text-lg'>🛡️</span>
          <h3 className='text-sm font-semibold text-slate-300'>Guardrail Status</h3>
        </div>
        <p className='text-xs text-slate-500'>
          No guardrail decisions recorded yet for {countyName}.
        </p>
        <p className='mt-1 text-xs text-slate-500'>
          Guardrails evaluate each GPT request against policy, metrics, and capacity.
        </p>
      </div>
    );
  }

  const badgeStyle = getDecisionBadgeStyle(decision.kind, decision.allow);
  const icon = getDecisionIcon(decision.kind, decision.allow);

  return (
    <div className='rounded-lg border border-slate-700/50 bg-slate-800/40 p-4'>
      {/* Header */}
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-lg'>🛡️</span>
          <h3 className='text-sm font-semibold text-slate-300'>Last Guardrail Decision</h3>
        </div>
        <span className='text-xs text-slate-500'>
          {formatTimestamp(decision.decisionTimestampUtc)}
        </span>
      </div>

      {/* Decision Status Badge */}
      <div
        className={`mb-3 flex items-center gap-2 rounded-lg border ${badgeStyle.border} ${badgeStyle.bg} px-3 py-2`}
      >
        <span className='text-lg'>{icon}</span>
        <div>
          <div className={`text-sm font-medium ${badgeStyle.text}`}>
            {decision.allow ? 'Allowed' : 'Denied'} — {decision.kind}
          </div>
          {decision.denyReason && (
            <div className='text-xs text-slate-400'>{decision.denyReason}</div>
          )}
        </div>
      </div>

      {/* Flags Grid */}
      <div className='mb-3 grid grid-cols-2 gap-2'>
        <FlagIndicator
          label='Safe Mode Recommended'
          active={decision.autoSafeModeRecommended}
          color='orange'
        />
        <FlagIndicator label='Auto Throttle' active={decision.autoThrottle} color='amber' />
        <FlagIndicator label='Force Explain' active={decision.forceExplain} color='blue' />
        <FlagIndicator label='Auto Sanitize' active={decision.autoSanitize} color='purple' />
      </div>

      {/* Advisory Message */}
      {decision.advisory && (
        <div className='rounded-lg bg-slate-900/50 p-2'>
          <div className='mb-1 text-xs font-medium text-slate-400'>Advisory</div>
          <div className='text-xs text-slate-300'>{decision.advisory}</div>
        </div>
      )}

      {/* Context ID */}
      {decision.contextId && (
        <div className='mt-2 text-xs text-slate-500'>
          Context: <span className='font-mono text-slate-400'>{decision.contextId}</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

interface FlagIndicatorProps {
  label: string;
  active: boolean;
  color: 'emerald' | 'amber' | 'orange' | 'blue' | 'purple';
}

const FlagIndicator: React.FC<FlagIndicatorProps> = ({ label, active, color }) => {
  const colorMap = {
    emerald: {
      active: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
      inactive: 'bg-slate-800/30 border-slate-700/30 text-slate-500',
    },
    amber: {
      active: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
      inactive: 'bg-slate-800/30 border-slate-700/30 text-slate-500',
    },
    orange: {
      active: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
      inactive: 'bg-slate-800/30 border-slate-700/30 text-slate-500',
    },
    blue: {
      active: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
      inactive: 'bg-slate-800/30 border-slate-700/30 text-slate-500',
    },
    purple: {
      active: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
      inactive: 'bg-slate-800/30 border-slate-700/30 text-slate-500',
    },
  };

  const styles = colorMap[color];
  const classes = active ? styles.active : styles.inactive;

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-2 py-1 ${classes}`}>
      <span className='text-xs'>{active ? '●' : '○'}</span>
      <span className='text-xs'>{label}</span>
    </div>
  );
};

export default SystemGptGuardrailPanel;
