/**
 * ═══════════════════════════════════════════════════════════════
 * SYNC-COMPLETE-2: DRAIN LANE PANEL
 *
 * Operator-facing controls for the six lane-drain endpoints:
 *   POST /api/sync/doctrine/drain/{parcel|owner-wsdor|improvement|
 *                                  land|sales|geometry}
 *
 * Pattern: each lane is a row with its own "Drain" button + result
 * card. A shared config bar at top sets OperatorName / FullCorpus /
 * TopN once for the session.
 *
 * Long-running caveat: the backend endpoints are synchronous; full-
 * corpus runs can exceed browser fetch timeouts. The panel defaults
 * to FullCorpus=OFF with TopN=200 (a safe sample size) so the UI
 * stays responsive. For multi-hour drains the operator still uses
 * curl with -m 21600 per the SYNC-COMPLETE-1 runbook.
 *
 * Spec discipline (matches SyncDoctrineConsole):
 *   - tf-* utility classes only
 *   - tf-status-success / -warning / -error / -info for verdicts
 *   - tabular-nums for counts
 *   - one screen, no modals
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  postDoctrineDrain,
  type DoctrineDrainRequest,
  type DoctrineDrainResponse,
  type DrainLaneName,
} from '@/api/syncDoctrine';

interface LaneSpec {
  key: DrainLaneName;
  label: string;
  blurb: string;
  /** Wall-clock estimate from the SYNC-COMPLETE-1 runbook. */
  fullCorpusEta: string;
}

const LANE_SPECS: ReadonlyArray<LaneSpec> = [
  {
    key: 'parcel',
    label: 'Parcel',
    blurb: 'property landing → parcel spine truth → tf_parcel canonical',
    fullCorpusEta: '~5 min',
  },
  {
    key: 'owner-wsdor',
    label: 'Owner + WSDOR',
    blurb: 'owner+account+supp+WPOV → tf_owner / link / tf_assessment_wsdor',
    fullCorpusEta: '~90 min',
  },
  {
    key: 'improvement',
    label: 'Improvement',
    blurb: 'imprv+detail+attr → tf_improvement / tf_improvement_feature',
    fullCorpusEta: '~45 min',
  },
  {
    key: 'land',
    label: 'Land',
    blurb: 'land_detail → land truth → tf_land canonical',
    fullCorpusEta: '~15 min',
  },
  {
    key: 'sales',
    label: 'Sales',
    blurb: 'independent DESC seed → sale truth → tf_sale (qualified subset)',
    fullCorpusEta: '~15 min',
  },
  {
    key: 'geometry',
    label: 'Geometry',
    blurb: 'ArcGIS REST → tf_parcel_geom + APN crosswalk',
    fullCorpusEta: '~5 min',
  },
];

type LaneRunState =
  | { kind: 'idle' }
  | { kind: 'running'; startedAt: number; abort: AbortController }
  | { kind: 'done'; response: DoctrineDrainResponse; finishedAt: number }
  | { kind: 'error'; message: string; finishedAt: number };

type LaneRuns = Partial<Record<DrainLaneName, LaneRunState>>;

const DEFAULT_TOPN = 200;
const DEFAULT_OPERATOR = 'doctrine-drain';

