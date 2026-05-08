/**
 * SYNC-UX-1C: recent runs list (no-detail state).
 *
 * Reads up to the last 10 runs from localStorage. Click a row to
 * open the detail page for that run.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCorpusRunsList } from './useCorpusRunsList';

export default function CorpusRunsList(): React.ReactElement {
  const navigate = useNavigate();
  const { runs } = useCorpusRunsList();

  return (
    <section
      aria-label='Recent runs'
      data-testid='recent-runs-list'
      className='tf-panel p-4 mt-4'
    >
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Recent runs (this browser)
      </h3>
      {runs.length === 0 ? (
        <p
          className='tf-text-secondary'
          data-testid='recent-runs-empty'
          style={{ fontSize: '0.85rem' }}
        >
          No runs recorded yet from this browser. Start a new drain above.
        </p>
      ) : (
        <ul
          style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}
        >
          {runs.map((r) => (
            <li
              key={r.runId}
              data-testid={`recent-run-${r.runId}`}
              style={{
                padding: '8px 6px',
                borderTop: '1px solid hsl(var(--tf-border))',
                cursor: 'pointer',
              }}
              onClick={() =>
                navigate(`/workbench/sync/corpus/${encodeURIComponent(r.runId)}`)
              }
            >
              <div className='tf-text' style={{ fontWeight: 500 }}>
                <code>{r.runId}</code>
              </div>
              <div
                className='tf-text-secondary'
                style={{ fontSize: '0.75rem', marginTop: 2 }}
              >
                {r.operatorName} · year {r.workingYear} ·{' '}
                {new Date(r.startedAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
