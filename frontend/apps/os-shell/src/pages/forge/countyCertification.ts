const CERTIFIED_LEGACY_COUNTY_TOKENS = new Set([
  '19190019191919191919191919191919',
  'benton',
]);

export interface CertifiedReferenceLane {
  id: string;
  label: string;
  endpoint: string;
  posture: 'reference-only';
  proofRole: 'excluded-from-statistics-parity';
}

const BENTON_MARKET_REFERENCE_LANE: CertifiedReferenceLane = {
  id: 'benton-certified-market-reference',
  label: 'Benton-certified market reference lane',
  endpoint: '/costforge/income-approach/market-data/benton', // reference-only; excluded-from-statistics-parity
  posture: 'reference-only',
  proofRole: 'excluded-from-statistics-parity',
};

export function normalizeCountyToken(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/\bcounty\b/g, '')
    .replace(/[\s_-]/g, '');
}

export function supportsCertifiedCostScheduleLane(
  countyId: string | null | undefined,
): boolean {
  return CERTIFIED_LEGACY_COUNTY_TOKENS.has(normalizeCountyToken(countyId));
}

export function getCertifiedMarketReferenceLane(
  countyId: string | null | undefined,
): CertifiedReferenceLane | null {
  return supportsCertifiedCostScheduleLane(countyId) ? BENTON_MARKET_REFERENCE_LANE : null;
}

export function supportsStatisticsAdvancedAnalysisLane(
  countyId: string | null | undefined,
): boolean {
  return CERTIFIED_LEGACY_COUNTY_TOKENS.has(normalizeCountyToken(countyId));
}

export function getCountyFileStem(countyId: string | null | undefined): string {
  const normalized = normalizeCountyToken(countyId);
  return normalized.length > 0 ? normalized : 'county';
}