export default function DrainLanePanel(): React.ReactElement {
  const [operatorName, setOperatorName] = useState<string>(DEFAULT_OPERATOR);
  const [fullCorpus, setFullCorpus] = useState<boolean>(false);
  const [topN, setTopN] = useState<number>(DEFAULT_TOPN);
  const [workingYear, setWorkingYear] = useState<number>(2026);

  const [runs, setRuns] = useState<LaneRuns>({});

  // Tick every second so "elapsed" labels update for running lanes
  // without each lane row having its own timer.
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const tickRef = useRef<number | null>(null);
  React.useEffect(() => {
    tickRef.current = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, []);

  const buildRequest = useCallback(
    (): DoctrineDrainRequest => ({
      operatorName: operatorName.trim() || DEFAULT_OPERATOR,
      workingYear,
      fullCorpus,
      topN: fullCorpus ? null : topN,
    }),
    [operatorName, fullCorpus, topN, workingYear],
  );

  const drainOne = useCallback(
    async (lane: DrainLaneName): Promise<void> => {
      // Abort any prior in-flight run for this lane (defensive — the
      // button is also disabled while running).
      const prior = runs[lane];
      if (prior?.kind === 'running') prior.abort.abort();

      const abort = new AbortController();
      const startedAt = Date.now();
      setRuns((r) => ({ ...r, [lane]: { kind: 'running', startedAt, abort } }));

      try {
        const response = await postDoctrineDrain(lane, buildRequest(), abort.signal);
        setRuns((r) => ({
          ...r,
          [lane]: { kind: 'done', response, finishedAt: Date.now() },
        }));
      } catch (e) {
        const message =
          e instanceof DOMException && e.name === 'AbortError'
            ? 'cancelled by operator'
            : e instanceof Error
              ? `${e.name}: ${e.message}`
              : 'unknown error';
        setRuns((r) => ({
          ...r,
          [lane]: { kind: 'error', message, finishedAt: Date.now() },
        }));
      }
    },
    [buildRequest, runs],
  );

  const cancelOne = useCallback(
    (lane: DrainLaneName): void => {
      const cur = runs[lane];
      if (cur?.kind === 'running') cur.abort.abort();
    },
    [runs],
  );

  const anyRunning = useMemo(
    () => Object.values(runs).some((r) => r?.kind === 'running'),
    [runs],
  );

  return (
    <section
      className='tf-panel p-4 mt-4'
      aria-label='Doctrine drain lanes'
      data-testid='drain-lane-panel'
    >
      <header className='mb-3'>
        <h3 className='tf-text font-medium' style={{ fontSize: '0.95rem' }}>
          Drain by lane
        </h3>
        <p className='tf-text-secondary' style={{ fontSize: '0.8rem', marginTop: 4 }}>
          Single-lane drains are the safe operator pattern for full-corpus work.
          Each lane runs synchronously; long lanes still belong on{' '}
          <code>curl -m 21600</code>. Recommended order:{' '}
          parcel → owner-wsdor → improvement → land → sales → geometry.
        </p>
      </header>

      <ConfigBar
        operatorName={operatorName}
        setOperatorName={setOperatorName}
        fullCorpus={fullCorpus}
        setFullCorpus={setFullCorpus}
        topN={topN}
        setTopN={setTopN}
        workingYear={workingYear}
        setWorkingYear={setWorkingYear}
        anyRunning={anyRunning}
      />

      <div className='mt-3' style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LANE_SPECS.map((spec) => (
          <LaneRow
            key={spec.key}
            spec={spec}
            run={runs[spec.key] ?? { kind: 'idle' }}
            nowMs={nowMs}
            onDrain={() => void drainOne(spec.key)}
            onCancel={() => cancelOne(spec.key)}
            disabled={false /* allow concurrent lanes; backend writes are isolated by batch */}
          />
        ))}
      </div>
    </section>
  );
}

