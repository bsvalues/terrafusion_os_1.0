// WORKBENCH-V0.3 SLICE-K: OS Shell Source Pack Fit Panel.
//
// Five states: idle · running · FAIL · WARN · PASS.
// FAIL is a hard gate — red blocking banner with no dismiss affordance.
// Output parsing is client-side (parsePackValidatorOutput.ts).
// Backend spawns pack-validator-runner.mjs and returns raw pipe-delimited stdout.
//
// Four sections: table_presence · column_structure · dictionary · data_content.
//
// Per docs/sync/workbench/SLICE_K_OS_SHELL_SOURCE_PACK_FIT_CONTRACT.md.

import React, { useState } from 'react';
import {
  type PackSection,
  type ParsedPackOutput,
  parsePackValidatorOutput,
} from './parsePackValidatorOutput';
import { PackValidatorConflictError } from '@/api/syncPackValidator';
import { usePackValidatorRun } from './usePackValidatorRun';

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

// ── Section labels ────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  table_presence: 'Table Presence',
  column_structure: 'Column Structure',
  dictionary: 'Dictionary (canonical_tf)',
  data_content: 'Data Content',
};

// ── Section card ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  section: PackSection;
  idx: number;
}

function SectionCard({ section, idx }: SectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const v = section.verdict;
  const color = verdictColor[v];
  const sym = SYM[v];
  const label = SECTION_LABELS[section.category] ?? section.category;
  const total = section.checks.length;

  const summary = [
    section.passCount > 0 ? `✓${section.passCount}` : null,
    section.warnCount > 0 ? `⚠${section.warnCount}` : null,
    section.failCount > 0 ? `✗${section.failCount}` : null,
    section.infoCount > 0 ? `ℹ${section.infoCount}` : null,
  ]
    .filter(Boolean)
    .join('  ');

  return (
    <div
      data-testid={`section-card-${idx}`}
      style={{
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: '10px 14px',
        marginBottom: 8,
        background: 'hsl(var(--tf-surface, 220 20% 12%))',
      }}
    >
      <button
        data-testid={`section-card-${idx}-toggle`}
        onClick={() => setExpanded(x => !x)}
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
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span
          style={{
            marginLeft: 8,
            fontSize: '0.82rem',
            color: 'hsl(var(--tf-muted, 215 14% 55%))',
          }}
        >
          ({total}) {summary}
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
          data-testid={`section-card-${idx}-details`}
          style={{
            marginTop: 8,
            paddingLeft: 0,
            listStyle: 'none',
            fontSize: '0.82rem',
          }}
        >
          {section.checks.map((check, i) => {
            const cv =
              check.verdict === 'FAIL'
                ? verdictColor.FAIL
                : check.verdict === 'WARN'
                ? verdictColor.WARN
                : check.verdict === 'INFO'
                ? 'hsl(var(--tf-muted, 215 14% 55%))'
                : verdictColor.PASS;
            const csym =
              check.verdict === 'FAIL'
                ? '✗'
                : check.verdict === 'WARN'
                ? '⚠'
                : check.verdict === 'INFO'
                ? 'ℹ'
                : '✓';
            return (
              <li
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '16px 1fr auto auto',
                  gap: '0 8px',
                  alignItems: 'start',
                  marginBottom: 4,
                  color: cv,
                  lineHeight: 1.4,
                }}
              >
                <span>{csym}</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {check.checkName}
                </span>
                <span
                  style={{
                    color: 'hsl(var(--tf-muted, 215 14% 55%))',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {check.measured}
                </span>
                <span
                  style={{
                    color: 'hsl(var(--tf-muted, 215 14% 45%))',
                    whiteSpace: 'nowrap',
                    fontSize: '0.78rem',
                  }}
                >
                  ({check.expected})
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Overall banner ────────────────────────────────────────────────────────────

interface ResultBannerProps {
  parsed: ParsedPackOutput;
  durationMs: number;
  timestamp: string;
}

function ResultBanner({ parsed, durationMs, timestamp }: ResultBannerProps) {
  const overall = parsed.overall ?? 'FAIL';
  const color = verdictColor[overall] ?? verdictColor.FAIL;
  const dur =
    durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`;
  const ts = new Date(timestamp).toUTCString().replace(' GMT', ' UTC');
  const totalChecks = parsed.passCount + parsed.warnCount + parsed.failCount + parsed.infoCount;

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
          {overall === 'PASS' &&
            ` — ${totalChecks > 0 ? `${parsed.passCount + parsed.infoCount}/${totalChecks}` : '66/66'} checks pass · landing layer conforms to Harris PACS spec`}
          {overall === 'WARN' &&
            ` — ${parsed.warnCount} check${parsed.warnCount !== 1 ? 's' : ''} need county override documentation`}
          {overall === 'FAIL' &&
            ` — landing layer does not conform to pack spec · do NOT drain`}
        </span>
      </div>

      {/* FAIL is a hard gate — no dismiss, no "proceed anyway" */}
      {overall === 'FAIL' && (
        <p
          data-testid='fail-gate-notice'
          style={{ margin: '8px 0 4px', fontWeight: 600, color }}
        >
          ⛔ DO NOT DRAIN until FAIL items are resolved. Inspect the failing section below.
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

// ── Raw output toggle ─────────────────────────────────────────────────────────

function RawOutputToggle({ stdout }: { stdout: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginTop: 16 }}>
      <button
        data-testid='raw-output-toggle'
        onClick={() => setShow(x => !x)}
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

export function SourcePackFitPage() {
  const { run, isPending, isError, error, data, reset } = usePackValidatorRun();

  const parsed: ParsedPackOutput | null = data
    ? parsePackValidatorOutput(data.stdout)
    : null;

  const hasResult = data != null && !isPending;
  const isConflict = isError && error instanceof PackValidatorConflictError;

  return (
    <div
      data-testid='source-pack-page'
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
          Source Pack Fit
        </h2>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '0.85rem',
            color: 'hsl(var(--tf-muted, 215 14% 55%))',
          }}
        >
          Validates that the Harris PACS landing layer conforms to the source pack spec.
          Run to inspect why Doctor Step #0 passed or failed.
        </p>
      </div>

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
            ? 'Re-run Pack Validator'
            : 'Run Pack Validator'}
        </button>
      </div>

      {/* ── State: running ───────────────────────────────────────────────── */}
      {isPending && (
        <div data-testid='running-state'>
          <p style={{ color: 'hsl(var(--tf-muted, 215 14% 55%))', margin: '16px 0' }}>
            Pack validator is running — this takes 5–30 seconds.
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
          Check that the Harris PACS landing layer conforms to the source pack spec.
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
          {error?.message ?? 'Pack validator already running — please wait.'}
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

          <div data-testid='section-cards'>
            {parsed.sections.length > 0 ? (
              parsed.sections.map((section, idx) => (
                <SectionCard key={section.category} section={section} idx={idx} />
              ))
            ) : (
              <p
                style={{
                  color: 'hsl(var(--tf-muted, 215 14% 55%))',
                  fontSize: '0.9rem',
                }}
              >
                No section data found. Check raw output for psql connection errors.
              </p>
            )}
          </div>

          <RawOutputToggle stdout={data!.stdout} />
        </div>
      )}
    </div>
  );
}

export default SourcePackFitPage;
