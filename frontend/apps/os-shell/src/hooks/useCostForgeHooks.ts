// TerraFusion OS — Mined from terra-forge-rebuild CostForge Hooks
// Bridges CostForge RCNLD calculation into React Query for component use.
// REST-adapted: calls POST /api/costforge/calculate for RCNLD.

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { apiFetch } from '../lib/apiBase';

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
}

export interface CostForgeSecondaryFeature {
  code: string;
  description: string;
  value: number;
}

export interface CostForgeResult {
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
  const [result, setResult] = useState<CostForgeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (
    input: CostForgeCalcInput,
    qualityGrade: QualityGrade = 'Average',
    extWallType = 'Metal or Vinyl Siding',
    effectiveLifeYears = 45,
    headers?: Record<string, string>,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/costforge/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ ...input, qualityGrade, extWallType, effectiveLifeYears }),
      });
      if (!res.ok) throw new Error(`RCNLD calculation failed: ${res.status}`);
      setResult(await res.json() as CostForgeResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, calculate, reset };
}
