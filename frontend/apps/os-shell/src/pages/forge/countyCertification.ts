const CERTIFIED_LEGACY_COUNTY_TOKENS = new Set([
  '19190019191919191919191919191919',
  'benton',
]);

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

export function supportsStatisticsAdvancedAnalysisLane(
  countyId: string | null | undefined,
): boolean {
  return CERTIFIED_LEGACY_COUNTY_TOKENS.has(normalizeCountyToken(countyId));
}

export function getCountyFileStem(countyId: string | null | undefined): string {
  const normalized = normalizeCountyToken(countyId);
  return normalized.length > 0 ? normalized : 'county';
}
