import {
  getComparableCountyCode,
  getComparableCountyName,
} from '@/services/comparableSalesService';

export type RollupScope = 'city' | 'neighborhood' | null;

export interface RollupHandoffContext {
  countyCode: string | null;
  countyName: string | null;
  taxYear: number | null;
  city: string | null;
  neighborhoodCode: string | null;
  neighborhoodName: string | null;
  revalArea: number | null;
  rollupScope: RollupScope;
  resetValuationScope: boolean;
  segmentId: string | null;
  segmentLabel: string | null;
  stratumKey: string | null;
  sampleParcelIds: string[];
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readRollupScope(value: unknown): RollupScope {
  return value === 'city' || value === 'neighborhood' ? value : null;
}

function readBoolean(value: unknown): boolean {
  return value === true || value === 'true';
}

function readSampleParcelIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => readString(entry))
      .filter((entry): entry is string => entry !== null);
  }
  const text = readString(value);
  if (!text) return [];
  return text
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function parseRollupHandoff(metadata?: Record<string, unknown>): RollupHandoffContext {
  const countySource =
    readString(metadata?.countyCode)
    ?? readString(metadata?.countyName)
    ?? null;
  const countyCode = countySource ? getComparableCountyCode(countySource) : null;

  return {
    countyCode,
    countyName: countySource ? getComparableCountyName(countySource) : null,
    taxYear: readNumber(metadata?.taxYear),
    city: readString(metadata?.city),
    neighborhoodCode: readString(metadata?.neighborhoodCode),
    neighborhoodName: readString(metadata?.neighborhoodName),
    revalArea: readNumber(metadata?.revalArea),
    rollupScope: readRollupScope(metadata?.rollupScope),
    resetValuationScope: readBoolean(metadata?.resetValuationScope),
    segmentId: readString(metadata?.segmentId),
    segmentLabel: readString(metadata?.segmentLabel),
    stratumKey: readString(metadata?.stratumKey),
    sampleParcelIds: readSampleParcelIds(metadata?.sampleParcelIds),
  };
}
