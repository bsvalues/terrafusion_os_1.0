/**
 * SYNC-UX-1B: Right-pane commit detail.
 *
 * Renders the selected commit's full payload — header (commit id +
 * timestamp + operator + idempotency key + note), routed/dismissed
 * counts, parsed universe + ratio distribution snapshots, decisions
 * table, and the evidence-packet section (download + manifest viewer).
 *
 * Distribution-snapshot JSON parse failures are non-fatal — the
 * panel renders a labeled placeholder so the operator can still
 * download the evidence ZIP and inspect the manifest directly.
 */

import React, { useState } from 'react';
import {
  evidenceZipHref,
  parseRatioDistribution,
  parseUniverseDistribution,
  type CommitDetailResponse,
} from '@/api/syncCommits';
import DecisionsTable from './DecisionsTable';
import ManifestViewer from './ManifestViewer';
import RatioDistributionMatrix from './RatioDistributionMatrix';
import UniverseDistributionChart from './UniverseDistributionChart';

interface Props {
  commit: CommitDetailResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}

export default function CommitDetail({
  commit,
  isLoading,
  isError,
}: Props): React.ReactElement {
  if (isLoading) {
    return (
      <section
        className='tf-panel p-4'
        aria-label='Commit detail'
        data-testid='commit-detail-loading'
      >
        <p className='tf-text-secondary' style={{ fontSize: '0.9rem' }}>
          Loading commit detail…
        </p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className='tf-status-error p-4 rounded' data-testid='commit-detail-error'>
        Failed to load commit detail.
      </section>
    );
  }

  if (!commit) {
    return (
      <section
        className='tf-panel p-4'
        aria-label='Commit detail empty'
        data-testid='commit-detail-empty'
      >
        <p className='tf-text-secondary' style={{ fontSize: '0.9rem' }}>
          Select a commit on the left to view its decisions and evidence packet.
        </p>
      </section>
    );
  }

  const universe = parseUniverseDistribution(commit.universeDistributionJson);
  const ratio = parseRatioDistribution(commit.ratioDistributionJson);

  return (
    <section
      aria-label='Commit detail'
      data-testid='commit-detail'
      data-commit-id={commit.commitId}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <CommitHeader commit={commit} />

      <CountsRow commit={commit} />

      {universe ? (
        <UniverseDistributionChart distribution={universe} />
      ) : (
        <UnparseablePlaceholder kind='universe' />
      )}

      {ratio ? (
        <RatioDistributionMatrix distribution={ratio} />
      ) : (
        <UnparseablePlaceholder kind='ratio' />
      )}

      <DecisionsTable decisions={commit.decisions} />

      <EvidencePacketSection commitId={commit.commitId} committedAt={commit.committedAt} />
    </section>
  );
}

function CommitHeader({ commit }: { commit: CommitDetailResponse }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(commit.commitId);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // best-effort
    }
  };

  return (
    <header className='tf-panel p-4' data-testid='commit-detail-header'>
      <div className='flex items-center gap-2 mb-2'>
        <code
          className='tf-text font-semibold'
          style={{ fontSize: '0.95rem', wordBreak: 'break-all' }}
          data-testid='commit-id-full'
        >
          {commit.commitId}
        </code>
        <button
          type='button'
          className='tf-status-info px-2 py-0.5 rounded'
          onClick={onCopy}
          aria-label='Copy commit id'
          data-testid='commit-id-copy'
          style={{ fontSize: '0.75rem' }}
        >
          {copied ? 'Copied' : 'Copy id'}
        </button>
      </div>
      <dl
        className='tf-text-secondary'
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '4px 12px',
          fontSize: '0.8rem',
          margin: 0,
        }}
      >
        <dt>Committed at</dt>
        <dd className='tf-text' data-testid='commit-committed-at'>
          {new Date(commit.committedAt).toLocaleString()}
        </dd>
        <dt>Operator</dt>
        <dd className='tf-text' data-testid='commit-operator'>
          {commit.operatorId}
        </dd>
        <dt>Idempotency key</dt>
        <dd
          className='tf-text'
          style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
          data-testid='commit-idempotency-key'
        >
          {commit.idempotencyKey}
        </dd>
        {commit.commitNote && (
          <>
            <dt>Note</dt>
            <dd className='tf-text' data-testid='commit-note'>
              {commit.commitNote}
            </dd>
          </>
        )}
      </dl>
    </header>
  );
}

function CountsRow({ commit }: { commit: CommitDetailResponse }): React.ReactElement {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}
      data-testid='commit-counts'
    >
      <div className='tf-status-info p-3 rounded'>
        <div className='tf-text-secondary' style={{ fontSize: '0.7rem' }}>
          Routed decisions applied
        </div>
        <div
          className='tf-text font-semibold'
          style={{ fontSize: '1.2rem', fontVariantNumeric: 'tabular-nums' }}
          data-testid='commit-routed-count'
        >
          {commit.routedDecisionsApplied.toLocaleString()}
        </div>
      </div>
      <div className='tf-status-warning p-3 rounded'>
        <div className='tf-text-secondary' style={{ fontSize: '0.7rem' }}>
          Dismissed decisions applied
        </div>
        <div
          className='tf-text font-semibold'
          style={{ fontSize: '1.2rem', fontVariantNumeric: 'tabular-nums' }}
          data-testid='commit-dismissed-count'
        >
          {commit.dismissedDecisionsApplied.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function UnparseablePlaceholder({
  kind,
}: {
  kind: 'universe' | 'ratio';
}): React.ReactElement {
  return (
    <section
      className='tf-status-warning p-3 rounded'
      data-testid={`unparseable-${kind}`}
      aria-label={`${kind} distribution unparseable`}
    >
      Could not parse {kind} distribution snapshot — see manifest for raw bytes.
    </section>
  );
}

function EvidencePacketSection({
  commitId,
  committedAt,
}: {
  commitId: string;
  committedAt: string;
}): React.ReactElement {
  const href = evidenceZipHref(commitId);
  // The backend sets Content-Disposition; we hint the filename via the
  // download attribute so saves outside Chrome / before redirects also
  // get a sensible default name.
  const safeStamp = committedAt.replace(/[:.]/g, '-');
  const downloadName = `terrafusion-evidence-${commitId}-${safeStamp}.zip`;

  return (
    <section
      className='tf-panel p-4'
      aria-label='Evidence packet'
      data-testid='evidence-section'
    >
      <h3 className='tf-text font-medium mb-2' style={{ fontSize: '0.95rem' }}>
        Evidence packet
      </h3>
      <p className='tf-text-secondary' style={{ fontSize: '0.8rem', marginBottom: 8 }}>
        Signed ZIP plus inspectable JSON manifest. Counts in this commit are
        sealed at commit time; subsequent doctrine drains do not retroactively
        change the snapshot.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <a
          className='tf-status-info px-3 py-1.5 rounded font-medium'
          href={href}
          download={downloadName}
          data-testid='evidence-download-link'
          style={{ fontSize: '0.85rem', textDecoration: 'none' }}
          aria-label='Download evidence ZIP'
        >
          Download evidence ZIP
        </a>
        <ManifestViewer commitId={commitId} />
      </div>
    </section>
  );
}
