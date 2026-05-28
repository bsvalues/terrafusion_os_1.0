import type { CountySegmentDto } from '../types/countyStudio.types';

export type RiskSurfaceType =
  | 'revalCycle'
  | 'neighborhood'
  | 'modelGroup'
  | 'taxingDistrict'
  | 'valueTier';

export type RiskLevel = 'Critical' | 'High' | 'Moderate' | 'Healthy';

export interface RiskSurfaceRow {
  key: string;
  label: string;
  type: RiskSurfaceType;
  segmentCount: number;
  parcelCount: number;
  ratioCount: number;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  prb: number | null;
  exceptionCount: number;
  riskScore: number;
  riskLevel: RiskLevel;
  primaryReason: string;
  action: string;
  evidenceSegmentId: string | null;
  context: {
    revalCycle?: string;
    marketArea?: string;
    neighborhood?: string;
    modelGroup?: string;
    propertyClass?: string;
    valueTier?: string;
    taxingDistrict?: string;
  };
}

export interface UnifiedRiskLedgerRow extends RiskSurfaceRow {
  rank: number;
  nextAction: string;
}

export interface RiskSurfaceCommandCenter {
  boards: {
    revaluationCycles: RiskSurfaceRow[];
    neighborhoods: RiskSurfaceRow[];
    modelGroups: RiskSurfaceRow[];
    districtExposure: RiskSurfaceRow[];
    valueTiers: RiskSurfaceRow[];
  };
  ledger: UnifiedRiskLedgerRow[];
  contractGaps: string[];
}

interface GroupAccumulator {
  key: string;
  label: string;
  type: RiskSurfaceType;
  segments: CountySegmentDto[];
  context: RiskSurfaceRow['context'];
}

type GroupKeySelector = (segment: CountySegmentDto) => { key: string; label: string; context?: RiskSurfaceRow['context'] } | null;

