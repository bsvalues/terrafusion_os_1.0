/**
 * Build-packaged read model of the assessor-source fields consumed by Counties HUB.
 * Canon remains the core coverage evidence named below; the parity test fails if
 * this projection drifts. Inventory posture never implies landed/runtime data.
 */

import inventoryData from './washingtonPublicSourceInventory.data.json';

export const WASHINGTON_PUBLIC_SOURCE_INVENTORY_EVIDENCE_PATH =
  inventoryData.evidencePath;

export const WASHINGTON_PUBLIC_SOURCE_INVENTORY_GENERATED_AT =
  inventoryData.generatedAt;

export const WASHINGTON_PUBLIC_SOURCE_INVENTORY_LIMITATION =
  inventoryData.limitation;

export type WashingtonPublicSourceInventoryStatus = 'adapter-ready' | 'researched';

export interface WashingtonPublicSourceInventoryEntry {
  county: string;
  countyCode: string;
  officialAssessorBaseUrl: string;
  acquisitionFamily: string;
  status: WashingtonPublicSourceInventoryStatus;
}

function readHttpsUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function isInventoryStatus(value: string): value is WashingtonPublicSourceInventoryStatus {
  return value === 'adapter-ready' || value === 'researched';
}

export const WASHINGTON_PUBLIC_SOURCE_INVENTORY = Object.freeze(
  inventoryData.counties.flatMap(({
    county,
    countyCode,
    officialAssessorBaseUrl,
    acquisitionFamily,
    status,
  }) => {
    const safeOfficialUrl = readHttpsUrl(officialAssessorBaseUrl);
    return safeOfficialUrl && /^\d{3}$/.test(countyCode) && isInventoryStatus(status)
      ? [{ county, countyCode, officialAssessorBaseUrl: safeOfficialUrl, acquisitionFamily, status }]
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
