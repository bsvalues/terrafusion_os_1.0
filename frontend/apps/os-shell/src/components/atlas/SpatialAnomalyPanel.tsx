import { useEffect, useRef, useState } from 'react';
import { invokeTool } from '../../api/pilotApi';
import { useAuthContextOptional } from '../../auth/useAuthContext';

type Scope = { countyId: string; taxYear: number; geography: { kind: string; id: string }; metric: string };
type Judgment = {
  status: string; reason: string; request: Scope;
  sample: { total: number; used: number; excluded: number }; hotspotCount: number;
  severity: string | null; quality: { state: string; unclusteredCount: number; excludedCount: number };
  confidence: { kind: string; value: number } | null;
  finding: { type: string; clusters: { clusterId: string; sampleSize: number; supportCount: number; direction: string }[] } | null;
  affectedParcelIds: string[]; affectedObservationIds: string[]; actionCategory: string;
  policy: { id: string; interpretation: string; minimumFitSample: number; minimumClusterSample: number;
    absolutePercentResidual: number; minimumSupportNumerator: number; minimumSupportDenominator: number };
  sourceRefs: unknown[];
  canonicalProvenance: { sourceCommit: string; moduleSha256: string; specificationSha256: string };
  sourceEvidence: { endpoint: string; requestQuery: string; responseSha256: string; responseBody: string };
};
type View = { busy?: boolean; judgment?: Judgment; error?: string; cid?: string };
const inputClass = 'tf-input w-full rounded-md border px-3 py-2 text-sm';
const count = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const digest = (s: unknown) => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s);

// Presentation guard only. All spatial decisions and advisory policy come from the canonical suite.
function readJudgment(output: unknown, scope: Scope): Judgment {
  const value = typeof output === 'string' ? JSON.parse(output) : output;
  const j = value as Judgment & { contract?: string; version?: string };
  if (!j || j.contract !== 'atlas.spatial-anomaly' || j.version !== '1.0.0' ||
      !['OK', 'INSUFFICIENT_DATA', 'UNAVAILABLE'].includes(j.status) || typeof j.reason !== 'string' ||
      j.request?.countyId !== scope.countyId || j.request?.taxYear !== scope.taxYear ||
      j.request?.metric !== scope.metric || j.request?.geography?.kind !== scope.geography.kind ||
      j.request?.geography?.id !== scope.geography.id ||
      !count(j.sample?.total) || !count(j.sample?.used) || !count(j.sample?.excluded) || !count(j.hotspotCount) ||
      typeof j.quality?.state !== 'string' || typeof j.actionCategory !== 'string' ||
      !Array.isArray(j.affectedParcelIds) || !j.affectedParcelIds.every(p => typeof p === 'string') ||
      !Array.isArray(j.affectedObservationIds) || !Array.isArray(j.sourceRefs) ||
      (j.confidence !== null && (j.confidence?.kind !== 'EVIDENCE_SUPPORT_FRACTION' ||
        !Number.isFinite(j.confidence.value) || j.confidence.value < 0 || j.confidence.value > 1)) ||
      (j.status === 'OK' ? !j.finding || !Array.isArray(j.finding.clusters) ||
        !j.finding.clusters.every(c => typeof c.clusterId === 'string' && count(c.sampleSize) && count(c.supportCount) && typeof c.direction === 'string') :
        j.finding !== null || j.hotspotCount !== 0 || j.confidence !== null) ||
      typeof j.policy?.id !== 'string' || j.policy.interpretation !== 'TERRAFUSION_ADVISORY_NOT_STATISTICAL' ||
      !/^[a-f0-9]{40}$/.test(j.canonicalProvenance?.sourceCommit ?? '') ||
      !digest(j.canonicalProvenance?.moduleSha256) || !digest(j.canonicalProvenance?.specificationSha256) ||
      j.sourceEvidence?.endpoint !== '/api/terraforge/regression' || !digest(j.sourceEvidence?.responseSha256) ||
      typeof j.sourceEvidence?.responseBody !== 'string' || typeof j.sourceEvidence?.requestQuery !== 'string')
    throw new Error('Spatial response is invalid or does not match the selected scope.');
  return j;
}

