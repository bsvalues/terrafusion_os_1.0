/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION SYSTEMGPT POLICY PANEL
 * Phase 24: AI Policy Engine (v1) - County-scoped governance display
 * Read-only view of AI policies for GPT, RAG, Embeddings & ExplainGPT
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { CountyId } from '../../../api/systemDiagnosticsApi';

// ═══════════════════════════════════════════════════════════════════════════════
// Types matching backend SystemGptPolicyDto
// ═══════════════════════════════════════════════════════════════════════════════

export interface SystemGptPolicyDto {
  countyId: string;
  countyName: string;
  // Operation Permissions
  allowGptSendMessage: boolean;
  allowRagQueries: boolean;
  allowEmbeddings: boolean;
  allowExplainGpt: boolean;
  // Enforcement Rules
  requireExplainOnValuation: boolean;
  sanitizeOwnerNames: boolean;
  // Deny Rules
  denyPromptPatterns: string[];
  denyContextIds: string[];
  // Metadata
  lastUpdatedUtc: string;
  policyVersion: string;
  isPlaceholder: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = '/api/gpt';

export async function getCountyPolicy(countyId?: CountyId): Promise<SystemGptPolicyDto> {
  const params = countyId ? `?countyId=${countyId}` : '';
  const response = await fetch(`${API_BASE}/system/policy${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch policy: ${response.statusText}`);
  }
  return response.json();
}

