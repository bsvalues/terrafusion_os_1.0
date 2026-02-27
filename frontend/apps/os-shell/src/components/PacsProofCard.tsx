/**
 * PacsProofCard — Compact PACS contract proof indicator for the OS sidebar.
 *
 * Shows: contract valid / invalid, DB name, property count, latency.
 * Calls /ops/pacs/proof on mount + manual refresh.
 *
 * @module components/PacsProofCard
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Database, RefreshCw, CheckCircle2, XCircle, Wifi, WifiOff } from 'lucide-react';
import { getPacsProof, type PacsProofResponse } from '../services/pacsService';

type Status = 'idle' | 'loading' | 'live' | 'offline';

export const PacsProofCard: React.FC = () => {
  const [proof, setProof] = useState<PacsProofResponse | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const fetchProof = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await getPacsProof();
      setProof(data);
      setStatus(data.contractValid ? 'live' : 'offline');
    } catch {
      setProof(null);
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    fetchProof();
  }, [fetchProof]);

  const iconColor =
    status === 'live'
      ? 'hsl(var(--tf-accent-success, 142 76% 42%))'
      : status === 'offline'
        ? 'hsl(var(--tf-accent-danger, 0 84% 60%))'
        : 'hsl(var(--tf-muted-foreground))';

  return (
    <div style={{ fontSize: '0.75rem', display: 'grid', gap: '0.3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontWeight: 600,
            color: 'hsl(var(--tf-foreground))',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <Database size={12} /> PACS Contract
        </span>
        <button
          onClick={fetchProof}
          disabled={status === 'loading'}
          aria-label="Refresh PACS proof"
          style={{
            background: 'none',
            border: 'none',
            cursor: status === 'loading' ? 'wait' : 'pointer',
            color: 'hsl(var(--tf-muted-foreground))',
            padding: '0.15rem',
            borderRadius: '0.2rem',
            display: 'flex',
          }}
        >
          <RefreshCw size={12} className={status === 'loading' ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Status line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
        {status === 'live' ? (
          <>
            <Wifi size={11} style={{ color: iconColor }} />
            <CheckCircle2 size={11} style={{ color: iconColor }} />
            <span style={{ color: iconColor }}>Valid</span>
          </>
        ) : status === 'offline' ? (
          <>
            <WifiOff size={11} style={{ color: iconColor }} />
            <XCircle size={11} style={{ color: iconColor }} />
            <span style={{ color: iconColor }}>
              {proof ? 'Invalid' : 'Offline'}
            </span>
          </>
        ) : (
          <span style={{ color: 'hsl(var(--tf-muted-foreground))' }}>Checking…</span>
        )}

        {proof && (
          <span style={{ color: 'hsl(var(--tf-muted-foreground))' }}>
            {proof.latencyMs}ms
          </span>
        )}
      </div>

      {/* Detail row */}
      {proof && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            color: 'hsl(var(--tf-muted-foreground))',
            flexWrap: 'wrap',
          }}
        >
          <span title="Database name">{proof.dbName}</span>
          <span title="Contract version">v{proof.contract.version}</span>
          {proof.readOnly && <span title="Read-only access">RO</span>}
        </div>
      )}

      {/* Errors / warnings */}
      {proof && proof.errors.length > 0 && (
        <div style={{ color: 'hsl(var(--tf-accent-danger, 0 84% 60%))', fontSize: '0.65rem' }}>
          {proof.errors.length} error{proof.errors.length !== 1 ? 's' : ''}
        </div>
      )}
      {proof && proof.warnings.length > 0 && (
        <div style={{ color: 'hsl(var(--tf-accent-warning, 38 92% 55%))', fontSize: '0.65rem' }}>
          {proof.warnings.length} warning{proof.warnings.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
