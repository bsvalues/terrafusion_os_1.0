// TerraFusion OS — Mined from terra-forge-rebuild CostForge Hooks
// Bridges CostForge RCNLD calculation into React Query for component use.
// REST-adapted: calls POST /api/costforge/calculate for RCNLD.

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { apiFetch } from '../lib/apiBase';
import { getSession } from '../auth/session';
import { AuthContext } from '../auth/authContextDef';
import { buildCountyScopedSessionHeaders } from '../services/countyIsolation';
import { normalizeCountyToken, supportsCertifiedCostScheduleLane } from '../pages/forge/countyCertification';

export type QualityGrade = 'Low' | 'Fair' | 'Average' | 'Good' | 'Excellent';
export type PropertyType = 'residential' | 'commercial';

export interface CostForgeCalcInput {
  lrsn: string | null;
  pin: string | null;
  county_id: string;
  imprv_det_type_cd: string | null;
  yr_built: number;
  area_sqft: number;
  condition_code: string | null;
  construction_class_raw: string | null;
  use_code: string | null;
  section_id: number | null;
  occupancy_code: string | null;
  is_residential: boolean;
  revalArea?: string;
}

export interface CostForgeSecondaryFeature {
  code: string;
  description: string;
  value: number;
}

export interface CostForgeResult {
  parcelResolution?: { requestedReference: string; parcelId: string; parcelNumber: string | null; countyId: string };
  canonical?: { schemaVersion: string; parcelId: string; rcnPerSqft: number; rcndPerSqft: number;
    adjustedCostPerSqft: number; replacementCost: number; physicalDepreciation: number;
    conditionAdjustment: number; rcnld: number; landValue: number; totalValue: number };
  provenance?: { countyId: string; parcelId: string; sourceCommit: string; executableSha256: string;
    inputHash: string; stdoutSha256: string; auditEventId: string; requestId: string };
  baseUnitCost: number | null;
  localMultiplier: number | null;
  currentCostMult: number | null;
  rcnBeforeRef: number | null;
  refinementsTotal: number | null;
  rcn: number | null;
  ageYears: number | null;
  effectiveLifeYears: number | null;
  pctGood: number | null;
  rcnld: number | null;
  scheduleSource: string | null;
  calcMethod: string;
  /** County-certified secondary features (patio, basement, shop, etc.) as %-of-BIV */
  secondaryFeatures?: CostForgeSecondaryFeature[];
}

export interface ImprvTypeCode {
  code: string;
  description: string;
  bivPct: number;
}

/** All active improvement type codes for the county with human-readable labels.
 *  Backend returns { buildingTypes, featureCodes, qualityGrades, conditionGrades }.
 *  We expose featureCodes which carry the bivPct factor used by the Parcel Inspector. */
export function useImprvTypeCodes(
  countyId: string | null,
  headers?: Record<string, string>,
) {
  return useQuery<ImprvTypeCode[]>({
    queryKey: ['costforge-type-codes', countyId],
    queryFn: async () => {
      if (!countyId) {
        return [];
      }

      const res = await apiFetch(
        `/costforge/improvement-type-codes?countyId=${encodeURIComponent(countyId)}`,
        { headers },
      );
      if (!res.ok) throw new Error(`Imprv type codes fetch failed: ${res.status}`);
      const data = await res.json() as { featureCodes?: ImprvTypeCode[] };
      return data.featureCodes ?? [];
    },
    enabled: Boolean(countyId),
    staleTime: 10 * 60 * 1000,
  });
}

interface UseCalcRCNLDState {
  result: CostForgeResult | null;
  isLoading: boolean;
  error: string | null;
  errorCorrelationId: string | null;
  calculate: (
    input: CostForgeCalcInput,
    qualityGrade?: QualityGrade,
    extWallType?: string,
    effectiveLifeYears?: number,
    headers?: Record<string, string>,
  ) => Promise<void>;
  reset: () => void;
}

