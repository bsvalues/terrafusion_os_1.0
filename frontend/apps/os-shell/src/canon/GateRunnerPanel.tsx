/**
 * GateRunnerPanel — TerraCanon governance gate runner
 *
 * Replaces the inline task buttons with structured gate cards.
 * Each gate shows idle / running / pass / fail state with detail expansion.
 * "Run All" executes doctor → gatefast → ping sequentially.
 */
import React, { useCallback, useImperativeHandle, useState } from 'react';
import { runCanonDoctor, type CanonDoctorResponse } from '../api/canonDoctor';
import { runCanonGateFast, type CanonGateFastResponse } from '../api/canonGateFast';
import { runCanonPing, type CanonPingResponse } from '../api/canonPing';
import { invokeWithPreflight, type CanonInvokeResult } from './invokeWithPreflight';

// ── Types ────────────────────────────────────────────────────────────────────

type GateStatus = 'idle' | 'running' | 'pass' | 'fail';

interface GateState<T = unknown> {
  status: GateStatus;
  result: T | null;
  ranAt?: string;
}

const STATUS_ICON: Record<GateStatus, string> = {
  idle: '○',
  running: '◌',
  pass: '●',
  fail: '✕',
};

const STATUS_LABEL: Record<GateStatus, string> = {
  idle: 'Idle',
  running: 'Running…',
  pass: 'Pass',
  fail: 'Fail',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function gateStatusClass(status: GateStatus): string {
  return `gate-card gate-card--${status}`;
}

function errorText(result: { error?: string; stderr?: string; rawStdout?: string; rawStderr?: string } | null): string | null {
  if (!result) return null;
  return result.error || result.stderr || result.rawStderr || result.rawStdout || null;
}

// ── Component ────────────────────────────────────────────────────────────────

/** Imperative API exposed to parent (for command palette integration). */
export interface GateRunnerHandle {
  runDoctor: () => Promise<void>;
  runGateFast: () => Promise<void>;
  runPing: () => Promise<void>;
  runGoverned: () => Promise<void>;
  runAll: () => Promise<void>;
  readonly isRunning: boolean;
}

export const GateRunnerPanel = React.forwardRef<GateRunnerHandle>(function GateRunnerPanel(_props, ref) {
  // Gate states
  const [doctor, setDoctor] = useState<GateState<CanonDoctorResponse>>({ status: 'idle', result: null });
  const [gateFast, setGateFast] = useState<GateState<CanonGateFastResponse>>({ status: 'idle', result: null });
  const [ping, setPing] = useState<GateState<CanonPingResponse>>({ status: 'idle', result: null });
  const [governed, setGoverned] = useState<GateState<CanonInvokeResult>>({ status: 'idle', result: null });
  const [pingEcho, setPingEcho] = useState('hello');
  const [runAllActive, setRunAllActive] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  // ── Individual runners ──────────────────────────────────────

  const runDoctor = useCallback(async () => {
    setDoctor({ status: 'running', result: null });
    try {
      const res = await runCanonDoctor();
      setDoctor({ status: res.overallOk ? 'pass' : 'fail', result: res, ranAt: res.startedAt });
    } catch {
      setDoctor({ status: 'fail', result: null, ranAt: new Date().toISOString() });
    }
  }, []);

  const runGateFast = useCallback(async () => {
    setGateFast({ status: 'running', result: null });
    try {
      const res = await runCanonGateFast();
      setGateFast({ status: res.overallOk ? 'pass' : 'fail', result: res, ranAt: res.startedAt });
    } catch {
      setGateFast({ status: 'fail', result: null, ranAt: new Date().toISOString() });
    }
  }, []);

  const runPing = useCallback(async () => {
    setPing({ status: 'running', result: null });
    try {
      const res = await runCanonPing(pingEcho);
      setPing({ status: res.overallOk ? 'pass' : 'fail', result: res, ranAt: res.startedAt });
    } catch {
      setPing({ status: 'fail', result: null, ranAt: new Date().toISOString() });
    }
  }, [pingEcho]);

  const runGoverned = useCallback(async () => {
    setGoverned({ status: 'running', result: null });
    try {
      const outcome = await invokeWithPreflight({
        toolId: 'summarize_dossier',
        mode: 'muse',
        params: { dossierId: 'canon-workspace' },
      });
      setGoverned({
        status: outcome.status === 'ok' ? 'pass' : 'fail',
        result: outcome,
        ranAt: new Date().toISOString(),
      });
    } catch {
      setGoverned({ status: 'fail', result: null, ranAt: new Date().toISOString() });
    }
  }, []);

  // ── Run All (sequential: doctor → gatefast → ping) ─────────

  const runAll = useCallback(async () => {
    if (runAllActive) return;
    setRunAllActive(true);

    // Doctor
    setDoctor({ status: 'running', result: null });
    try {
      const doc = await runCanonDoctor();
      setDoctor({ status: doc.overallOk ? 'pass' : 'fail', result: doc, ranAt: doc.startedAt });
      if (!doc.overallOk) { setRunAllActive(false); return; }
    } catch {
      setDoctor({ status: 'fail', result: null, ranAt: new Date().toISOString() });
      setRunAllActive(false);
      return;
    }

    // GateFast
    setGateFast({ status: 'running', result: null });
    try {
      const gf = await runCanonGateFast();
      setGateFast({ status: gf.overallOk ? 'pass' : 'fail', result: gf, ranAt: gf.startedAt });
      if (!gf.overallOk) { setRunAllActive(false); return; }
    } catch {
      setGateFast({ status: 'fail', result: null, ranAt: new Date().toISOString() });
      setRunAllActive(false);
      return;
    }

    // Ping
    setPing({ status: 'running', result: null });
    try {
      const p = await runCanonPing(pingEcho);
      setPing({ status: p.overallOk ? 'pass' : 'fail', result: p, ranAt: p.startedAt });
    } catch {
      setPing({ status: 'fail', result: null, ranAt: new Date().toISOString() });
    }

    setRunAllActive(false);
  }, [runAllActive, pingEcho]);

  // ── Imperative handle for parent (command palette, etc.) ───

  useImperativeHandle(ref, () => ({
    runDoctor,
    runGateFast,
    runPing,
    runGoverned,
    runAll,
    get isRunning() { return runAllActive; },
  }), [runDoctor, runGateFast, runPing, runGoverned, runAll, runAllActive]);

  // ── Pipeline rollup ────────────────────────────────────────

  const gates = [doctor, gateFast, ping];
  const hasRun = gates.some((g) => g.status !== 'idle');
  const pipelineStatus: GateStatus = !hasRun
    ? 'idle'
    : gates.some((g) => g.status === 'running')
      ? 'running'
      : gates.every((g) => g.status === 'pass')
        ? 'pass'
        : gates.some((g) => g.status === 'fail')
          ? 'fail'
          : 'idle';

  return (
    <section className='gate-runner' data-testid='terracanon-safety-dashboard'>
      {/* ── Header / Run All ───────────────────────────────────── */}
      <div className='gate-runner__header'>
        <span className='gate-runner__title'>Gates</span>
        <span className={`gate-runner__pipeline gate-runner__pipeline--${pipelineStatus}`} data-testid='terracanon-run-all-rollup'>
          {STATUS_ICON[pipelineStatus]} Pipeline {STATUS_LABEL[pipelineStatus]}
        </span>
        <button
          className='gate-runner__run-all'
          data-testid='terracanon-run-all'
          onClick={runAll}
          disabled={runAllActive}
        >
          {runAllActive ? '⟳ Running…' : '▶ Run All'}
        </button>
      </div>

      {/* ── Gate Cards ─────────────────────────────────────────── */}
      <div className='gate-runner__grid'>
        {/* Doctor */}
        <div className={gateStatusClass(doctor.status)} data-testid='terracanon-run-canon-doctor'>
          <div className='gate-card__head' onClick={() => toggle('doctor')}>
            <span className='gate-card__icon'>{STATUS_ICON[doctor.status]}</span>
            <span className='gate-card__label'>Doctor</span>
            <span className='gate-card__status'>{STATUS_LABEL[doctor.status]}</span>
            {doctor.ranAt && <span className='gate-card__ts'>{doctor.ranAt}</span>}
            <button
              className='gate-card__trigger'
              data-testid='terracanon-run-canon-doctor'
              onClick={(e) => { e.stopPropagation(); runDoctor(); }}
              disabled={doctor.status === 'running' || runAllActive}
            >
              Run
            </button>
          </div>
          {expanded === 'doctor' && doctor.result && (
            <div className='gate-card__detail' data-testid='terracanon-canon-doctor-result'>
              <div data-testid='terracanon-canon-doctor-status'>
                Doctor: {doctor.result.overallOk ? 'PASS' : 'FAIL'}
              </div>
              <div data-testid='terracanon-canon-doctor-started'>
                startedAt: {doctor.result.startedAt}
              </div>
              {errorText(doctor.result) && (
                <pre className='gate-card__error' data-testid='terracanon-canon-doctor-error'>
                  {errorText(doctor.result)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* GateFast */}
        <div className={gateStatusClass(gateFast.status)} data-testid='terracanon-run-canon-gatefast'>
          <div className='gate-card__head' onClick={() => toggle('gatefast')}>
            <span className='gate-card__icon'>{STATUS_ICON[gateFast.status]}</span>
            <span className='gate-card__label'>GateFast</span>
            <span className='gate-card__status'>{STATUS_LABEL[gateFast.status]}</span>
            {gateFast.ranAt && <span className='gate-card__ts'>{gateFast.ranAt}</span>}
            <button
              className='gate-card__trigger'
              data-testid='terracanon-run-canon-gatefast'
              onClick={(e) => { e.stopPropagation(); runGateFast(); }}
              disabled={gateFast.status === 'running' || runAllActive}
            >
              Run
            </button>
          </div>
          {expanded === 'gatefast' && gateFast.result && (
            <div className='gate-card__detail' data-testid='terracanon-canon-gatefast-result'>
              <div data-testid='terracanon-canon-gatefast-status'>
                GateFast: {gateFast.result.overallOk ? 'PASS' : 'FAIL'}
              </div>
              <div data-testid='terracanon-canon-gatefast-started'>
                startedAt: {gateFast.result.startedAt}
              </div>
              {errorText(gateFast.result) && (
                <pre className='gate-card__error' data-testid='terracanon-canon-gatefast-error'>
                  {errorText(gateFast.result)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Ping */}
        <div className={gateStatusClass(ping.status)} data-testid='terracanon-run-canon-ping'>
          <div className='gate-card__head' onClick={() => toggle('ping')}>
            <span className='gate-card__icon'>{STATUS_ICON[ping.status]}</span>
            <span className='gate-card__label'>Ping</span>
            <span className='gate-card__status'>{STATUS_LABEL[ping.status]}</span>
            {ping.ranAt && <span className='gate-card__ts'>{ping.ranAt}</span>}
            <input
              className='gate-card__input'
              data-testid='terracanon-canon-ping-echo'
              value={pingEcho}
              onChange={(e) => setPingEcho(e.target.value)}
              placeholder='Echo'
              disabled={runAllActive}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className='gate-card__trigger'
              data-testid='terracanon-run-canon-ping'
              onClick={(e) => { e.stopPropagation(); runPing(); }}
              disabled={ping.status === 'running' || runAllActive}
            >
              Run
            </button>
          </div>
          {expanded === 'ping' && ping.result && (
            <div className='gate-card__detail' data-testid='terracanon-canon-ping-result'>
              {ping.result.overallOk && ping.result.normalized ? (
                <>
                  <div data-testid='terracanon-canon-ping-ok'>ok: {String(ping.result.normalized.ok)}</div>
                  <div data-testid='terracanon-canon-ping-ts'>ts: {ping.result.normalized.ts}</div>
                  <div data-testid='terracanon-canon-ping-echo-value'>echo: {ping.result.normalized.echo}</div>
                  <div data-testid='terracanon-canon-ping-tool-id'>toolId: {ping.result.normalized.toolId}</div>
                  <div data-testid='terracanon-canon-ping-input-count'>inputCount: {ping.result.normalized.inputCount}</div>
                </>
              ) : (
                <pre className='gate-card__error' data-testid='terracanon-canon-ping-error'>
                  {errorText(ping.result) || 'canon ping failed'}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Governed Command */}
        <div className={gateStatusClass(governed.status)} data-testid='terracanon-run-governed-command'>
          <div className='gate-card__head' onClick={() => toggle('governed')}>
            <span className='gate-card__icon'>{STATUS_ICON[governed.status]}</span>
            <span className='gate-card__label'>Governed Cmd</span>
            <span className='gate-card__status'>{STATUS_LABEL[governed.status]}</span>
            {governed.ranAt && <span className='gate-card__ts'>{governed.ranAt}</span>}
            <button
              className='gate-card__trigger'
              data-testid='terracanon-run-governed-command'
              onClick={(e) => { e.stopPropagation(); runGoverned(); }}
              disabled={governed.status === 'running' || runAllActive}
            >
              Run
            </button>
          </div>
          {expanded === 'governed' && governed.result && (
            <div className='gate-card__detail' data-testid='terracanon-command-result'>
              <div data-testid='terracanon-command-correlation'>
                {governed.result.correlationId}
              </div>
              {governed.result.status === 'denied' && (
                <div data-testid='terracanon-command-deny-reason'>{governed.result.reason}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
