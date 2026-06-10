// WORKBENCH-V0.3 SLICE-J: OS Shell Doctor Panel.
//
// Five states: idle · running · FAIL · WARN · PASS.
// FAIL is a hard gate — red blocking banner with no dismiss affordance.
// Output parsing is client-side (parseDoctorOutput.ts).
// Backend spawns tf-sync-doctor.mjs and returns raw stdout.
//
// Per docs/sync/workbench/SLICE_J_OS_SHELL_DOCTOR_PANEL_CONTRACT.md.

import React, { useState } from 'react';
import { type DoctorStep, type ParsedDoctorOutput, type StepVerdict, parseDoctorOutput } from './parseDoctorOutput';
import { DoctorConflictError } from '@/api/syncDoctor';
import { useDoctorRun } from './useDoctorRun';

// ── Verdict symbols ───────────────────────────────────────────────────────────

const SYM: Record<StepVerdict, string> = {
  PASS: '✓',
  WARN: '⚠',
  FAIL: '✗',
};

// ── Styles (inline, using tf design tokens where possible) ───────────────────

const verdictColor: Record<StepVerdict, string> = {
  PASS: 'hsl(var(--tf-success, 145 60% 40%))',
  WARN: 'hsl(var(--tf-warn, 40 95% 55%))',
  FAIL: 'hsl(var(--tf-danger, 0 75% 50%))',
};

// ── Step card ────────────────────────────────────────────────────────────────

interface StepCardProps {
  step: DoctorStep;
}

function StepCard({ step }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const v = step.verdict;
  const color = v ? verdictColor[v] : 'hsl(var(--tf-muted, 215 14% 55%))';
  const sym = v ? SYM[v] : '—';

  return (
    <div
      data-testid={`step-card-${step.idx}`}
      style={{
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: '10px 14px',
        marginBottom: 8,
        background: 'hsl(var(--tf-surface, 220 20% 12%))',
      }}
    >
      <button
        data-testid={`step-card-${step.idx}-toggle`}
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
        <span style={{ fontWeight: 600 }}>
          #{step.idx} {step.name}
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

      {expanded && step.details.length > 0 && (
        <ul
          data-testid={`step-card-${step.idx}-details`}
          style={{
            marginTop: 8,
            paddingLeft: 24,
            listStyle: 'none',
            fontSize: '0.85rem',
            color: 'hsl(var(--tf-fg, 210 20% 85%))',
          }}
        >
          {step.details.map((d, i) => {
            const dc = d.sym ? verdictColor[d.sym] : 'inherit';
            return (
              <li key={i} style={{ marginBottom: 3, color: dc }}>
                {d.sym ? SYM[d.sym] + '  ' : '   '}
                {d.text}
              </li>
            );
          })}
        </ul>
      )}

      {expanded && step.details.length === 0 && (
        <p
          style={{
            marginTop: 8,
            fontSize: '0.85rem',
            color: 'hsl(var(--tf-muted, 215 14% 55%))',
          }}
        >
          No detail lines captured.
        </p>
      )}
    </div>
  );
}

// ── Result banner ─────────────────────────────────────────────────────────────

interface ResultBannerProps {
  parsed: ParsedDoctorOutput;
  exitCode: number;
  durationMs: number;
  timestamp: string;
}

function ResultBanner({ parsed, exitCode, durationMs, timestamp }: ResultBannerProps) {
  const overall = parsed.overall ?? (exitCode === 2 ? 'FAIL' : 'PASS');
  const color = verdictColor[overall] ?? verdictColor.FAIL;
  const dur =
    durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`;
  const ts = new Date(timestamp).toUTCString().replace(' GMT', ' UTC');

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 4,
        }}
      >
        <span
          data-testid='overall-sym'
          style={{ fontSize: '1.4em', color }}
        >
          {SYM[overall]}
        </span>
        <span
          data-testid='overall-verdict'
          style={{ fontSize: '1.1rem', fontWeight: 700, color }}
        >
          {overall}
          {overall === 'PASS' && ' — substrate clean'}
          {overall === 'WARN' && ' — safe to work, known deferred boundaries'}
          {overall === 'FAIL' && ' — do not drain'}
        </span>
      </div>

      {/* FAIL is a hard gate — no dismiss, no "proceed anyway" */}
      {overall === 'FAIL' && (
        <p
          data-testid='fail-gate-notice'
          style={{
            margin: '8px 0 4px',
            fontWeight: 600,
            color,
          }}
        >
          ⛔ DO NOT DRAIN until FAIL items are resolved. Diagnose the failing step before proceeding.
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
        {parsed.dbInfo && ` · DB: ${parsed.dbInfo}`}
      </p>
    </div>
  );
}

// ── Raw output toggle ─────────────────────────────────────────────────────────

interface RawOutputProps {
  stdout: string;
}

function RawOutputToggle({ stdout }: RawOutputProps) {
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

export function SyncDoctorPage() {
  const { run, isPending, isError, error, data, reset } = useDoctorRun();

  const parsed: ParsedDoctorOutput | null = data
    ? parseDoctorOutput(data.stdout)
    : null;

  const hasResult = data != null && !isPending;
  const isConflict = isError && error instanceof DoctorConflictError;

  return (
    <div
      data-testid='sync-doctor-page'
      style={{
        padding: '24px 28px',
        maxWidth: 860,
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
          Sync Doctor
        </h2>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '0.85rem',
            color: 'hsl(var(--tf-muted, 215 14% 55%))',
          }}
        >
          Substrate health check — runs 4 steps against the TerraFusion database.
          Run before any drain operation.
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
            ? 'Re-run Doctor'
            : 'Run Doctor'}
        </button>
      </div>

      {/* ── State: running ───────────────────────────────────────────────── */}
      {isPending && (
        <div data-testid='running-state'>
          <p style={{ color: 'hsl(var(--tf-muted, 215 14% 55%))', margin: '16px 0' }}>
            Doctor is running — this takes 10–60 seconds.
          </p>
        </div>
      )}

      {/* ── State: idle (no result yet) ───────────────────────────────────── */}
      {!isPending && !hasResult && !isError && (
        <p
          data-testid='idle-hint'
          style={{
            color: 'hsl(var(--tf-muted, 215 14% 55%))',
            fontSize: '0.9rem',
            margin: '16px 0',
          }}
        >
          Run the doctor to check substrate health before working.
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
          {error?.message ?? 'Doctor is already running — please wait.'}
        </div>
      )}

      {/* ── State: has result ─────────────────────────────────────────────── */}
      {hasResult && parsed && (
        <div data-testid='result-state'>
          <ResultBanner
            parsed={parsed}
            exitCode={data!.exitCode}
            durationMs={data!.durationMs}
            timestamp={data!.timestamp}
          />

          <div data-testid='step-cards'>
            {parsed.steps.length > 0 ? (
              parsed.steps.map(step => (
                <StepCard key={step.idx} step={step} />
              ))
            ) : (
              <p
                data-testid='no-steps-msg'
                style={{
                  color: 'hsl(var(--tf-muted, 215 14% 55%))',
                  fontSize: '0.9rem',
                }}
              >
                No step data found in output. Check raw output below for connection or psql errors.
              </p>
            )}
          </div>

          <RawOutputToggle stdout={data!.stdout} />
        </div>
      )}
    </div>
  );
}

export default SyncDoctorPage;
