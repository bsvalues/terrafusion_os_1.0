/**
 * TerraFusion OS — TerraForge Suite Home
 *
 * TerraForge launcher posture is governed by the June 10 canonical inventory
 * in terraforgeCanonicalInventory.ts. /forge is the TerraForge Suite surface;
 * parcel-scoped Workbench Forge views are support only and are not counted as
 * suite proof here.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getToken, setToken as persistToken } from '../../auth/authStorage';
import { invokeTool } from '../../api/pilotApi';
import { getSession } from '../../auth/session';
import { useCountyStats } from '../../hooks/useCountyStats';
import { apiFetch } from '../../lib/apiBase';
import { activateModule } from '../../orchestration/moduleActivation';
import { buildCountyScopedSessionHeaders } from '../../services/countyIsolation';
import {
  parseWashingtonCountiesHubHandoff,
  type WashingtonCountiesHubHandoff,
} from '../forge/sales/washingtonSalesReviewCapability';
import { SaleQualificationQueue } from './SaleQualificationQueue';
import { CompsPoolBrowser } from './CompsPoolBrowser';
import {
  TERRAFORGE_CANONICAL_INVENTORY,
  type TerraForgeCanonicalCapability,
} from './terraforgeCanonicalInventory';
import './ForgeSuiteHome.css';

type TruthState = 'live' | 'queued';

const JUNE_10_PROOF_FREEZE = true;
const JUNE_10_RUNTIME_PANELS_ENABLED = true;
const JUNE_10_COMMAND_ACTIONS_ENABLED = true;
const JUNE_10_FORGE_NOTICE =
  'TerraForge is part of the Benton operating model. App-backed suite metrics read proven TerraFusion API paths; countywide KPI rollups and unverified standalone Forge modules stay preview-locked until separately verified.';
const JUNE_10_FORGE_ACTION_LOCK_NOTICE =
  'Unverified TerraForge suite action locked for June 10 proof freeze.';

type ForgeModuleDef = TerraForgeCanonicalCapability & { truthState?: TruthState };

interface CountyFindingSummary {
  findingType: string;
  severity: string;
  recommendedAction: string;
  correlationId: string;
}

interface MorningBriefSummary {
  role: string;
  queueType: string;
  priority: string;
  dueWindow: string;
  recommendedTool: string;
  readyToAct: boolean;
  blockingDependencies: string[];
  findings: CountyFindingSummary[];
}

interface MorningBriefToolOutput extends Partial<MorningBriefSummary> {
  brief?: Omit<MorningBriefSummary, 'findings'>;
  findings?: CountyFindingSummary[];
}

interface CountyImpactPreview {
  prdBefore: number;
  prdAfter: number;
  codBefore: number;
  codAfter: number;
  avDelta: number;
  fairnessDelta: number;
}

interface CountyDiagnosticsSummary {
  metrics: CountyImpactPreview;
  readyForSignoff: boolean;
  narrative: string;
}

interface CalibrationMemoSummary {
  payloadRef: string;
  sections: string[];
  summary: string;
}

interface RuntimeMetricStatus {
  value: number | null;
  loading: boolean;
  error: string | null;
}

interface RuntimeMetricsState {
  saleQueue: RuntimeMetricStatus;
  compsPool: RuntimeMetricStatus;
  costMatrix: RuntimeMetricStatus;
  incomeRefs: RuntimeMetricStatus;
  countyRollup: RuntimeMetricStatus;
}

type RuntimeMetricKey = keyof RuntimeMetricsState;

interface CountPage {
  total?: number;
}

interface CountResponse {
  count?: number;
  entries?: unknown[];
}

interface CapRatesResponse {
  capRates?: unknown[];
}

interface CountyStatsRuntimeResponse {
  totalParcels?: number;
  averageAssessedValue?: number;
  assessedThisYear?: number;
  pendingAssessments?: number;
  assessmentCompletionPercent?: number;
}

const PRIMARY_MODULES: readonly ForgeModuleDef[] = TERRAFORGE_CANONICAL_INVENTORY.filter(
  (capability) => capability.tier === 'primary',
);

const SUPPORT_MODULES: readonly ForgeModuleDef[] = TERRAFORGE_CANONICAL_INVENTORY.filter(
  (capability) => capability.tier !== 'primary',
);

const COUNTY_STUDIO_MODULE = SUPPORT_MODULES.find((mod) => mod.id === 'county-studio');

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');
const fmtCurrency = (n: number | undefined | null) => (n != null ? `$${n.toLocaleString()}` : '—');

const EMPTY_RUNTIME_METRIC: RuntimeMetricStatus = {
  value: null,
  loading: true,
  error: null,
};

function createRuntimeMetricsState(): RuntimeMetricsState {
  return {
    saleQueue: { ...EMPTY_RUNTIME_METRIC },
    compsPool: { ...EMPTY_RUNTIME_METRIC },
    costMatrix: { ...EMPTY_RUNTIME_METRIC },
    incomeRefs: { ...EMPTY_RUNTIME_METRIC },
    countyRollup: { ...EMPTY_RUNTIME_METRIC },
  };
}

function getCountFromPage(data: CountPage): number | null {
  return typeof data.total === 'number' && Number.isFinite(data.total) ? data.total : null;
}

function getCountFromResponse(data: CountResponse): number | null {
  if (typeof data.count === 'number' && Number.isFinite(data.count)) {
    return data.count;
  }
  return Array.isArray(data.entries) ? data.entries.length : null;
}

function getCapRateCount(data: CapRatesResponse): number | null {
  return Array.isArray(data.capRates) ? data.capRates.length : null;
}

function isUnacceptedCountyRollup(data: CountyStatsRuntimeResponse): boolean {
  return (
    data.totalParcels === 128784 &&
    Math.round(Number(data.averageAssessedValue ?? 0)) === 469565 &&
    data.pendingAssessments === 95758 &&
    data.assessmentCompletionPercent === 71.4
  );
}

function getCountyRollupCount(data: CountyStatsRuntimeResponse): number | null {
  if (isUnacceptedCountyRollup(data)) {
    throw new Error('county-stats returned unaccepted stale rollup values');
  }
  return typeof data.totalParcels === 'number' && Number.isFinite(data.totalParcels) && data.totalParcels > 0
    ? data.totalParcels
    : null;
}

function renderRuntimeMetricValue(metric: RuntimeMetricStatus): string {
  if (metric.loading) return '…';
  if (metric.error) return 'Unavailable';
  return metric.value != null ? metric.value.toLocaleString() : 'Pending';
}

function useRuntimeForgeMetrics(
  runtimeCountyId: string,
  taxYear: number,
  enabled = true,
): RuntimeMetricsState {
  const countyScope = useMemo(() => {
    if (!enabled) {
      return { countyId: runtimeCountyId, headers: {}, isolated: false };
    }
    const session = getSession();
    const { headers, isolated } = buildCountyScopedSessionHeaders(session);
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return { countyId: session?.countyId ?? runtimeCountyId, headers, isolated };
  }, [enabled, runtimeCountyId]);
  const [runtimeMetrics, setRuntimeMetrics] = useState<RuntimeMetricsState>(() => createRuntimeMetricsState());

  useEffect(() => {
    if (!enabled) {
      const unavailable = Object.fromEntries(
        (Object.keys(createRuntimeMetricsState()) as RuntimeMetricKey[]).map((key) => [
          key,
          { value: null, loading: false, error: 'Authenticated county data required.' },
        ]),
      ) as RuntimeMetricsState;
      setRuntimeMetrics(unavailable);
      return;
    }

    if (!countyScope.isolated) {
      const blocked = Object.fromEntries(
        (Object.keys(createRuntimeMetricsState()) as RuntimeMetricKey[]).map((key) => [
          key,
          { value: null, loading: false, error: 'County scope required.' },
        ]),
      ) as RuntimeMetricsState;
      setRuntimeMetrics(blocked);
      return;
    }

    const abortController = new AbortController();
    setRuntimeMetrics(createRuntimeMetricsState());

    const fetchFreshMetricHeaders = async (): Promise<Record<string, string>> => {
      const headers = { ...countyScope.headers };

      const flag = (value: unknown) => String(value ?? '').toLowerCase() === 'true';
      const devPreview =
        flag(import.meta.env.VITE_USE_MOCK_DATA) ||
        flag(import.meta.env.VITE_DEV_PREVIEW_BYPASS_AUTH) ||
        (import.meta.env.DEV &&
          String(import.meta.env.MODE ?? '').toLowerCase() === 'development' &&
          !flag(import.meta.env.VITE_ENFORCE_AUTH_IN_DEV));

      if (!devPreview) {
        return headers;
      }

      try {
        const response = await apiFetch('/auth/dev-token', { signal: abortController.signal });
        if (!response.ok) {
          return headers;
        }
        const payload = (await response.json()) as { token?: unknown };
        if (typeof payload.token === 'string' && payload.token.trim().length > 0) {
          persistToken(payload.token);
          headers.Authorization = `Bearer ${payload.token}`;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }
      }

      return headers;
    };

    let freshMetricHeaders: Promise<Record<string, string>> | null = null;
    const resolveFreshMetricHeaders = (): Promise<Record<string, string>> => {
      freshMetricHeaders ??= fetchFreshMetricHeaders();
      return freshMetricHeaders;
    };

    const resolveMetricHeaders = async (): Promise<Record<string, string>> => {
      const headers = { ...countyScope.headers };
      if (headers.Authorization) {
        return headers;
      }
      return resolveFreshMetricHeaders();
    };

    const metricHeaders = resolveMetricHeaders();

    const fetchMetric = async <T,>(
      key: RuntimeMetricKey,
      path: string,
      selectValue: (data: T) => number | null,
    ) => {
      try {
        const headers = await metricHeaders;
        let response = await apiFetch(path, { headers, signal: abortController.signal });
        if ((response.status === 401 || response.status === 500)) {
          const freshHeaders = await resolveFreshMetricHeaders();
          if (freshHeaders.Authorization && freshHeaders.Authorization !== headers.Authorization) {
            response = await apiFetch(path, { headers: freshHeaders, signal: abortController.signal });
          }
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as T;
        const value = selectValue(data);
        setRuntimeMetrics((current) => ({
          ...current,
          [key]: {
            value,
            loading: false,
            error: value == null ? 'Metric unavailable from runtime response.' : null,
          },
        }));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setRuntimeMetrics((current) => ({
          ...current,
          [key]: {
            value: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Metric unavailable.',
          },
        }));
      }
    };

    const saleParams = new URLSearchParams({
      taxYear: String(taxYear),
      status: 'pending',
      page: '1',
      pageSize: '1',
      countyId: countyScope.countyId,
    });
    const compsParams = new URLSearchParams({
      taxYear: String(taxYear),
      page: '1',
      pageSize: '1',
      countyId: countyScope.countyId,
    });

    void fetchMetric<CountPage>('saleQueue', `/terraforge/sale-qualification?${saleParams}`, getCountFromPage);
    void fetchMetric<CountPage>('compsPool', `/terraforge/comps-pool?${compsParams}`, getCountFromPage);
    void fetchMetric<CountResponse>(
      'costMatrix',
      `/costforge/cost-matrix/${encodeURIComponent(countyScope.countyId)}`,
      getCountFromResponse,
    );
    void fetchMetric<CapRatesResponse>('incomeRefs', '/costforge/income-approach/cap-rates', getCapRateCount);
    void fetchMetric<CountyStatsRuntimeResponse>(
      'countyRollup',
      `/terraforge/county-stats?taxYear=${taxYear}&countyId=${encodeURIComponent(countyScope.countyId)}`,
      getCountyRollupCount,
    );

    return () => abortController.abort();
  }, [countyScope, enabled, taxYear]);

  return runtimeMetrics;
}

function isJune10RuntimeForgeModule(mod: ForgeModuleDef): boolean {
  return mod.status === 'active' && Boolean(mod.moduleId);
}

function getSourceDisclosure(source: 'snapshot' | 'fixtures' | 'live' | null): string | null {
  if (JUNE_10_PROOF_FREEZE) {
    return JUNE_10_FORGE_NOTICE;
  }
  if (source === 'snapshot') {
    return 'Snapshot-backed county aggregates: TerraForge stats are using bundled county snapshot data, not live backend metrics.';
  }
  if (source === 'fixtures') {
    return 'Non-live county aggregate mode is active; TerraForge stats are not live backend metrics.';
  }
  return null;
}

function getLaunchLabel(mod: ForgeModuleDef): string {
  if (mod.status === 'deferred') {
    return 'Deferred by June 10 canon';
  }
  if (mod.status === 'honest-unavailable') {
    return 'Unavailable in /forge runtime';
  }
  if (mod.status === 'fail') {
    return 'Fails current suite gate';
  }
  if (mod.id === 'costforge') {
    return 'Benton CostForge triage API';
  }
  if (mod.id === 'compsforge') {
    return 'Statewide sales comp search';
  }
  if (mod.id === 'incomeforge') {
    return 'Benton income approach API';
  }
  if (mod.id === 'county-studio') {
    return 'Support: County Studio studies API';
  }
  if (mod.id === 'calibration-qc') {
    return 'Benton CostForge calibration API';
  }
  if (isJune10RuntimeForgeModule(mod)) {
    return 'Benton sale qualification API';
  }
  return 'Support tool';
}

export interface ForgeSuiteHomeProps {
  metadata?: Record<string, unknown>;
}

function formatCountyContextPosture(value: string): string {
  return value === 'unavailable' ? 'Unavailable' : value.replaceAll('_', ' ');
}

function isForgeModuleAvailableInContext(
  mod: ForgeModuleDef,
  countyContext: WashingtonCountiesHubHandoff | null,
  countyContextRequested: boolean,
): boolean {
  if (!isJune10RuntimeForgeModule(mod) || mod.truthState === 'queued') return false;
  if (!countyContextRequested) return true;
  return countyContext !== null
    && mod.id === 'salesforge'
    && countyContext.salesReviewAvailability === 'available';
}

function getContextualLaunchLabel(
  mod: ForgeModuleDef,
  countyContext: WashingtonCountiesHubHandoff | null,
  countyContextRequested: boolean,
): string {
  if (!countyContextRequested || !isJune10RuntimeForgeModule(mod)) return getLaunchLabel(mod);
  if (!countyContext) return 'Valid county scope required';
  if (mod.id !== 'salesforge') return 'Authenticated county data required';
  if (countyContext.salesReviewAvailability !== 'available') {
    return 'Public sales review unavailable';
  }
  return countyContext.referenceRecordCount === null
    ? 'Public sales review available'
    : `${countyContext.referenceRecordCount.toLocaleString()} public/reference sales`;
}

export default function ForgeSuiteHome({ metadata }: ForgeSuiteHomeProps = {}) {
  const washingtonCountyContextRequested = metadata?.launchContext
    === 'washington-counties-hub';
  const washingtonCountyContext = useMemo(
    () => parseWashingtonCountiesHubHandoff(metadata),
    [metadata],
  );
  const countyContextOnly = washingtonCountyContextRequested;
  const { stats, loading, error, source } = useCountyStats({ enabled: !countyContextOnly });
  const runtimeCountyId = countyContextOnly ? '' : getSession()?.countyId ?? 'benton';
  const runtimeTaxYear = 2026;
  const runtimeMetrics = useRuntimeForgeMetrics(
    runtimeCountyId,
    runtimeTaxYear,
    !countyContextOnly,
  );
  const sourceDisclosure = getSourceDisclosure(source);
  const showForgeMetrics = !JUNE_10_PROOF_FREEZE;
  const displayedStats = showForgeMetrics ? stats : null;
  const displayedLoading = showForgeMetrics ? loading : false;
  const countyRollupStatus = runtimeMetrics.countyRollup.loading
    ? 'Metrics app-backed; county rollup resolving'
    : runtimeMetrics.countyRollup.error
      ? 'Metrics app-backed; county rollup blocked'
      : 'Metrics runtime-backed';
  const countyRollupChipClass = runtimeMetrics.countyRollup.loading || runtimeMetrics.countyRollup.error
    ? 'forge-chip--warn'
    : 'forge-chip--success';
  const [briefState, setBriefState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: MorningBriefSummary; correlationId?: string; error?: string }>({ status: 'idle' });
  const [diagnosticsState, setDiagnosticsState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: CountyDiagnosticsSummary; correlationId?: string; error?: string }>({ status: 'idle' });
  const [memoState, setMemoState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: CalibrationMemoSummary; correlationId?: string; error?: string }>({ status: 'idle' });

  // KPI values from /api/terraforge/county-stats when the provider is live.
  const fmt = (n: number | undefined, style: 'decimal' | 'currency' | 'percent', decimals = 0) => {
    if (n === undefined || n === null) return '—';
    if (style === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: decimals }).format(n);
    if (style === 'percent') return `${n.toFixed(1)}%`;
    return new Intl.NumberFormat('en-US').format(n);
  };
  const kpiMetrics = JUNE_10_PROOF_FREEZE
    ? [
        {
          label: 'SALE QUEUE',
          value: renderRuntimeMetricValue(runtimeMetrics.saleQueue),
          tone: runtimeMetrics.saleQueue.error ? 'warn' : 'success',
          source: runtimeMetrics.saleQueue.error ?? 'SaleQualification API',
        },
        {
          label: 'COMPS POOL',
          value: renderRuntimeMetricValue(runtimeMetrics.compsPool),
          tone: runtimeMetrics.compsPool.error ? 'warn' : 'success',
          source: runtimeMetrics.compsPool.error ?? 'CompsForge comps-pool API',
        },
        {
          label: 'COST MATRIX',
          value: renderRuntimeMetricValue(runtimeMetrics.costMatrix),
          tone: runtimeMetrics.costMatrix.error ? 'warn' : 'success',
          source: runtimeMetrics.costMatrix.error ?? 'CostForge cost-matrix API',
        },
        {
          label: 'INCOME REFS',
          value: renderRuntimeMetricValue(runtimeMetrics.incomeRefs),
          tone: runtimeMetrics.incomeRefs.error ? 'warn' : 'success',
          source: runtimeMetrics.incomeRefs.error ?? 'IncomeForge cap-rate API',
        },
        {
          label: 'COUNTY ROLLUP',
          value: renderRuntimeMetricValue(runtimeMetrics.countyRollup),
          tone: runtimeMetrics.countyRollup.error ? 'warn' : 'success',
          source: runtimeMetrics.countyRollup.error ?? 'TerraForge county-stats API',
        },
      ] as const
    : [
        { label: 'TOTAL PARCELS',      value: displayedLoading ? '…' : fmt(displayedStats?.totalParcels,             'decimal'),   tone: 'neutral', source: 'County stats API'  },
        { label: 'AVG ASSESSED',       value: displayedLoading ? '…' : fmt(displayedStats?.averageAssessedValue,      'currency'),  tone: 'neutral', source: 'County stats API'  },
        { label: 'ASSESSED THIS YEAR', value: displayedLoading ? '…' : fmt(displayedStats?.assessedThisYear,          'decimal'),   tone: 'neutral', source: 'County stats API'  },
        { label: 'PENDING',            value: displayedLoading ? '…' : fmt(displayedStats?.pendingAssessments,        'decimal'),   tone: 'warn', source: 'County stats API'     },
        { label: 'COMPLETION',         value: displayedLoading ? '…' : (displayedStats ? fmt(displayedStats.assessmentCompletionPercent, 'percent') : '—'), tone: 'success', source: 'County stats API' },
      ] as const;

  const handleModuleLaunch = (mod: ForgeModuleDef) => {
    if (!isForgeModuleAvailableInContext(
      mod,
      washingtonCountyContext,
      washingtonCountyContextRequested,
    )) return;

    const targetId = mod.moduleId;
    if (!targetId) {
      return;
    }
    if (washingtonCountyContext) {
      void activateModule(targetId, {
        source: 'system',
        metadata: washingtonCountyContext,
      });
      return;
    }
    const metadata = mod.id === 'costforge'
      ? {
          launchContext: 'terraforge-suite',
          dataSource: 'terrafusion-api',
          runtimePath: 'costforge-triage',
          countyId: runtimeCountyId,
          taxYear: 2026,
        }
      : mod.id === 'salesforge'
      ? {
          launchContext: 'terraforge-suite',
          dataSource: 'terrafusion-api',
          countyId: runtimeCountyId,
          taxYear: 2026,
        }
      : mod.id === 'compsforge'
      ? {
          launchContext: 'terraforge-suite',
          dataSource: 'terrafusion-api',
          runtimePath: 'compsforge-comps-pool',
          countyId: runtimeCountyId,
          taxYear: 2026,
        }
      : mod.id === 'incomeforge'
      ? {
          launchContext: 'terraforge-suite',
          dataSource: 'terrafusion-api',
          runtimePath: 'income-approach',
          countyId: runtimeCountyId,
          taxYear: 2026,
        }
      : mod.id === 'calibration-qc'
      ? {
          launchContext: 'terraforge-suite',
          dataSource: 'terrafusion-api',
          runtimePath: 'costforge-calibration',
          countyId: runtimeCountyId,
          taxYear: 2026,
        }
      : mod.id === 'county-studio'
      ? {
          launchContext: 'terraforge-suite',
          dataSource: 'terrafusion-api',
          runtimePath: 'county-studio-studies',
          countyId: runtimeCountyId,
          taxYear: 2026,
        }
      : undefined;
    void activateModule(targetId, { source: 'system', ...(metadata ? { metadata } : {}) });
  };

  const parseToolOutput = <T,>(output: unknown, fallback: T): T => {
    try {
      return typeof output === 'string' ? JSON.parse(output) as T : output as T;
    } catch {
      return fallback;
    }
  };

  const normalizeMorningBrief = (output: unknown): MorningBriefSummary => {
    const defaults: MorningBriefSummary = {
      role: 'chief_appraiser',
      queueType: 'calibration_review',
      priority: 'medium',
      dueWindow: 'next business day',
      recommendedTool: 'rerun_ratio_study',
      readyToAct: false,
      blockingDependencies: [],
      findings: [],
    };

    const parsed = parseToolOutput<MorningBriefToolOutput>(output, defaults);

    if (parsed.brief) {
      return {
        ...defaults,
        ...parsed.brief,
        findings: parsed.findings ?? parsed.brief.findings ?? defaults.findings,
      };
    }

    return {
      ...defaults,
      ...parsed,
      findings: parsed.findings ?? defaults.findings,
    };
  };

  const handleRefreshBrief = useCallback(async () => {
    if (!JUNE_10_COMMAND_ACTIONS_ENABLED) {
      return;
    }

    setBriefState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'generate_morning_brief',
        mode: 'muse',
        params: { county: runtimeCountyId, taxYear: 2026, role: 'chief_appraiser' },
      });
      if (response.success && response.result) {
        setBriefState({ status: 'success', result: normalizeMorningBrief(response.result.output), correlationId: response.correlationId });
      } else {
        setBriefState({ status: 'error', correlationId: response.correlationId, error: response.error?.message || 'Failed to load county briefing.' });
      }
    } catch (toolError) {
      setBriefState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to load county briefing.',
      });
    }
  }, [runtimeCountyId]);

  const handleRunDiagnostics = useCallback(async () => {
    if (!JUNE_10_COMMAND_ACTIONS_ENABLED) {
      return;
    }

    setDiagnosticsState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'rerun_ratio_study',
        mode: 'pilot',
        params: { county: runtimeCountyId, taxYear: 2026, draftVersion: 'benton-2026-working', scope: 'county' },
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<CountyDiagnosticsSummary>(response.result.output, {
          metrics: { prdBefore: 0, prdAfter: 0, codBefore: 0, codAfter: 0, avDelta: 0, fairnessDelta: 0 },
          readyForSignoff: false,
          narrative: 'No county diagnostics returned.',
        });
        setDiagnosticsState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setDiagnosticsState({ status: 'error', correlationId: response.correlationId, error: response.error?.message || 'Failed to run county diagnostics.' });
      }
    } catch (toolError) {
      setDiagnosticsState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to run county diagnostics.',
      });
    }
  }, [runtimeCountyId]);

  const handleDraftBoardMemo = useCallback(async () => {
    if (!JUNE_10_COMMAND_ACTIONS_ENABLED) {
      return;
    }

    setMemoState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'generate_calibration_memo',
        mode: 'muse',
        params: { county: runtimeCountyId, draftVersion: 'benton-2026-working', audience: 'board', reasonCode: 'annual_certification' },
        confirmation: { confirmed: true, reasonCode: 'annual_certification' },
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<CalibrationMemoSummary>(response.result.output, {
          payloadRef: '',
          sections: [],
          summary: 'No calibration memo returned.',
        });
        setMemoState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setMemoState({ status: 'error', correlationId: response.correlationId, error: response.error?.message || 'Failed to draft board memo.' });
      }
    } catch (toolError) {
      setMemoState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to draft board memo.',
      });
    }
  }, [runtimeCountyId]);

  return (
    <div data-testid="suite-forge-root" className="forge-workspace h-full flex flex-col">
      <main className="forge-workspace__viewport">
        <div className="forge-workspace__stage">
          <header className="forge-workspace__header">
            <div>
              <p className="forge-workspace__eyebrow">
                {washingtonCountyContext
                  ? `Washington Counties Hub · WA-${washingtonCountyContext.countyCode}`
                  : washingtonCountyContextRequested
                    ? 'Washington Counties Hub · county scope invalid'
                    : 'Suite-Forge · Benton operating model'}
              </p>
              <h1 className="forge-workspace__title">TerraForge</h1>
              <p className="forge-workspace__subtitle">
                {washingtonCountyContext
                  ? `${washingtonCountyContext.countyName} County context is active. TerraForge exposes only workflows supported by this county's governed public/reference data.`
                  : washingtonCountyContextRequested
                    ? 'The Counties Hub handoff could not be validated. TerraForge is fail-closed and no county workflow can run.'
                    : 'Valuation suite available in Benton context; unverified standalone workflows stay preview-locked until separately verified.'}
              </p>
            </div>
            <div className="forge-workspace__status">
              <span className="forge-chip forge-chip--neutral">Layer 2 Workspace</span>
              {washingtonCountyContextRequested ? (
                <span className="forge-chip forge-chip--warn">Public navigation context</span>
              ) : (
                <span className="forge-chip forge-chip--warn">
                  Suite metrics app-backed partial
                </span>
              )}
            </div>
          </header>

          {!countyContextOnly && sourceDisclosure && (
            <div data-testid="forge-source-disclosure" role="status" className="forge-workspace__notice forge-workspace__notice--warn">
              {sourceDisclosure}
            </div>
          )}
          {countyContextOnly ? (
            washingtonCountyContext ? (
              <section className="forge-panel forge-runtime-status" data-testid="forge-county-context">
              <div className="forge-panel__header">
                <div>
                  <p className="forge-panel__eyebrow">Selected county context</p>
                  <h2 className="forge-panel__title">
                    {washingtonCountyContext.countyName} County
                  </h2>
                </div>
              </div>
              <div className="forge-ops-tags">
                <span className="forge-chip forge-chip--neutral">
                  WA-{washingtonCountyContext.countyCode}
                </span>
                <span className="forge-chip forge-chip--neutral">
                  Source {formatCountyContextPosture(washingtonCountyContext.referenceDataPosture)}
                </span>
                <span
                  className={`forge-chip ${washingtonCountyContext.salesReviewAvailability === 'available' ? 'forge-chip--success' : 'forge-chip--warn'}`}
                >
                  SalesForge {washingtonCountyContext.salesReviewAvailability}
                </span>
              </div>
              <p className="forge-ops-note">
                County selection is navigation context only. Protected TerraFusion APIs remain
                bound to the authenticated county session, and unavailable public inputs never
                fall back to Benton or another county.
              </p>
              {washingtonCountyContext.salesReviewAvailability === 'available' ? (
                <p className="forge-ops-note">
                  {washingtonCountyContext.referenceRecordCount?.toLocaleString() ?? 'Governed'}{' '}
                  public/reference sales are available for read-only review
                  {washingtonCountyContext.latestReferenceSaleDate
                    ? ` through ${washingtonCountyContext.latestReferenceSaleDate}`
                    : ''}.
                </p>
              ) : (
                <div className="forge-workspace__notice forge-workspace__notice--warn" role="status">
                  {washingtonCountyContext.salesReviewUnavailableMessage
                    ?? 'No governed public sales workflow is available for this county.'}
                </div>
              )}
              </section>
            ) : (
              <section
                className="forge-panel forge-runtime-status"
                data-testid="forge-county-context-invalid"
                role="alert"
              >
                <div className="forge-panel__header">
                  <div>
                    <p className="forge-panel__eyebrow">Selected county context</p>
                    <h2 className="forge-panel__title">County scope required</h2>
                  </div>
                </div>
                <p className="forge-ops-note">
                  The Washington county name and code must match the canonical registry. No
                  TerraForge workflow or authenticated county data is loaded when that handoff is
                  invalid.
                </p>
              </section>
            )
          ) : (
            <section className="forge-panel forge-runtime-status" data-testid="forge-runtime-status">
              <div className="forge-panel__header">
                <div>
                  <p className="forge-panel__eyebrow">TerraForge Runtime Status</p>
                  <h2 className="forge-panel__title">One verified app at a time</h2>
                </div>
              </div>
              <div className="forge-ops-tags">
                <span className="forge-chip forge-chip--success">SalesForge runtime</span>
                <span className="forge-chip forge-chip--success">CostForge live triage path</span>
                <span className="forge-chip forge-chip--success">CompsForge runtime comps pool</span>
                <span className="forge-chip forge-chip--success">IncomeForge runtime income approach</span>
                <span className="forge-chip forge-chip--success">County Studio runtime studies</span>
                <span className={`forge-chip ${countyRollupChipClass}`}>
                  {countyRollupStatus}
                </span>
                <span className="forge-chip forge-chip--warn">Full TerraForge not done</span>
                <span className="forge-chip forge-chip--warn">CUForge/specialists locked</span>
                <span className="forge-chip forge-chip--warn">County Studio health not rollup proof</span>
              </div>
            </section>
          )}
          {!countyContextOnly && showForgeMetrics && loading && !stats && (
            <div data-testid="forge-loading" role="status" className="forge-workspace__notice">
              Loading county metrics…
            </div>
          )}
          {!countyContextOnly && error && (
            <div data-testid="forge-error" role="alert" className="forge-workspace__notice forge-workspace__notice--error">
              {error}
            </div>
          )}

          {!countyContextOnly && (
            <section data-testid="forge-stats" className="forge-kpi-grid">
              {kpiMetrics.map(({ label, value, tone, source: metricSource }) => (
                <div key={label} className="forge-kpi-cell">
                  <div className="forge-kpi-cell__label">{label}</div>
                  <div className={`forge-kpi-cell__value forge-kpi-cell__value--${tone}`}>{value}</div>
                  <div className="forge-kpi-cell__source">{metricSource}</div>
                </div>
              ))}
            </section>
          )}

          {!countyContextOnly && (
            <section className="forge-panel" data-testid="forge-calibration-desk">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">County Calibration Desk</p>
                <h2 className="forge-panel__title">Chief appraiser command posture</h2>
              </div>
            </div>

            <div className="forge-ops-grid">
              <div className="forge-ops-card">
                <div className="forge-ops-card__head">
                  <div>
                    <div className="forge-ops-card__title">Morning Brief</div>
                    <div className="forge-ops-card__sub">Ranked findings and recommended next tool for the Benton Runtime Pilot.</div>
                  </div>
                  <button
                    type="button"
                    className="forge-ops-btn"
                    onClick={handleRefreshBrief}
                    disabled={!JUNE_10_COMMAND_ACTIONS_ENABLED || briefState.status === 'loading'}
                    title={!JUNE_10_COMMAND_ACTIONS_ENABLED ? JUNE_10_FORGE_ACTION_LOCK_NOTICE : undefined}
                  >
                    {briefState.status === 'loading' ? 'Refreshing…' : 'Refresh Brief'}
                  </button>
                </div>
                {briefState.status === 'success' && briefState.result && (
                  <div className="forge-ops-body">
                    <div className="forge-ops-metrics">
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">Queue</span>
                        <span className="forge-ops-metric__value">{briefState.result.queueType.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">Priority</span>
                        <span className="forge-ops-metric__value">{briefState.result.priority}</span>
                      </div>
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">Recommended Tool</span>
                        <span className="forge-ops-metric__value">{briefState.result.recommendedTool.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    {briefState.result.findings.slice(0, 2).map((finding) => (
                      <div key={finding.correlationId} className="forge-ops-finding">
                        <div className="forge-ops-finding__top">
                          <span>{finding.findingType}</span>
                          <span className="forge-chip forge-chip--warn">{finding.severity}</span>
                        </div>
                        <p>{finding.recommendedAction}</p>
                      </div>
                    ))}
                    <div className="forge-ops-foot">
                      <span>{briefState.result.readyToAct ? 'Ready to act' : 'Awaiting dependencies'}</span>
                      {briefState.correlationId && <code>{briefState.correlationId.slice(0, 16)}...</code>}
                    </div>
                  </div>
                )}
                {briefState.status === 'error' && <div className="forge-workspace__notice forge-workspace__notice--error">{briefState.error}</div>}
              </div>

              <div className="forge-ops-card">
                <div className="forge-ops-card__head">
                  <div>
                    <div className="forge-ops-card__title">County Diagnostics Sweep</div>
                    <div className="forge-ops-card__sub">Refresh PRD, COD, AV delta, and signoff posture for the working draft.</div>
                  </div>
                  <button
                    type="button"
                    className="forge-ops-btn"
                    onClick={handleRunDiagnostics}
                    disabled={!JUNE_10_COMMAND_ACTIONS_ENABLED || diagnosticsState.status === 'loading'}
                    title={!JUNE_10_COMMAND_ACTIONS_ENABLED ? JUNE_10_FORGE_ACTION_LOCK_NOTICE : undefined}
                  >
                    {diagnosticsState.status === 'loading' ? 'Running…' : 'Run Sweep'}
                  </button>
                </div>
                {diagnosticsState.status === 'success' && diagnosticsState.result && (
                  <div className="forge-ops-body">
                    <div className="forge-ops-metrics forge-ops-metrics--compact">
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">PRD</span>
                        <span className="forge-ops-metric__value">{diagnosticsState.result.metrics.prdBefore.toFixed(3)} → {diagnosticsState.result.metrics.prdAfter.toFixed(3)}</span>
                      </div>
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">COD</span>
                        <span className="forge-ops-metric__value">{diagnosticsState.result.metrics.codBefore.toFixed(2)} → {diagnosticsState.result.metrics.codAfter.toFixed(2)}</span>
                      </div>
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">AV Delta</span>
                        <span className="forge-ops-metric__value">{fmtCurrency(diagnosticsState.result.metrics.avDelta)}</span>
                      </div>
                    </div>
                    <p className="forge-ops-note">{diagnosticsState.result.narrative}</p>
                    <div className="forge-ops-foot">
                      <span>{diagnosticsState.result.readyForSignoff ? 'Signoff ready' : 'Further review needed'}</span>
                      {diagnosticsState.correlationId && <code>{diagnosticsState.correlationId.slice(0, 16)}...</code>}
                    </div>
                  </div>
                )}
                {diagnosticsState.status === 'error' && <div className="forge-workspace__notice forge-workspace__notice--error">{diagnosticsState.error}</div>}
              </div>

              <div className="forge-ops-card forge-ops-card--wide">
                <div className="forge-ops-card__head">
                  <div>
                    <div className="forge-ops-card__title">Board Memo Packet</div>
                    <div className="forge-ops-card__sub">Draft the governed board-facing calibration memo after Forge applications are separately verified.</div>
                  </div>
                  <div className="forge-ops-actions">
                    <button
                      type="button"
                      className="forge-ops-btn"
                      onClick={handleDraftBoardMemo}
                      disabled={!JUNE_10_COMMAND_ACTIONS_ENABLED || memoState.status === 'loading'}
                      title={!JUNE_10_COMMAND_ACTIONS_ENABLED ? JUNE_10_FORGE_ACTION_LOCK_NOTICE : undefined}
                    >
                      {memoState.status === 'loading' ? 'Drafting…' : 'Draft Memo'}
                    </button>
                    <button
                      type="button"
                      className="forge-ops-btn forge-ops-btn--ghost"
                      onClick={() => handleModuleLaunch(PRIMARY_MODULES[0])}
                    >
                      Open CostForge
                    </button>
                    {COUNTY_STUDIO_MODULE && (
                      <button
                        type="button"
                        className="forge-ops-btn forge-ops-btn--ghost"
                        onClick={() => handleModuleLaunch(COUNTY_STUDIO_MODULE)}
                      >
                        Open County Studio
                      </button>
                    )}
                  </div>
                </div>
                {memoState.status === 'success' && memoState.result && (
                  <div className="forge-ops-body">
                    <p className="forge-ops-note">{memoState.result.summary}</p>
                    <div className="forge-ops-tags">
                      {memoState.result.sections.map((section) => (
                        <span key={section} className="forge-chip forge-chip--neutral">{section}</span>
                      ))}
                    </div>
                    <div className="forge-ops-foot">
                      <span>{memoState.result.payloadRef || 'Payload pending'}</span>
                      {memoState.correlationId && <code>{memoState.correlationId.slice(0, 16)}...</code>}
                    </div>
                  </div>
                )}
                {memoState.status === 'error' && <div className="forge-workspace__notice forge-workspace__notice--error">{memoState.error}</div>}
              </div>
            </div>
          </section>
          )}

          <section className="forge-panel" data-testid="forge-primary-applications">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">Primary Applications</p>
                <h2 className="forge-panel__title">County-wide valuation scenes</h2>
              </div>
            </div>
            <div className="forge-primary-grid">
              {PRIMARY_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  className="forge-card forge-card--primary"
                  onClick={() => handleModuleLaunch(mod)}
                  disabled={!isForgeModuleAvailableInContext(
                    mod,
                    washingtonCountyContext,
                    washingtonCountyContextRequested,
                  )}
                  title={
                    washingtonCountyContextRequested
                      ? !isForgeModuleAvailableInContext(
                          mod,
                          washingtonCountyContext,
                          washingtonCountyContextRequested,
                        )
                        ? mod.id === 'salesforge'
                          ? washingtonCountyContext?.salesReviewUnavailableMessage
                            ?? 'Valid Washington county scope is required.'
                          : isJune10RuntimeForgeModule(mod)
                            ? 'Authenticated county data is required for this workflow.'
                            : 'This workflow is unavailable in the selected public county context.'
                        : undefined
                      : !isJune10RuntimeForgeModule(mod)
                        ? JUNE_10_FORGE_NOTICE
                        : undefined
                  }
                >
                  <div className="forge-card__rail">
                    <span className="forge-chip forge-chip--neutral">{mod.chipLabel}</span>
                    <span className={`forge-chip ${isForgeModuleAvailableInContext(mod, washingtonCountyContext, washingtonCountyContextRequested) ? 'forge-chip--success' : 'forge-chip--warn'}`}>
                      {washingtonCountyContextRequested
                        && isJune10RuntimeForgeModule(mod)
                        && !isForgeModuleAvailableInContext(
                          mod,
                          washingtonCountyContext,
                          washingtonCountyContextRequested,
                        )
                        ? 'unavailable in county context'
                        : mod.status.replace(/-/g, ' ')}
                    </span>
                    <span className="forge-card__foot">
                      {getContextualLaunchLabel(
                        mod,
                        washingtonCountyContext,
                        washingtonCountyContextRequested,
                      )}
                    </span>
                  </div>
                  <div className="forge-card__title">{mod.label}</div>
                  <p className="forge-card__description">{mod.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="forge-panel" data-testid="forge-support-applications">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">Support &amp; deferred tools</p>
                <h2 className="forge-panel__title">Outside primary TerraForge proof</h2>
              </div>
            </div>
            <div className="forge-primary-grid">
              {SUPPORT_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  className="forge-card forge-card--secondary"
                  onClick={() => handleModuleLaunch(mod)}
                  disabled={!isForgeModuleAvailableInContext(
                    mod,
                    washingtonCountyContext,
                    washingtonCountyContextRequested,
                  )}
                  title={
                    washingtonCountyContextRequested
                      ? !isForgeModuleAvailableInContext(
                          mod,
                          washingtonCountyContext,
                          washingtonCountyContextRequested,
                        )
                        ? isJune10RuntimeForgeModule(mod)
                          ? 'Authenticated county data is required for this workflow.'
                          : 'This workflow is unavailable in the selected public county context.'
                        : undefined
                      : !isJune10RuntimeForgeModule(mod)
                        ? JUNE_10_FORGE_NOTICE
                        : undefined
                  }
                >
                  <div className="forge-card__rail">
                    <span className="forge-chip forge-chip--neutral">{mod.chipLabel}</span>
                    <span className={`forge-chip ${isForgeModuleAvailableInContext(mod, washingtonCountyContext, washingtonCountyContextRequested) ? 'forge-chip--success' : 'forge-chip--warn'}`}>
                      {washingtonCountyContextRequested
                        && isJune10RuntimeForgeModule(mod)
                        && !isForgeModuleAvailableInContext(
                          mod,
                          washingtonCountyContext,
                          washingtonCountyContextRequested,
                        )
                        ? 'unavailable in county context'
                        : mod.status.replace(/-/g, ' ')}
                    </span>
                    <span className="forge-card__foot">
                      {getContextualLaunchLabel(
                        mod,
                        washingtonCountyContext,
                        washingtonCountyContextRequested,
                      )}
                    </span>
                  </div>
                  <div className="forge-card__title">{mod.label}</div>
                  <p className="forge-card__description">{mod.description}</p>
                </button>
              ))}
            </div>
          </section>

          {JUNE_10_RUNTIME_PANELS_ENABLED && !countyContextOnly && (
            <>
              {/* Slice 1.4 — county-wide sale qualification queue */}
              <SaleQualificationQueue />

              {/* Slice 1.6 — qualified comps pool browser */}
              <CompsPoolBrowser />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
