// WORKBENCH-V0.3 SLICE-L: OS Shell Identity Spine Panel.
//
// Five states: idle · running · FAIL · WARN · PASS.
// FAIL is a hard gate — red blocking banner with no dismiss affordance.
// Output parsing is client-side (parseIdentityDriftOutput.ts).
// Backend spawns identity-runner.mjs and returns raw pipe-delimited stdout.
//
// Four groups: F1 Family · Valuation/Jurisdiction/Exemption · Revenue · Owner Link.
// tf_parcel_owner_link FAIL is downgraded to WARN (known deferred lane).
//
// Doctrine Learned Law #2: never blind-join canonical_tf.tf_parcel (3.2M rows).
// Resolve through sync_bridge.source_xref WHERE TfEntityType='parcel' AND IsActive.
//
// Per docs/sync/workbench/SLICE_L_OS_SHELL_IDENTITY_SPINE_CONTRACT.md.

import React, { useState } from 'react';
import {
  type IdentityGroup,
  type IdentityTableRow,
  type ParsedIdentityOutput,
  parseIdentityDriftOutput,
} from './parseIdentityDriftOutput';
import { IdentityConflictError } from '@/api/syncIdentitySpine';
import { useIdentitySpineRun } from './useIdentitySpineRun';

// ── Verdict symbols / colors ──────────────────────────────────────────────────

type Verdict = 'PASS' | 'WARN' | 'FAIL';

const SYM: Record<Verdict, string> = {
  PASS: '✓',
  WARN: '⚠',
  FAIL: '✗',
};

const verdictColor: Record<Verdict, string> = {
  PASS: 'hsl(var(--tf-success, 145 60% 40%))',
  WARN: 'hsl(var(--tf-warn, 40 95% 55%))',
  FAIL: 'hsl(var(--tf-danger, 0 75% 50%))',
};

// ── Row display ───────────────────────────────────────────────────────────────

interface TableRowDisplayProps {
  row: IdentityTableRow;
}

