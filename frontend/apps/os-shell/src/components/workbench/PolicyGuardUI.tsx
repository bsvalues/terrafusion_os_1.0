/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — POLICY GUARD UI (CC-12)
 * R1 Week 3: Displays lane, risk, mode, county-isolation badge
 *
 * Shows the current invocation's policy context so operators
 * can see at a glance what write-lane is active, what risk level
 * applies, and that county isolation is enforced.
 *
 * @see 04_TERRAPILOT_COPILOT_SPEC_v3.1.md — Permission model
 * @see R1_DAY0_CONTRACTS.md — Contract 3 (Role Vocabulary)
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export type RiskLevel = 'read_only' | 'write_low' | 'write_high' | 'irreversible';
export type PilotMode = 'pilot' | 'muse';

export interface PolicyGuardUIProps {
  /** Write-lane owner (e.g. 'forge', 'atlas', 'dais', 'dossier', 'os') */
  lane?: string;
  /** Tool risk classification */
  risk?: RiskLevel | null;
  /** Current pilot/muse mode */
  mode?: PilotMode;
  /** County name proving isolation is active */
  countyName?: string;
  /** Current user role */
  role?: string;
  /** Whether a confirmation dialog is required (write_high / irreversible) */
  confirmationRequired?: boolean;
}

// ============================================================================
// Risk → visual mapping
// ============================================================================

const RISK_CONFIG: Record<RiskLevel, { emoji: string; label: string; toneClass: string }> = {
  read_only:    { emoji: '🟢', label: 'Read Only',   toneClass: 'bg-emerald-500/15 text-emerald-700' },
  write_low:    { emoji: '🟡', label: 'Write (Low)',  toneClass: 'bg-amber-500/15 text-amber-700' },
  write_high:   { emoji: '🟠', label: 'Write (High)', toneClass: 'bg-orange-500/15 text-orange-700' },
  irreversible: { emoji: '🔴', label: 'Irreversible', toneClass: 'bg-red-500/15 text-red-700' },
};

// ============================================================================
// Component
// ============================================================================

export const PolicyGuardUI: React.FC<PolicyGuardUIProps> = ({
  lane,
  risk,
  mode,
  countyName,
  role,
  confirmationRequired,
}) => {
  const riskCfg = risk ? RISK_CONFIG[risk] : null;

  return (
    <div
      className="flex items-center gap-2 flex-wrap text-xs"
      data-testid="policy-guard-ui"
    >
      {/* Write-lane badge */}
      {lane && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium border border-border bg-muted/60 text-foreground"
          data-testid="lane-badge"
        >
          📝 {lane}
        </span>
      )}

      {/* Risk level badge */}
      {riskCfg && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium ${riskCfg.toneClass}`}
          data-testid="risk-badge"
        >
          {riskCfg.emoji} {riskCfg.label}
        </span>
      )}

      {/* Mode badge */}
      {mode && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium"
          style={{
            background: mode === 'pilot'
              ? 'hsl(var(--tf-accent) / 0.15)'
              : 'hsl(var(--tf-info) / 0.15)',
            color: mode === 'pilot'
              ? 'hsl(var(--tf-accent))'
              : 'hsl(var(--tf-info))',
          }}
          data-testid="mode-badge"
        >
          {mode === 'pilot' ? '🧭 Pilot' : '✨ Muse'}
        </span>
      )}

      {/* Role badge */}
      {role && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium"
          style={{
            background: 'hsl(var(--tf-bg-surface) / 0.5)',
            color: 'hsl(var(--tf-text) / 0.7)',
            border: '1px solid hsl(var(--tf-text) / 0.1)',
          }}
          data-testid="role-badge"
        >
          👤 {role}
        </span>
      )}

      {/* County isolation badge */}
      {countyName && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium"
          style={{
            background: 'hsl(var(--tf-bg-surface) / 0.4)',
            color: 'hsl(var(--tf-text) / 0.6)',
            border: '1px solid hsl(var(--tf-text) / 0.08)',
          }}
          data-testid="county-badge"
        >
          🔒 {countyName}
        </span>
      )}

      {/* Confirmation required warning */}
      {confirmationRequired && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold"
          style={{
            background: 'hsl(var(--tf-warning) / 0.2)',
            color: 'hsl(var(--tf-warning))',
            border: '1px solid hsl(var(--tf-warning) / 0.3)',
          }}
          data-testid="confirmation-badge"
        >
          ⚠ Confirmation Required
        </span>
      )}
    </div>
  );
};

export default PolicyGuardUI;