function ConfigBar({
  operatorName,
  setOperatorName,
  fullCorpus,
  setFullCorpus,
  topN,
  setTopN,
  workingYear,
  setWorkingYear,
  anyRunning,
}: {
  operatorName: string;
  setOperatorName: (v: string) => void;
  fullCorpus: boolean;
  setFullCorpus: (v: boolean) => void;
  topN: number;
  setTopN: (v: number) => void;
  workingYear: number;
  setWorkingYear: (v: number) => void;
  anyRunning: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        padding: '8px 0',
        borderTop: '1px solid var(--tf-border)',
        borderBottom: '1px solid var(--tf-border)',
      }}
    >
      <label style={{ fontSize: '0.8rem' }} className='tf-text-secondary'>
        Operator
        <input
          type='text'
          value={operatorName}
          onChange={(e) => setOperatorName(e.target.value)}
          disabled={anyRunning}
          className='tf-text'
          style={{
            display: 'block',
            width: '100%',
            marginTop: 2,
            padding: '4px 6px',
            background: 'transparent',
            border: '1px solid var(--tf-border)',
            borderRadius: 3,
            fontSize: '0.85rem',
          }}
          data-testid='drain-operator-input'
        />
      </label>

      <label style={{ fontSize: '0.8rem' }} className='tf-text-secondary'>
        Working year
        <input
          type='number'
          value={workingYear}
          onChange={(e) => setWorkingYear(Number(e.target.value) || 2026)}
          disabled={anyRunning}
          min={2018}
          max={2099}
          className='tf-text'
          style={{
            display: 'block',
            width: '100%',
            marginTop: 2,
            padding: '4px 6px',
            background: 'transparent',
            border: '1px solid var(--tf-border)',
            borderRadius: 3,
            fontSize: '0.85rem',
          }}
        />
      </label>

      <label style={{ fontSize: '0.8rem' }} className='tf-text-secondary'>
        TopN (sample)
        <input
          type='number'
          value={topN}
          onChange={(e) => setTopN(Math.max(1, Number(e.target.value) || DEFAULT_TOPN))}
          disabled={fullCorpus || anyRunning}
          min={1}
          className='tf-text'
          style={{
            display: 'block',
            width: '100%',
            marginTop: 2,
            padding: '4px 6px',
            background: 'transparent',
            border: '1px solid var(--tf-border)',
            borderRadius: 3,
            fontSize: '0.85rem',
            opacity: fullCorpus ? 0.5 : 1,
          }}
          data-testid='drain-topn-input'
        />
      </label>

      <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <input
          type='checkbox'
          checked={fullCorpus}
          onChange={(e) => setFullCorpus(e.target.checked)}
          disabled={anyRunning}
          data-testid='drain-fullcorpus-toggle'
        />
        <span className={fullCorpus ? 'tf-status-warning' : 'tf-text-secondary'}
              style={{ padding: fullCorpus ? '2px 6px' : 0, borderRadius: 3 }}>
          Full corpus (long-running)
        </span>
      </label>
    </div>
  );
}

