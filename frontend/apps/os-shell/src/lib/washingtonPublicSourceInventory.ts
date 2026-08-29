/**
 * Build-packaged read model of the assessor-source fields consumed by Counties HUB.
 * Canon remains the core coverage evidence named below; the parity test fails if
 * this projection drifts. Inventory posture never implies landed/runtime data.
 */

export const WASHINGTON_PUBLIC_SOURCE_INVENTORY_EVIDENCE_PATH =
  'os-platform/core/pilot/evidence/washington-39-county-coverage.latest.json';

export const WASHINGTON_PUBLIC_SOURCE_INVENTORY_GENERATED_AT =
  '2026-04-29T17:16:08.237Z';

export const WASHINGTON_PUBLIC_SOURCE_INVENTORY_LIMITATION =
  'This proves registry coverage and acquisition-path inventory only; it does not prove statewide ingestion, normalization, geometry, or endpoint runtime coverage.';

export type WashingtonPublicSourceInventoryStatus = 'adapter-ready' | 'researched';

export interface WashingtonPublicSourceInventoryEntry {
  county: string;
  officialAssessorBaseUrl: string;
  acquisitionFamily: string;
  status: WashingtonPublicSourceInventoryStatus;
}

const PACKAGED_PUBLIC_SOURCE_ROWS = [
  ['Adams', 'https://co.adams.wa.us', 'Parcel transfer history', 'researched'],
  ['Asotin', 'https://co.asotin.wa.us', 'Direct sales search', 'adapter-ready'],
  ['Benton', 'https://co.benton.wa.us', 'Direct sales search', 'adapter-ready'],
  ['Chelan', 'https://co.chelan.wa.us', 'Direct sales search', 'adapter-ready'],
  ['Clallam', 'https://clallamcountywa.gov', 'Direct sales search', 'adapter-ready'],
  ['Clark', 'https://clark.wa.gov', 'Direct sales search', 'adapter-ready'],
  ['Columbia', 'https://columbiaco.com', 'Monthly sales report', 'adapter-ready'],
  ['Cowlitz', 'https://www.co.cowlitz.wa.us', 'Parcel transfer history', 'adapter-ready'],
  ['Douglas', 'https://www.douglascountywa.gov', 'Monthly report / parcel history', 'adapter-ready'],
  ['Ferry', 'https://www.ferry-county.com', 'Parcel transfer history', 'adapter-ready'],
  ['Franklin', 'https://www.franklincountywa.gov', 'Parcel transfer history', 'adapter-ready'],
  ['Garfield', 'https://www.co.garfield.wa.us', 'Direct sales search', 'adapter-ready'],
  ['Grant', 'https://www.grantcountywa.gov', 'Direct sales search', 'adapter-ready'],
  ['Grays Harbor', 'https://www.co.grays-harbor.wa.us', 'Direct sales search', 'adapter-ready'],
  ['Island', 'https://www.islandcountywa.gov', 'Direct sales search', 'adapter-ready'],
  ['Jefferson', 'https://www.co.jefferson.wa.us', 'Direct sales search', 'adapter-ready'],
  ['King', 'https://kingcounty.gov', 'Direct sales search', 'adapter-ready'],
  ['Kitsap', 'https://www.kitsapgov.com', 'Parcel transfer history / open data export', 'adapter-ready'],
  ['Kittitas', 'https://www.co.kittitas.wa.us', 'Direct sales search', 'adapter-ready'],
  ['Klickitat', 'https://www.klickitatcounty.org', 'Monthly sales report', 'adapter-ready'],
  ['Lewis', 'https://lewiscountywa.gov', 'Monthly sales report', 'adapter-ready'],
  ['Lincoln', 'https://www.co.lincoln.wa.us', 'Direct sales search', 'adapter-ready'],
  ['Mason', 'https://masoncountywa.gov', 'Monthly sales report', 'adapter-ready'],
  ['Okanogan', 'https://okanogancounty.org', 'Direct sales search', 'adapter-ready'],
  ['Pacific', 'https://www.co.pacific.wa.us', 'Parcel transfer history', 'researched'],
  ['Pend Oreille', 'https://www.pendoreilleco.org', 'Direct sales search', 'adapter-ready'],
  ['Pierce', 'https://www.co.pierce.wa.us', 'Direct sales search', 'adapter-ready'],
  ['San Juan', 'https://www.sanjuanco.com', 'Direct sales search', 'adapter-ready'],
  ['Skagit', 'https://skagitcounty.net', 'Direct sales search', 'adapter-ready'],
  ['Skamania', 'https://www.skamaniacounty.org', 'Direct sales search', 'adapter-ready'],
  ['Snohomish', 'https://snohomishcountywa.gov', 'Direct sales search', 'adapter-ready'],
  ['Spokane', 'https://www.spokanecounty.org', 'Direct sales search', 'adapter-ready'],
  ['Stevens', 'https://stevenscountywa.gov', 'Direct sales search', 'adapter-ready'],
  ['Thurston', 'https://www.co.thurston.wa.us', 'Parcel transfer history', 'adapter-ready'],
  ['Wahkiakum', 'https://www.co.wahkiakum.wa.us', 'Parcel transfer history', 'researched'],
  ['Walla Walla', 'https://www.co.walla-walla.wa.us', 'Direct sales search', 'adapter-ready'],
  ['Whatcom', 'https://www.co.whatcom.wa.us', 'Direct sales search', 'adapter-ready'],
  ['Whitman', 'https://www.whitmancounty.org', 'Parcel transfer history', 'researched'],
  ['Yakima', 'https://www.yakimacounty.us', 'Direct sales search', 'adapter-ready'],
] as const satisfies readonly (readonly [
  county: string,
  officialAssessorBaseUrl: string,
  acquisitionFamily: string,
  status: WashingtonPublicSourceInventoryStatus,
])[];

function readHttpsUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export const WASHINGTON_PUBLIC_SOURCE_INVENTORY = Object.freeze(
  PACKAGED_PUBLIC_SOURCE_ROWS.flatMap(([
    county,
    officialAssessorBaseUrl,
    acquisitionFamily,
    status,
  ]) => {
    const safeOfficialUrl = readHttpsUrl(officialAssessorBaseUrl);
    return safeOfficialUrl
      ? [{ county, officialAssessorBaseUrl: safeOfficialUrl, acquisitionFamily, status }]
      : [];
  }),
);

function normalizeCountyName(value: string): string {
  return value.replace(/\s+county$/i, '').trim().toLowerCase();
}

const inventoryByCountyName = new Map(
  WASHINGTON_PUBLIC_SOURCE_INVENTORY.map((entry) => [
    normalizeCountyName(entry.county),
    entry,
  ] as const),
);

export function getWashingtonPublicSourceInventory(
  countyName: string,
): WashingtonPublicSourceInventoryEntry | null {
  return inventoryByCountyName.get(normalizeCountyName(countyName)) ?? null;
}