function numeric(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function round(value: number | null, digits = 2): number | null {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function weightedAverage(
  segments: CountySegmentDto[],
  selector: (segment: CountySegmentDto) => number | null | undefined,
): number | null {
  let weightedTotal = 0;
  let weightTotal = 0;

  for (const segment of segments) {
    const value = numeric(selector(segment));
    if (value === null) continue;
    const weight = Math.max(1, numeric(segment.ratioCount) ?? numeric(segment.salesCount) ?? segment.parcelCount);
    weightedTotal += value * weight;
    weightTotal += weight;
  }

  return weightTotal > 0 ? weightedTotal / weightTotal : null;
}

function sum(segments: CountySegmentDto[], selector: (segment: CountySegmentDto) => number | null | undefined): number {
  return segments.reduce((total, segment) => total + (numeric(selector(segment)) ?? 0), 0);
}

function normalizeLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function riskLevel(score: number): RiskLevel {
  if (score >= 75) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 35) return 'Moderate';
  return 'Healthy';
}

function primaryReason(row: Pick<RiskSurfaceRow, 'cod' | 'prd' | 'prb' | 'medianRatio' | 'exceptionCount' | 'riskScore'>): string {
  if (row.cod !== null && row.cod > 20) return `COD ${row.cod.toFixed(1)}`;
  if (row.prd !== null && (row.prd < 0.98 || row.prd > 1.03)) return `PRD ${row.prd.toFixed(2)}`;
  if (row.prb !== null && Math.abs(row.prb) > 0.10) return `PRB ${row.prb.toFixed(2)}`;
  if (row.medianRatio !== null && (row.medianRatio < 0.90 || row.medianRatio > 1.10)) {
    return `Median ${row.medianRatio.toFixed(2)}`;
  }
  if (row.exceptionCount > 0) return `${row.exceptionCount} exceptions`;
  return `Risk ${Math.round(row.riskScore)}`;
}

function actionFor(type: RiskSurfaceType): string {
  switch (type) {
    case 'revalCycle':
      return 'Audit cycle strata';
    case 'neighborhood':
      return 'Drill parcel evidence';
    case 'modelGroup':
      return 'Review model calibration';
    case 'taxingDistrict':
      return 'Review district exposure';
    case 'valueTier':
      return 'Audit vertical equity';
    default:
      return 'Review evidence';
  }
}

function nextActionFor(type: RiskSurfaceType): string {
  switch (type) {
    case 'neighborhood':
      return 'Open neighborhood evidence';
    case 'modelGroup':
      return 'Open model group evidence';
    case 'revalCycle':
      return 'Open revaluation cycle evidence';
    case 'taxingDistrict':
      return 'Open district exposure evidence';
    case 'valueTier':
      return 'Open value tier equity evidence';
    default:
      return 'Open parcel evidence';
  }
}

function strongestEvidenceSegment(segments: CountySegmentDto[]): CountySegmentDto | null {
  return [...segments].sort((a, b) => b.riskScore - a.riskScore)[0] ?? null;
}

function buildRows(
  segments: CountySegmentDto[],
  type: RiskSurfaceType,
  selectGroup: GroupKeySelector,
): RiskSurfaceRow[] {
  const groups = new Map<string, GroupAccumulator>();

  for (const segment of segments) {
    const selected = selectGroup(segment);
    if (!selected) continue;
    const existing = groups.get(selected.key);
    if (existing) {
      existing.segments.push(segment);
      continue;
    }
    groups.set(selected.key, {
      key: selected.key,
      label: selected.label,
      type,
      segments: [segment],
      context: selected.context ?? {},
    });
  }

  return [...groups.values()]
    .map((group) => {
      const evidence = strongestEvidenceSegment(group.segments);
      const ratioCount = sum(group.segments, (segment) => segment.ratioCount ?? segment.salesCount ?? 0);
      const row = {
        key: group.key,
        label: group.label,
        type: group.type,
        segmentCount: group.segments.length,
        parcelCount: sum(group.segments, (segment) => segment.parcelCount),
        ratioCount,
        medianRatio: round(weightedAverage(group.segments, (segment) => segment.medianRatio), 3),
        cod: round(weightedAverage(group.segments, (segment) => segment.cod), 1),
        prd: round(weightedAverage(group.segments, (segment) => segment.prd), 3),
        prb: round(weightedAverage(group.segments, (segment) => segment.prb), 3),
        exceptionCount: sum(group.segments, (segment) => segment.exceptionCount),
        riskScore: Math.round(weightedAverage(group.segments, (segment) => segment.riskScore) ?? 0),
        riskLevel: 'Healthy' as RiskLevel,
        primaryReason: '',
        action: actionFor(group.type),
        evidenceSegmentId: evidence?.segmentId ?? null,
        context: group.context,
      };
      row.riskLevel = riskLevel(row.riskScore);
      row.primaryReason = primaryReason(row);
      return row;
    })
    .sort(compareRiskRows);
}

function compareRiskRows(a: RiskSurfaceRow, b: RiskSurfaceRow): number {
  if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
  const typeDelta = riskSurfacePriority(a.type) - riskSurfacePriority(b.type);
  if (typeDelta !== 0) return typeDelta;
  if (b.parcelCount !== a.parcelCount) return b.parcelCount - a.parcelCount;
  return a.label.localeCompare(b.label);
}

function riskSurfacePriority(type: RiskSurfaceType): number {
  switch (type) {
    case 'neighborhood':
      return 1;
    case 'modelGroup':
      return 2;
    case 'valueTier':
      return 3;
    case 'revalCycle':
      return 4;
    case 'taxingDistrict':
      return 5;
    default:
      return 10;
  }
}

function modelGroupLabel(segment: CountySegmentDto): string | null {
  const explicit = normalizeLabel(segment.modelGroup);
  if (explicit) return explicit;

  const buildingType = normalizeLabel(segment.buildingType);
  const qualityGrade = normalizeLabel(segment.qualityGrade);
  if (!buildingType && !qualityGrade) return null;
  return [buildingType, qualityGrade].filter(Boolean).join(' / ');
}

export function buildRiskSurfaceCommandCenter(segments: CountySegmentDto[]): RiskSurfaceCommandCenter {
  const revaluationCycles = buildRows(segments, 'revalCycle', (segment) => {
    if (segment.revalArea === null || segment.revalArea === undefined) return null;
    const key = String(segment.revalArea);
    return { key, label: `Cycle ${key}`, context: { revalCycle: key } };
  });

  const neighborhoods = buildRows(segments, 'neighborhood', (segment) => {
    const key = normalizeLabel(segment.geographyRef);
    if (!key) return null;
    return { key, label: `Neighborhood ${key}`, context: { neighborhood: key } };
  });

  const modelGroups = buildRows(segments, 'modelGroup', (segment) => {
    const key = modelGroupLabel(segment);
    if (!key) return null;
    return { key, label: key, context: { modelGroup: key, propertyClass: normalizeLabel(segment.propertyClass) ?? undefined } };
  });

  const districtExposure = buildRows(segments, 'taxingDistrict', (segment) => {
    const key = normalizeLabel(segment.taxingDistrict);
    if (!key) return null;
    return { key, label: key, context: { taxingDistrict: key } };
  });

  const valueTiers = buildRows(segments, 'valueTier', (segment) => {
    const key = normalizeLabel(segment.valueTier);
    if (!key) return null;
    return { key, label: key, context: { valueTier: key } };
  });

  const contractGaps: string[] = [];
  if (segments.length > 0 && districtExposure.length === 0) {
    contractGaps.push('No taxing district field is available on active segments.');
  }
  if (segments.length > 0 && valueTiers.length === 0) {
    contractGaps.push('No value tier field is available on active segments.');
  }

  const allRows = [
    ...revaluationCycles,
    ...neighborhoods,
    ...modelGroups,
    ...districtExposure,
    ...valueTiers,
  ].sort(compareRiskRows);

  return {
    boards: {
      revaluationCycles,
      neighborhoods,
      modelGroups,
      districtExposure,
      valueTiers,
    },
    ledger: allRows.map((row, index) => ({
      ...row,
      rank: index + 1,
      nextAction: nextActionFor(row.type),
    })),
    contractGaps,
  };
}