export async function getAllCountyPolicies(): Promise<SystemGptPolicyDto[]> {
  const response = await fetch(`${API_BASE}/system/policy/all`);
  if (!response.ok) {
    throw new Error(`Failed to fetch all policies: ${response.statusText}`);
  }
  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

interface SystemGptPolicyPanelProps {
  selectedCounty?: CountyId;
  refreshInterval?: number;
}

type LoadState = 'idle' | 'loading' | 'error';

/**
 * Phase 24: AI Policy Engine Panel
 * Displays county-scoped AI governance policies (read-only in v1).
 */
export const SystemGptPolicyPanel: React.FC<SystemGptPolicyPanelProps> = ({
  selectedCounty,
  refreshInterval = 60000,
}) => {
  const [policies, setPolicies] = useState<SystemGptPolicyDto[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedCounty, setExpandedCounty] = useState<string | null>(null);

  // Load all policies on mount and periodically
  useEffect(() => {
    const loadPolicies = async () => {
      setLoadState('loading');
      setLoadError(null);
      try {
        const data = await getAllCountyPolicies();
        setPolicies(data);
        setLoadState('idle');
        // Auto-expand selected county if provided
        if (selectedCounty && data.length > 0) {
          const matchingPolicy = data.find((p) => p.countyId === selectedCounty);
          if (matchingPolicy) {
            setExpandedCounty(matchingPolicy.countyId);
          }
        }
      } catch (err) {
        setLoadState('error');
        setLoadError(err instanceof Error ? err.message : 'Failed to load policies');
      }
    };

    loadPolicies();

    // Refresh periodically
    const interval = setInterval(loadPolicies, refreshInterval);
    return () => clearInterval(interval);
  }, [selectedCounty, refreshInterval]);

  const formatDate = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return isoString;
    }
  };

  const renderToggle = (enabled: boolean, label: string) => (
    <div className='flex items-center gap-2'>
      <div
        className={`h-3 w-3 rounded-full ${
          enabled
            ? 'bg-emerald-400 shadow-[0_0_6px_hsl(var(--tf-green-hs)_52%_/_0.5)]'
            : 'bg-rose-400 shadow-[0_0_6px_hsl(var(--tf-red-hs)_71%_/_0.4)]'
        }`}
      />
      <span className={enabled ? 'text-emerald-300' : 'text-rose-300'}>
        {label}: {enabled ? 'Allowed' : 'Denied'}
      </span>
    </div>
  );

  const renderPolicyCard = (policy: SystemGptPolicyDto) => {
    const isExpanded = expandedCounty === policy.countyId;
    const isConfigured = !policy.isPlaceholder;

    return (
      <div
        key={policy.countyId}
        className={`rounded-xl border transition-all duration-200 ${
          isConfigured
            ? 'border-cyan-500/30 bg-gradient-to-br from-slate-800/60 to-slate-900/60'
            : 'border-slate-700/40 bg-slate-900/40'
        }`}
      >
        {/* Header - always visible */}
        <button
          onClick={() => setExpandedCounty(isExpanded ? null : policy.countyId)}
          className='flex w-full items-center justify-between px-4 py-3 text-left'
        >
          <div className='flex items-center gap-3'>
            <span className='text-lg'>{isConfigured ? '🏛️' : '🔒'}</span>
            <div>
              <h3 className={`font-medium ${isConfigured ? 'text-cyan-200' : 'text-slate-400'}`}>
                {policy.countyName}
              </h3>
              <p className='text-xs text-slate-500'>
                v{policy.policyVersion} • Updated {formatDate(policy.lastUpdatedUtc)}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            {/* Quick status indicators */}
            <div className='flex gap-1'>
              <span
                title='GPT Messages'
                className={policy.allowGptSendMessage ? 'text-emerald-400' : 'text-rose-400'}
              >
                💬
              </span>
              <span
                title='RAG Queries'
                className={policy.allowRagQueries ? 'text-emerald-400' : 'text-rose-400'}
              >
                📚
              </span>
              <span
                title='Embeddings'
                className={policy.allowEmbeddings ? 'text-emerald-400' : 'text-rose-400'}
              >
                🧠
              </span>
              <span
                title='ExplainGPT'
                className={policy.allowExplainGpt ? 'text-emerald-400' : 'text-rose-400'}
              >
                ❓
              </span>
            </div>
            <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className='border-t border-slate-700/50 px-4 py-4 space-y-4'>
            {/* Operation Permissions */}
            <div>
              <h4 className='text-sm font-medium text-slate-300 mb-2'>🔓 Operation Permissions</h4>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                {renderToggle(policy.allowGptSendMessage, 'GPT Messages')}
                {renderToggle(policy.allowRagQueries, 'RAG Queries')}
                {renderToggle(policy.allowEmbeddings, 'Embeddings')}
                {renderToggle(policy.allowExplainGpt, 'ExplainGPT')}
              </div>
            </div>

            {/* Enforcement Rules */}
            <div>
              <h4 className='text-sm font-medium text-slate-300 mb-2'>⚙️ Enforcement Rules</h4>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`h-3 w-3 rounded-full ${
                      policy.requireExplainOnValuation ? 'bg-amber-400' : 'bg-slate-500'
                    }`}
                  />
                  <span
                    className={
                      policy.requireExplainOnValuation ? 'text-amber-300' : 'text-slate-400'
                    }
                  >
                    Require ExplainGPT on Valuation:{' '}
                    {policy.requireExplainOnValuation ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <div
                    className={`h-3 w-3 rounded-full ${
                      policy.sanitizeOwnerNames ? 'bg-amber-400' : 'bg-slate-500'
                    }`}
                  />
                  <span className={policy.sanitizeOwnerNames ? 'text-amber-300' : 'text-slate-400'}>
                    Sanitize Owner Names: {policy.sanitizeOwnerNames ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Deny Rules */}
            <div>
              <h4 className='text-sm font-medium text-slate-300 mb-2'>🚫 Deny Rules</h4>
              <div className='space-y-2 text-sm'>
                <div>
                  <span className='text-slate-400'>Blocked Prompt Patterns: </span>
                  {policy.denyPromptPatterns.length === 0 ? (
                    <span className='text-emerald-400'>None</span>
                  ) : (
                    <span className='text-rose-300'>
                      {policy.denyPromptPatterns.length} pattern(s)
                    </span>
                  )}
                  {policy.denyPromptPatterns.length > 0 && (
                    <ul className='mt-1 ml-4 list-disc text-xs text-rose-300/70'>
                      {policy.denyPromptPatterns.map((p, i) => (
                        <li key={i}>
                          <code className='bg-slate-800 px-1 rounded'>{p}</code>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <span className='text-slate-400'>Blocked Context IDs: </span>
                  {policy.denyContextIds.length === 0 ? (
                    <span className='text-emerald-400'>None</span>
                  ) : (
                    <span className='text-rose-300'>{policy.denyContextIds.join(', ')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Placeholder notice */}
            {policy.isPlaceholder && (
              <div className='mt-3 rounded-lg border border-slate-600/50 bg-slate-800/50 px-3 py-2 text-xs text-slate-400'>
                ℹ️ This is a placeholder policy. County not fully configured.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-cyan-200'>🛡️ AI Policy Engine</h2>
          <p className='text-sm text-slate-400'>
            Phase 24: County-scoped governance for GPT, RAG, Embeddings & ExplainGPT
          </p>
        </div>
        <div className='flex items-center gap-2 text-xs text-slate-500'>
          <span>v1 (Read-Only)</span>
          {loadState === 'loading' && (
            <div className='h-3 w-3 animate-spin rounded-full border border-cyan-400 border-t-transparent' />
          )}
        </div>
      </div>

      {/* Loading State */}
      {loadState === 'loading' && policies.length === 0 && (
        <div className='flex items-center justify-center py-8'>
          <div className='flex items-center gap-3 text-slate-400'>
            <div className='h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent' />
            <span>Loading policies…</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {loadState === 'error' && (
        <div className='rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200'>
          <div className='flex items-center gap-2 font-medium'>
            <span>⚠️</span>
            <span>Failed to load policies</span>
          </div>
          <p className='mt-1 text-sm text-rose-300/80'>{loadError}</p>
        </div>
      )}

      {/* Policy Cards */}
      {policies.length > 0 && <div className='space-y-3'>{policies.map(renderPolicyCard)}</div>}

      {/* Empty State */}
      {loadState === 'idle' && policies.length === 0 && (
        <div className='py-8 text-center text-slate-500'>
          <p>No policies configured</p>
        </div>
      )}

      {/* Legend */}
      <div className='rounded-lg border border-slate-700/40 bg-slate-800/30 px-4 py-3'>
        <h4 className='text-xs font-medium text-slate-400 mb-2'>Legend</h4>
        <div className='flex flex-wrap gap-4 text-xs'>
          <div className='flex items-center gap-1'>
            <span>💬</span>
            <span className='text-slate-400'>GPT Messages</span>
          </div>
          <div className='flex items-center gap-1'>
            <span>📚</span>
            <span className='text-slate-400'>RAG Queries</span>
          </div>
          <div className='flex items-center gap-1'>
            <span>🧠</span>
            <span className='text-slate-400'>Embeddings</span>
          </div>
          <div className='flex items-center gap-1'>
            <span>❓</span>
            <span className='text-slate-400'>ExplainGPT</span>
          </div>
          <div className='flex items-center gap-1'>
            <span className='text-emerald-400'>●</span>
            <span className='text-slate-400'>Allowed</span>
          </div>
          <div className='flex items-center gap-1'>
            <span className='text-rose-400'>●</span>
            <span className='text-slate-400'>Denied</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemGptPolicyPanel;
