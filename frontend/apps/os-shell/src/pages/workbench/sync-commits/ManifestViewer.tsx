/**
 * SYNC-UX-1B: Inline manifest JSON viewer.
 *
 * The manifest is fetched from <c>GET /api/sync/workbench/h/evidence/
 * {commitId}/manifest</c> on demand (toggle button). Pretty-prints
 * the JSON and exposes a Copy button. The viewer never auto-fetches
 * — operator clicks "View Manifest" to pull bytes.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { getEvidenceManifest } from '@/api/syncCommits';

interface Props {
  commitId: string;
}

export default function ManifestViewer({ commitId }: Props): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [manifest, setManifest] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset cached manifest when the commit changes — different commit, different bytes.
  useEffect(() => {
    setOpen(false);
    setManifest(null);
    setError(null);
    setCopied(false);
  }, [commitId]);

  const loadManifest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await getEvidenceManifest(commitId);
      setManifest(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [commitId]);

  const handleToggle = useCallback(async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (manifest === null && !error) {
      await loadManifest();
    }
  }, [open, manifest, error, loadManifest]);

  const handleCopy = useCallback(async () => {
    if (manifest === null) return;
    const text = JSON.stringify(manifest, null, 2);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Best-effort; no toast escalation needed.
    }
  }, [manifest]);

  const pretty = manifest === null ? '' : JSON.stringify(manifest, null, 2);

  return (
    <div data-testid='manifest-viewer'>
      <button
        type='button'
        className='tf-status-info px-3 py-1.5 rounded font-medium'
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={`manifest-${commitId}`}
        data-testid='manifest-toggle'
        style={{ fontSize: '0.85rem' }}
      >
        {open ? 'Hide manifest' : 'View manifest'}
      </button>

      {open && (
        <div
          id={`manifest-${commitId}`}
          className='tf-panel p-3 mt-2 rounded'
          data-testid='manifest-body'
          style={{ overflowX: 'auto' }}
        >
          {loading && (
            <p className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
              Loading manifest…
            </p>
          )}
          {error && (
            <p
              className='tf-status-error p-2 rounded'
              data-testid='manifest-error'
              style={{ fontSize: '0.85rem' }}
            >
              Failed to load manifest: {error}
            </p>
          )}
          {!loading && !error && manifest !== null && (
            <>
              <div
                className='flex items-center justify-between mb-2'
                style={{ fontSize: '0.8rem' }}
              >
                <span className='tf-text-secondary'>manifest.json</span>
                <button
                  type='button'
                  className='tf-status-info px-2 py-1 rounded'
                  onClick={handleCopy}
                  data-testid='manifest-copy'
                  aria-label='Copy manifest JSON to clipboard'
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre
                className='tf-text'
                data-testid='manifest-json'
                style={{
                  fontSize: '0.75rem',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {pretty}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