function LaneRow({
  spec,
  run,
  nowMs,
  onDrain,
  onCancel,
  disabled,
}: {
  spec: LaneSpec;
  run: LaneRunState;
  nowMs: number;
  onDrain: () => void;
  onCancel: () => void;
  disabled: boolean;
}): React.ReactElement {
  const running = run.kind === 'running';
  return (
    <div
      data-testid={`drain-lane-row-${spec.key}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 180px) 1fr minmax(110px, 130px)',
        gap: 12,
        alignItems: 'start',
        padding: '8px 0',
        borderBottom: '1px solid var(--tf-border)',
      }}
    >
      <div>
        <div className='tf-text font-medium' style={{ fontSize: '0.9rem' }}>
          {spec.label}
        </div>
        <div className='tf-text-secondary' style={{ fontSize: '0.75rem' }}>
          full corpus {spec.fullCorpusEta}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div className='tf-text-secondary' style={{ fontSize: '0.78rem' }}>
          {spec.blurb}
        </div>
        <LaneRunDisplay run={run} nowMs={nowMs} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          type='button'
          onClick={onDrain}
          disabled={running || disabled}
          className={running ? 'tf-status-info' : 'tf-status-success'}
          style={{
            padding: '6px 10px',
            borderRadius: 3,
            fontSize: '0.8rem',
            fontWeight: 600,
            opacity: running || disabled ? 0.6 : 1,
            cursor: running || disabled ? 'not-allowed' : 'pointer',
          }}
          data-testid={`drain-lane-button-${spec.key}`}
        >
          {running ? 'Running…' : 'Drain'}
        </button>
        {running && (
          <button
            type='button'
            onClick={onCancel}
            className='tf-status-warning'
            style={{
              padding: '4px 8px',
              borderRadius: 3,
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
            data-testid={`drain-lane-cancel-${spec.key}`}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function LaneRunDisplay({
  run,
  nowMs,
}: {
  run: LaneRunState;
  nowMs: number;
}): React.ReactElement | null {
  if (run.kind === 'idle') return null;

  if (run.kind === 'running') {
    const elapsedSec = Math.max(0, Math.round((nowMs - run.startedAt) / 1000));
    return (
      <div className='tf-status-info' style={{ marginTop: 6, padding: '4px 6px', borderRadius: 3, fontSize: '0.78rem' }}>
        running · elapsed {formatDuration(elapsedSec)}
      </div>
    );
  }

  if (run.kind === 'error') {
    return (
      <div className='tf-status-error' style={{ marginTop: 6, padding: '4px 6px', borderRadius: 3, fontSize: '0.78rem' }}>
        client error · {run.message}
      </div>
    );
  }

  // run.kind === 'done'
  const r = run.response;
  const ok = r.status === 'Succeeded';
  const cls = ok ? 'tf-status-success' : 'tf-status-error';
  return (
    <div style={{ marginTop: 6, fontSize: '0.78rem' }}>
      <div className={cls} style={{ padding: '4px 6px', borderRadius: 3, display: 'inline-block' }}>
        {ok ? 'Succeeded' : `Failed @ ${r.failedStage ?? 'unknown'}`}
        {' · '}
        {formatDuration(Math.round(r.durationSec))}
      </div>
      {!ok && r.error && (
        <div className='tf-text-secondary' style={{ marginTop: 4, fontFamily: 'monospace' }}>
          {r.error}
        </div>
      )}
      <div
        className='tf-text-secondary'
        style={{
          marginTop: 4,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 6,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span>landed: <strong className='tf-text'>{r.counts.rowsLanded.toLocaleString()}</strong></span>
        <span>truth: <strong className='tf-text'>{r.counts.rowsPromotedToTruth.toLocaleString()}</strong></span>
        <span>canonical: <strong className='tf-text'>{r.counts.rowsCanonicalized.toLocaleString()}</strong></span>
        <span>
          quarantine Δ:{' '}
          <strong
            className={r.quarantineDelta.delta > 0 ? 'tf-status-warning' : 'tf-text'}
            style={{ padding: r.quarantineDelta.delta > 0 ? '0 4px' : 0, borderRadius: 3 }}
          >
            {r.quarantineDelta.delta >= 0 ? `+${r.quarantineDelta.delta}` : r.quarantineDelta.delta}
          </strong>
        </span>
      </div>
      <GateSummaryInline gateSummary={r.gateSummary} />
      {r.nextRecommendedLane && ok && (
        <div className='tf-text-secondary' style={{ marginTop: 4 }}>
          next recommended: <code className='tf-text'>{r.nextRecommendedLane}</code>
        </div>
      )}
      <div className='tf-text-secondary' style={{ marginTop: 4 }}>
        batches: {r.batchIds.length}{' '}
        {r.batchIds.length > 0 && (
          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
            ({r.batchIds[0]?.slice(0, 8) ?? '–'}…)
          </span>
        )}
      </div>
    </div>
  );
}

function GateSummaryInline({
  gateSummary,
}: {
  gateSummary: DoctrineDrainResponse['gateSummary'];
}): React.ReactElement | null {
  if (!gateSummary?.totals?.length) return null;
  const totalsByStatus = Object.fromEntries(
    gateSummary.totals.map((t) => [t.status, t.count]),
  );
  const pass = totalsByStatus.PASS ?? 0;
  const warn = totalsByStatus.WARN ?? 0;
  const fail = totalsByStatus.FAIL ?? 0;
  return (
    <div style={{ marginTop: 4, fontSize: '0.78rem' }}>
      <span className='tf-text-secondary'>gates: </span>
      <span className='tf-status-success' style={{ padding: '0 4px', borderRadius: 3 }}>PASS {pass}</span>
      {' '}
      <span className={warn > 0 ? 'tf-status-warning' : 'tf-text-secondary'} style={{ padding: '0 4px', borderRadius: 3 }}>WARN {warn}</span>
      {' '}
      <span className={fail > 0 ? 'tf-status-error' : 'tf-text-secondary'} style={{ padding: '0 4px', borderRadius: 3 }}>FAIL {fail}</span>
    </div>
  );
}

function formatDuration(totalSec: number): string {
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return `${m}m ${s.toString().padStart(2, '0')}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm.toString().padStart(2, '0')}m`;
}