function TableRowDisplay({ row }: TableRowDisplayProps) {
  const color = verdictColor[row.effectiveVerdict];
  const sym = SYM[row.effectiveVerdict];

  return (
    <li
      data-testid={`identity-row-${row.laneTable}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '16px 1fr auto auto auto',
        gap: '0 10px',
        alignItems: 'center',
        marginBottom: 4,
        fontSize: '0.83rem',
      }}
    >
      <span style={{ color }}>{sym}</span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: 'hsl(var(--tf-fg, 210 20% 85%))',
          wordBreak: 'break-all',
        }}
      >
        {row.laneTable}
        {row.isDeferred && (
          <span
            style={{
              marginLeft: 6,
              fontSize: '0.72rem',
              color: 'hsl(var(--tf-warn, 40 95% 55%))',
              fontStyle: 'italic',
            }}
          >
            (deferred)
          </span>
        )}
      </span>
      <span style={{ color, whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
        {row.dangling.toLocaleString()} dangling
      </span>
      <span
        style={{
          color: 'hsl(var(--tf-muted, 215 14% 45%))',
          whiteSpace: 'nowrap',
          fontSize: '0.75rem',
        }}
      >
        {row.live.toLocaleString()}/{row.total.toLocaleString()} live
      </span>
    </li>
  );
}

// ── Group card ────────────────────────────────────────────────────────────────

interface GroupCardProps {
  group: IdentityGroup;
  idx: number;
}

function GroupCard({ group, idx }: GroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const v = group.verdict;
  const color = verdictColor[v];
  const sym = SYM[v];

  const passCt = group.rows.filter((r) => r.effectiveVerdict === 'PASS').length;
  const warnCt = group.rows.filter((r) => r.effectiveVerdict === 'WARN').length;
  const failCt = group.rows.filter((r) => r.effectiveVerdict === 'FAIL').length;

  const summary = [
    passCt > 0 ? `✓${passCt}` : null,
    warnCt > 0 ? `⚠${warnCt}` : null,
    failCt > 0 ? `✗${failCt}` : null,
  ]
    .filter(Boolean)
    .join('  ');

  return (
    <div
      data-testid={`group-card-${idx}`}
      style={{
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: '10px 14px',
        marginBottom: 8,
        background: 'hsl(var(--tf-surface, 220 20% 12%))',
      }}
    >
      <button
        data-testid={`group-card-${idx}-toggle`}
        onClick={() => setExpanded((x) => !x)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color,
          fontSize: '0.95rem',
          fontFamily: 'inherit',
          textAlign: 'left',
          padding: 0,
        }}
      >
        <span style={{ fontSize: '1.1em', minWidth: 18 }}>{sym}</span>
        <span style={{ fontWeight: 600 }}>{group.label}</span>
        <span
          style={{
            marginLeft: 8,
            fontSize: '0.82rem',
            color: 'hsl(var(--tf-muted, 215 14% 55%))',
          }}
        >
          ({group.rows.length}) {summary}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.75rem',
            color: 'hsl(var(--tf-muted, 215 14% 55%))',
          }}
        >
          {expanded ? '▲ collapse' : '▼ expand'}
        </span>
      </button>

      {expanded && (
        <ul
          data-testid={`group-card-${idx}-details`}
          style={{
            marginTop: 8,
            paddingLeft: 0,
            listStyle: 'none',
          }}
        >
          {group.rows.map((row) => (
            <TableRowDisplay key={row.laneTable} row={row} />
          ))}
          {group.rows.length === 0 && (
            <li
              style={{
                fontSize: '0.82rem',
                color: 'hsl(var(--tf-muted, 215 14% 55%))',
              }}
            >
              No rows for this group.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ── Overall banner ────────────────────────────────────────────────────────────

interface ResultBannerProps {
  parsed: ParsedIdentityOutput;
  durationMs: number;
  timestamp: string;
}

function ResultBanner({ parsed, durationMs, timestamp }: ResultBannerProps) {
  const overall = parsed.overall;
  const color = verdictColor[overall];
  const dur =
    durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`;
  const ts = new Date(timestamp).toUTCString().replace(' GMT', ' UTC');

  const warnCt = parsed.rows.filter((r) => r.effectiveVerdict === 'WARN').length;
  const failCt = parsed.rows.filter((r) => r.effectiveVerdict === 'FAIL').length;

  return (
    <div
      data-testid='overall-banner'
      style={{
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: '14px 18px',
        marginBottom: 16,
        background: 'hsl(var(--tf-surface, 220 20% 12%))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span data-testid='overall-sym' style={{ fontSize: '1.4em', color }}>
          {SYM[overall]}
        </span>
        <span
          data-testid='overall-verdict'
          style={{ fontSize: '1.1rem', fontWeight: 700, color }}
        >
          {overall}
          {overall === 'PASS' && ' — no identity drift · all FK references resolve'}
          {overall === 'WARN' &&
            ` — ${warnCt} table${warnCt !== 1 ? 's' : ''} with known deferred drift`}
          {overall === 'FAIL' &&
            ` — ${failCt} table${failCt !== 1 ? 's' : ''} with unresolved FK drift · do NOT drain`}
        </span>
      </div>

      {/* FAIL is a hard gate — no dismiss, no "proceed anyway" */}
      {overall === 'FAIL' && (
        <p
          data-testid='fail-gate-notice'
          style={{ margin: '8px 0 4px', fontWeight: 600, color }}
        >
          ⛔ Identity drift detected in unsealed lanes. Resolve FAIL rows before running any drain.
        </p>
      )}

      <p
        style={{
          margin: '4px 0 0',
          fontSize: '0.82rem',
          color: 'hsl(var(--tf-muted, 215 14% 55%))',
        }}
      >
        Last run: {ts} · {dur}
      </p>
    </div>
  );
}

// ── Doctrine callout ──────────────────────────────────────────────────────────

function DoctrineCallout() {
  return (
    <div
      data-testid='doctrine-callout'
      style={{
        padding: '10px 14px',
        border: '1px solid hsl(var(--tf-border, 215 14% 25%))',
        borderRadius: 6,
        marginBottom: 16,
        fontSize: '0.82rem',
        color: 'hsl(var(--tf-muted, 215 14% 55%))',
        background: 'hsl(var(--tf-surface, 220 20% 12%))',
      }}
    >
      <strong style={{ color: 'hsl(var(--tf-fg, 210 20% 85%))' }}>
        Doctrine Learned Law #2
      </strong>{' '}
      — Never blind-join <code>canonical_tf.tf_parcel</code> (3.2M rows). Resolve
      through <code>sync_bridge.source_xref</code> WHERE{' '}
      <code>TfEntityType='parcel'</code> AND <code>IsActive</code>.
      Dangling FK refs reported here are against <code>source_xref</code> live parcels.
    </div>
  );
}

// ── Raw output toggle ─────────────────────────────────────────────────────────

function RawOutputToggle({ stdout }: { stdout: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginTop: 16 }}>
      <button
        data-testid='raw-output-toggle'
        onClick={() => setShow((x) => !x)}
        style={{
          background: 'none',
          border: '1px solid hsl(var(--tf-border, 215 14% 25%))',
          borderRadius: 4,
          padding: '4px 10px',
          cursor: 'pointer',
          color: 'hsl(var(--tf-muted, 215 14% 55%))',
          fontSize: '0.82rem',
          fontFamily: 'inherit',
        }}
      >
        {show ? 'Hide raw output' : 'Show raw output'}
      </button>
      {show && (
        <pre
          data-testid='raw-output'
          style={{
            marginTop: 8,
            padding: 12,
            background: 'hsl(var(--tf-surface, 220 20% 12%))',
            border: '1px solid hsl(var(--tf-border, 215 14% 25%))',
            borderRadius: 4,
            fontSize: '0.78rem',
            color: 'hsl(var(--tf-fg, 210 20% 85%))',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {stdout || '(empty)'}
        </pre>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function IdentitySpinePage() {
  const { run, isPending, isError, error, data, reset } = useIdentitySpineRun();

  const parsed: ParsedIdentityOutput | null = data
    ? parseIdentityDriftOutput(data.stdout)
    : null;

  const hasResult = data != null && !isPending;
  const isConflict = isError && error instanceof IdentityConflictError;

  return (
    <div
      data-testid='identity-spine-page'
      style={{
        padding: '24px 28px',
        maxWidth: 900,
        color: 'hsl(var(--tf-fg, 210 20% 85%))',
        fontFamily: 'inherit',
      }}
    >
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            margin: 0,
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'hsl(var(--tf-transcend-cyan, 185 100% 72%))',
          }}
        >
          Identity Spine
        </h2>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '0.85rem',
            color: 'hsl(var(--tf-muted, 215 14% 55%))',
          }}
        >
          Validates that all canonical FK references resolve back to live source parcels.
          Detects dangling references that would cause silent join failures.
        </p>
      </div>

      {/* ── Doctrine callout (always visible) ────────────────────────────── */}
      <DoctrineCallout />

      {/* ── Run / Re-run button ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <button
          data-testid='run-button'
          onClick={() => {
            reset();
            run();
          }}
          disabled={isPending}
          style={{
            padding: '8px 20px',
            background: isPending
              ? 'hsl(var(--tf-surface, 220 20% 12%))'
              : 'hsl(var(--tf-transcend-cyan, 185 100% 72%) / 0.12)',
            border: '1px solid hsl(var(--tf-transcend-cyan, 185 100% 72%))',
            borderRadius: 6,
            color: 'hsl(var(--tf-transcend-cyan, 185 100% 72%))',
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.92rem',
            fontWeight: 600,
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending
            ? 'Running…'
            : hasResult
            ? 'Re-run Identity Check'
            : 'Run Identity Check'}
        </button>
      </div>

      {/* ── State: running ───────────────────────────────────────────────── */}
      {isPending && (
        <div data-testid='running-state'>
          <p style={{ color: 'hsl(var(--tf-muted, 215 14% 55%))', margin: '16px 0' }}>
            Identity drift check is running — this takes 30–90 seconds (large table scans).
          </p>
        </div>
      )}

      {/* ── State: idle ──────────────────────────────────────────────────── */}
      {!isPending && !hasResult && !isError && (
        <p
          data-testid='idle-hint'
          style={{
            color: 'hsl(var(--tf-muted, 215 14% 55%))',
            fontSize: '0.9rem',
            margin: '16px 0',
          }}
        >
          Check that all canonical FK references resolve to live source parcels.
        </p>
      )}

      {/* ── State: error (non-conflict) ───────────────────────────────────── */}
      {isError && !isConflict && (
        <div
          data-testid='run-error'
          style={{
            padding: '12px 16px',
            border: '1px solid hsl(var(--tf-danger, 0 75% 50%))',
            borderRadius: 6,
            color: 'hsl(var(--tf-danger, 0 75% 50%))',
            marginBottom: 16,
          }}
        >
          <strong>Error:</strong> {error?.message ?? 'Unknown error'}
        </div>
      )}

      {/* ── State: 409 conflict ───────────────────────────────────────────── */}
      {isConflict && (
        <div
          data-testid='conflict-notice'
          style={{
            padding: '12px 16px',
            border: '1px solid hsl(var(--tf-warn, 40 95% 55%))',
            borderRadius: 6,
            color: 'hsl(var(--tf-warn, 40 95% 55%))',
            marginBottom: 16,
          }}
        >
          {error?.message ?? 'Identity runner already running — please wait.'}
        </div>
      )}

      {/* ── State: has result ─────────────────────────────────────────────── */}
      {hasResult && parsed && (
        <div data-testid='result-state'>
          <ResultBanner
            parsed={parsed}
            durationMs={data!.durationMs}
            timestamp={data!.timestamp}
          />

          <div data-testid='group-cards'>
            {parsed.groups.length > 0 ? (
              parsed.groups.map((group, idx) => (
                <GroupCard key={group.label} group={group} idx={idx} />
              ))
            ) : (
              <p
                style={{
                  color: 'hsl(var(--tf-muted, 215 14% 55%))',
                  fontSize: '0.9rem',
                }}
              >
                No group data found. Check raw output for psql connection errors.
              </p>
            )}
          </div>

          <RawOutputToggle stdout={data!.stdout} />
        </div>
      )}
    </div>
  );
}

export default IdentitySpinePage;
