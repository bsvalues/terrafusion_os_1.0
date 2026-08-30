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
  primarySalesSource: string;
  fallbackSource: string | null;
  acquisitionFamily: string;
  gisMapSurface: string | null;
  status: WashingtonPublicSourceInventoryStatus;
}

export function matchesWashingtonPublicSourceQuery(
  entry: WashingtonPublicSourceInventoryEntry | null,
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!entry || !normalizedQuery) return false;

  return entry.acquisitionFamily.toLowerCase().includes(normalizedQuery)
    || entry.primarySalesSource.toLowerCase().includes(normalizedQuery)
    || entry.fallbackSource?.toLowerCase().includes(normalizedQuery) === true
    || entry.gisMapSurface?.toLowerCase().includes(normalizedQuery) === true;
}

function readNonEmptyText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
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
    primarySalesSource,
    fallbackSource,
    acquisitionFamily,
    gisMapSurface,
    status,
  }) => {
    const safeOfficialUrl = readHttpsUrl(officialAssessorBaseUrl);
    const safeCounty = readNonEmptyText(county);
    const safePrimarySalesSource = readNonEmptyText(primarySalesSource);
    const safeAcquisitionFamily = readNonEmptyText(acquisitionFamily);
    return safeOfficialUrl
      && safeCounty
      && safePrimarySalesSource
      && safeAcquisitionFamily
      && /^\d{3}$/.test(countyCode)
      && isInventoryStatus(status)
      ? [{
          county: safeCounty,
          countyCode,
          officialAssessorBaseUrl: safeOfficialUrl,
          primarySalesSource: safePrimarySalesSource,
          fallbackSource: readNonEmptyText(fallbackSource),
          acquisitionFamily: safeAcquisitionFamily,
          gisMapSurface: readNonEmptyText(gisMapSurface),
          status,
        }]
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