export function SpatialAnomalyPanel({ parcelId }: { parcelId?: string }) {
  const auth = useAuthContextOptional();
  const identity = useRef({ token: auth?.token, userId: auth?.userId, countyId: auth?.countyId, generation: 0 });
  if (identity.current.token !== auth?.token || identity.current.userId !== auth?.userId || identity.current.countyId !== auth?.countyId) {
    identity.current = { token: auth?.token, userId: auth?.userId, countyId: auth?.countyId, generation: identity.current.generation + 1 };
  }
  if (!auth?.isAuthenticated || !auth.countyId)
    return <p role='status'>Select an authenticated county to review spatial observations.</p>;
  // Remount on identity/parcel changes: no result or pending response crosses an authorization scope.
  return <ScopedPanel key={`${identity.current.generation}:${parcelId ?? ''}`}
    countyId={auth.countyId} parcelId={parcelId} />;
}

function ScopedPanel({ countyId, parcelId }: { countyId: string; parcelId?: string }) {
  const [year, setYear] = useState('');
  const [kind, setKind] = useState(parcelId ? 'neighborhood' : 'county');
  const [neighborhood, setNeighborhood] = useState('');
  const [view, setView] = useState<View>({});
  const revision = useRef(0);
  useEffect(() => () => { revision.current += 1; }, []);
  const clear = () => { revision.current += 1; setView({}); };
  const valid = /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= 2200 &&
    (kind === 'county' || (neighborhood.trim() === neighborhood && neighborhood.length > 0 && neighborhood.length <= 256));

  async function run() {
    if (!valid || view.busy) return;
    const sequence = ++revision.current;
    const scope = { countyId, taxYear: Number(year), geography: { kind, id: kind === 'county' ? countyId : neighborhood }, metric: 'residual_cluster' };
    setView({ busy: true });
    let cid: string | undefined;
    try {
      const response = await invokeTool({ toolId: 'explain_spatial_anomaly', ...(parcelId ? { parcelId } : {}),
        params: { county: countyId, taxYear: scope.taxYear, geographyType: kind, geographyId: scope.geography.id, metric: scope.metric } });
      if (sequence !== revision.current) return;
      cid = response.correlationId;
      if (!response.success) throw new Error(response.error?.message || 'Spatial observation source unavailable.');
      const judgment = readJudgment(response.result?.output, scope);
      setView({ judgment, cid });
    } catch (error) {
      if (sequence !== revision.current) return;
      setView({ error: error instanceof Error ? error.message : 'Spatial review failed.', cid: cid || `net-${crypto.randomUUID()}` });
    }
  }

  const j = view.judgment;
  return <section data-testid='atlas-spatial-anomaly-panel' className='space-y-4 text-sm tf-text'>
    <header>
      <h3 className='font-semibold'>Spatial anomaly review</h3>
      <p className='tf-text-secondary mt-1'>Review existing regression residuals. Map previews are not source evidence.</p>
    </header>
    <div className='break-all'><span className='tf-text-tertiary'>Authenticated county: </span><span>{countyId}</span></div>
    {parcelId && <p className='tf-text-secondary'>Parcel {parcelId}: choose a neighborhood explicitly; membership is not inferred from the map.</p>}
    <div className='grid gap-3 sm:grid-cols-2'>
      <label>Assessment year<input aria-label='Assessment year' inputMode='numeric' value={year} maxLength={4}
        onChange={event => { clear(); setYear(event.target.value); }} className={inputClass} /></label>
      <label>Geography<select aria-label='Geography' value={kind} disabled={Boolean(parcelId)}
        onChange={event => { clear(); setKind(event.target.value); }} className={inputClass}>
        <option value='county'>County</option><option value='neighborhood'>Neighborhood</option>
      </select></label>
      {kind === 'neighborhood' && <label>Neighborhood ID<input aria-label='Neighborhood ID' value={neighborhood} maxLength={256}
        onChange={event => { clear(); setNeighborhood(event.target.value); }} className={inputClass} /></label>}
      <label>Metric<select aria-label='Metric' value='residual_cluster' onChange={() => {}} className={inputClass}>
        <option value='residual_cluster'>Residual cluster</option>
        <option value='prd' disabled>PRD — unavailable</option><option value='prb' disabled>PRB — unavailable</option>
        <option value='cod' disabled>COD — unavailable</option>
      </select></label>
    </div>
    <button type='button' onClick={run} disabled={!valid || view.busy}
      className='tf-suite-atlas-cta rounded-md px-4 py-2 font-semibold disabled:opacity-50'>
      {view.busy ? 'Reading source…' : 'Run spatial review'}
    </button>
    {view.busy && <p role='status'>Reading authorized source observations…</p>}
    {view.error && <p role='alert' className='tf-text-secondary'>{view.error}</p>}
    {j && <div data-testid='atlas-spatial-anomaly-result' className='space-y-3 border-t pt-3' style={{ borderColor: 'hsl(var(--tf-border))' }}>
      <div role='status'><strong>{j.status}</strong><p>{j.reason}</p></div>
      <p>{j.request.geography.kind}: {j.request.geography.id} · Assessment year {j.request.taxYear} · {j.request.metric}</p>
      <p>{j.sample.used} observations / {j.sample.total} source rows; {j.sample.excluded} excluded. {j.hotspotCount} hotspots.</p>
      <p>Quality: {j.quality.state}; {j.quality.unclusteredCount} observations without neighborhood membership.</p>
      <p>Severity: {j.severity ?? 'None'} · Action: {j.actionCategory}</p>
      {j.confidence && <p>Evidence support: {(j.confidence.value * 100).toFixed(1)}% — not a probability or statistical significance.</p>}
      {j.finding?.clusters.map(c => <p key={`${c.clusterId}:${c.direction}`}>
        {c.clusterId}: {c.supportCount} of {c.sampleSize} distinct parcels support a {c.direction} residual cluster.
      </p>)}
      {j.affectedParcelIds.length > 0 && <p className='break-all'>Affected parcel IDs: {j.affectedParcelIds.join(', ')}</p>}
      <p className='tf-text-secondary'>TerraFusion advisory policy {j.policy.id}; not statutory compliance.
        {' '}Minimum fit {j.policy.minimumFitSample}, cluster {j.policy.minimumClusterSample}, absolute residual {j.policy.absolutePercentResidual}%,
        {' '}support {j.policy.minimumSupportNumerator}/{j.policy.minimumSupportDenominator}.</p>
      <details className='space-y-2'>
        <summary className='cursor-pointer font-semibold'>Inspect source observations</summary>
        <p>{j.sourceEvidence.endpoint}?{j.sourceEvidence.requestQuery}</p>
        <p className='break-all'>Source response SHA-256: {j.sourceEvidence.responseSha256}</p>
        <p className='break-all'>Canonical suite commit: {j.canonicalProvenance.sourceCommit}</p>
        <p className='break-all'>Module SHA-256: {j.canonicalProvenance.moduleSha256}</p>
        <p className='break-all'>Specification SHA-256: {j.canonicalProvenance.specificationSha256}</p>
        <pre className='max-h-80 overflow-auto whitespace-pre-wrap break-all'>{j.sourceEvidence.responseBody}</pre>
        <pre className='max-h-48 overflow-auto whitespace-pre-wrap break-all'>{JSON.stringify(j.sourceRefs, null, 2)}</pre>
      </details>
    </div>}
    {view.cid && <div className='break-all text-xs'>Correlation ID: <code>{view.cid}</code></div>}
  </section>;
}
