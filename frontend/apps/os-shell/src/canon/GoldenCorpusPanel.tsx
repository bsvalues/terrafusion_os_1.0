/**
 * GoldenCorpusPanel — displays Golden Corpus lockfile status.
 *
 * Shows release tag, artifact count, individual artifact names + SHA256 prefixes,
 * and ledger state. Loaded on-demand via the right sidebar.
 *
 * @see Phase B: Golden Corpus Dashboard
 */

import React, { useCallback, useEffect, useState } from 'react';
import { fetchCorpusStatus, type CorpusStatusResponse } from '../api/canonFs';

interface Props {
  /** Whether the panel is visible (skip fetching when hidden) */
  visible?: boolean;
}

export function GoldenCorpusPanel({ visible = true }: Props): React.ReactElement {
  const [data, setData] = useState<CorpusStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchCorpusStatus();
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible && !data && !loading) {
      void load();
    }
  }, [visible, data, loading, load]);

  if (!visible) return <></>;

  return (
    <section className='canon-corpus' data-testid='golden-corpus-panel'>
      <header
        className='canon-corpus__header'
        onClick={() => setExpanded(prev => !prev)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem' }}
      >
        <span style={{ fontSize: '0.7rem' }}>{expanded ? '▼' : '▶'}</span>
        <span className='text-xs font-semibold text-gray-300 uppercase tracking-wider'>
          Golden Corpus
        </span>
        {data?.ok && (
          <span
            className='canon-header__status canon-header__status--connected'
            title='Corpus loaded'
          />
        )}
        {data && !data.ok && (
          <span
            className='canon-header__status canon-header__status--disconnected'
            title={data.error || 'Failed'}
          />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); void load(); }}
          className='ml-auto text-xs text-gray-400 hover:text-[hsl(var(--tf-text))]'
          disabled={loading}
          title='Refresh'
        >
          {loading ? '⟳' : '↻'}
        </button>
      </header>

      {expanded && (
        <div className='canon-corpus__body' style={{ padding: '0 0.75rem 0.5rem' }}>
          {loading && !data && (
            <p className='text-xs text-gray-500'>Loading corpus…</p>
          )}

          {data?.error && (
            <p className='text-xs text-red-400'>{data.error}</p>
          )}

          {data?.ok && (
            <>
              <div className='text-xs text-gray-400' style={{ marginBottom: '0.25rem' }}>
                <span className='text-gray-300'>Release:</span> {data.releaseTag}
                <span className='text-gray-500'> · v{data.version}</span>
              </div>
              <div className='text-xs text-gray-400' style={{ marginBottom: '0.25rem' }}>
                <span className='text-gray-300'>Artifacts:</span> {data.artifactCount}
                <span className='text-gray-500'> · seq #{data.sequenceNumber}</span>
              </div>
              <div className='text-xs text-gray-500' style={{ marginBottom: '0.5rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                Ledger: {data.ledgerHeadSha256?.slice(0, 16)}…
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {data.artifacts.map((a) => (
                  <li
                    key={a.name}
                    className='text-xs'
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '0.125rem 0', borderBottom: '1px solid hsl(var(--tf-text) / 0.04)' }}
                  >
                    <span className='text-gray-300' style={{ fontFamily: 'monospace' }}>
                      {a.name}
                    </span>
                    <span className='text-gray-500' style={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                      {a.sha256.slice(0, 8)}… {formatBytes(a.bytes)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}
