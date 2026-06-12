export type CountyRuntimeMode = 'runtime-enabled' | 'source-provenance-onboarding-intake';
export type CanonicalImportBoundary = false | 'not_applicable';

export interface CountyRuntimePosture {
  countyName: string;
  countySlug: string;
  state: 'WA';
  runtimeMode: CountyRuntimeMode;
  runtimeActionsAllowed: boolean;
  canonicalImportAllowed: CanonicalImportBoundary;
  sourcePosture: string;
  boundaryLabel: string;
  nextAction: string;
}

export const WASHINGTON_COUNTY_NAMES = [
  'Adams',
  'Asotin',
  'Benton',
  'Chelan',
  'Clallam',
  'Clark',
  'Columbia',
  'Cowlitz',
  'Douglas',
  'Ferry',
  'Franklin',
  'Garfield',
  'Grant',
  'Grays Harbor',
  'Island',
  'Jefferson',
  'King',
  'Kitsap',
  'Kittitas',
  'Klickitat',
  'Lewis',
  'Lincoln',
  'Mason',
  'Okanogan',
  'Pacific',
  'Pend Oreille',
  'Pierce',
  'San Juan',
  'Skagit',
  'Skamania',
  'Snohomish',
  'Spokane',
  'Stevens',
  'Thurston',
  'Wahkiakum',
  'Walla Walla',
  'Whatcom',
  'Whitman',
  'Yakima',
] as const;

function toCountySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+county$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toCountyName(value: string): string {
  const slug = toCountySlug(value);
  return WASHINGTON_COUNTY_NAMES.find((county) => toCountySlug(county) === slug) ?? value;
}

function buildPosture(countyName: string): CountyRuntimePosture {
  const countySlug = toCountySlug(countyName);
  const isBenton = countySlug === 'benton';

  if (isBenton) {
    return {
      countyName,
      countySlug,
      state: 'WA',
      runtimeMode: 'runtime-enabled',
      runtimeActionsAllowed: true,
      canonicalImportAllowed: 'not_applicable',
      sourcePosture:
        'Benton is already runtime-enabled: governed parcel runtime actions are allowed for the June 10 lane, and County Data Intake canonical import is not applicable.',
      boundaryLabel: 'Runtime-enabled county',
      nextAction: 'Use governed suite actions and keep runtime proof current.',
    };
  }

  return {
    countyName,
    countySlug,
    state: 'WA',
    runtimeMode: 'source-provenance-onboarding-intake',
    runtimeActionsAllowed: false,
    canonicalImportAllowed: false,
    sourcePosture:
      'Source/provenance/onboarding/intake only: runtime actions are blocked until county-specific ingestion and lineage proof are promoted.',
    boundaryLabel: 'County Data Intake',
    nextAction: 'Complete source provenance, onboarding, and intake proof before canonical import or runtime actions.',
  };
}

export const WASHINGTON_COUNTY_RUNTIME_POSTURES: readonly CountyRuntimePosture[] =
  WASHINGTON_COUNTY_NAMES.map(buildPosture);

export function getCountyRuntimePosture(countyId: string): CountyRuntimePosture {
  const countyName = toCountyName(countyId);
  return (
    WASHINGTON_COUNTY_RUNTIME_POSTURES.find((posture) => posture.countySlug === toCountySlug(countyName)) ??
    buildPosture(countyName)
  );
}