/** Imperative hook for RCNLD calculation. POST /api/costforge/calculate */
export function useCalcRCNLD(): UseCalcRCNLDState {
  const auth = useContext(AuthContext);
  const session = getSession();
  const contextKey = JSON.stringify([session?.userId, session?.countyId, session?.parcelId, auth?.token]);
  const contextRef = useRef(contextKey);
  contextRef.current = contextKey;
  const generation = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const [result, setResult] = useState<CostForgeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCorrelationId, setErrorCorrelationId] = useState<string | null>(null);

  const reset = useCallback(() => {
    generation.current++;
    pending.current?.abort();
    setResult(null); setError(null); setErrorCorrelationId(null); setIsLoading(false);
  }, []);
  useEffect(() => { reset(); return () => { generation.current++; pending.current?.abort(); }; }, [contextKey, reset]);

  const calculate = useCallback(async (
    input: CostForgeCalcInput,
    qualityGrade: QualityGrade = 'Average',
    _extWallType = 'Metal or Vinyl Siding',
    _effectiveLifeYears = 45,
    headers?: Record<string, string>,
  ) => {
    const current = ++generation.current;
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    const requestContext = contextRef.current;
    const requestSession = JSON.stringify(getSession());
    const stillCurrent = () => current === generation.current && requestContext === contextRef.current && requestSession === JSON.stringify(getSession());
    setIsLoading(true); setResult(null); setError(null); setErrorCorrelationId(null);
    try {
      if (!input.pin?.trim() || !input.revalArea?.trim()) throw new Error('Parcel and explicit Reval Area/Cycle are required.');
      if (getSession()?.countyId !== input.county_id) throw new Error('County context changed. Run again in the current county.');
      const res = await apiFetch('/costforge/calculate', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...buildCountyScopedSessionHeaders(getSession()).headers, ...headers },
        body: JSON.stringify({ parcelNumber: input.pin, countyCode: input.county_id,
          region: input.revalArea, buildingType: input.is_residential ? 'residential' : 'commercial',
          squareFeet: input.area_sqft, yearBuilt: input.yr_built, quality: qualityGrade,
          condition: input.condition_code ?? 'GOOD', complexity: 'STANDARD' }),
      });
      if (!res.ok) {
        const failure = await res.json().catch(() => ({})) as { code?: string; message?: string; correlationId?: string };
        const cid = res.headers?.get('X-Correlation-ID') ?? failure.correlationId;
        if (stillCurrent() && typeof cid === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(cid)) setErrorCorrelationId(cid);
        throw new Error([failure.code ?? `RCNLD calculation failed: ${res.status}`, failure.message, failure.correlationId].filter(Boolean).join(' — '));
      }
      const data = await res.json() as CostForgeResult;
      if (!stillCurrent()) return;
      const resolution = data.parcelResolution;
      if (!resolution || resolution.requestedReference !== input.pin
        || typeof resolution.parcelId !== 'string' || !resolution.parcelId.trim()
        || (input.pin !== resolution.parcelId && input.pin !== resolution.parcelNumber)
        || !data.canonical || data.canonical.schemaVersion !== '1.0.0' || data.canonical.parcelId !== resolution.parcelId
        || !data.provenance || data.provenance.parcelId !== resolution.parcelId
        || resolution.countyId !== data.provenance.countyId
        || typeof data.provenance.countyId !== 'string'
        || !(normalizeCountyToken(data.provenance.countyId) === normalizeCountyToken(input.county_id)
          || (supportsCertifiedCostScheduleLane(input.county_id) && supportsCertifiedCostScheduleLane(data.provenance.countyId)))
        || !/^[a-f0-9]{40}$/.test(data.provenance.sourceCommit) || !/^[a-f0-9]{64}$/.test(data.provenance.executableSha256)
        || !/^[a-f0-9]{64}$/.test(data.provenance.inputHash) || !/^[a-f0-9]{64}$/.test(data.provenance.stdoutSha256)
        || typeof data.provenance.requestId !== 'string' || !data.provenance.requestId.trim()
        || typeof data.provenance.auditEventId !== 'string' || !data.provenance.auditEventId.trim()
        || ![data.canonical.rcnPerSqft, data.canonical.rcndPerSqft, data.canonical.adjustedCostPerSqft,
          data.canonical.replacementCost, data.canonical.physicalDepreciation, data.canonical.conditionAdjustment,
          data.canonical.rcnld, data.canonical.landValue, data.canonical.totalValue].every(Number.isFinite))
        throw new Error('Canonical Cost response data or provenance is missing or mismatched.');
      setResult({ ...data, rcn: data.canonical.replacementCost, rcnld: data.canonical.rcnld,
        baseUnitCost: data.canonical.rcnPerSqft, localMultiplier: null, currentCostMult: null,
        rcnBeforeRef: null, refinementsTotal: null, ageYears: null, effectiveLifeYears: null, pctGood: null,
        scheduleSource: `git:${data.provenance.sourceCommit}`, calcMethod: 'Canonical Forge cost approach' });
    } catch (e) {
      if (stillCurrent()) setError(e instanceof Error ? e.message : 'Calculation failed');
    } finally {
      if (current === generation.current) setIsLoading(false);
    }
  }, []);

  return { result, isLoading, error, errorCorrelationId, calculate, reset };
}
