import { describe, expect, it } from 'vitest';
import coverageProof from '../../../../../../os-platform/core/pilot/evidence/washington-39-county-coverage.latest.json';
import { WASHINGTON_COUNTIES } from '../../pages/forge/sales/washingtonLaunchApi';
import {
  getWashingtonPublicSourceInventory,
  matchesWashingtonPublicSourceQuery,
  WASHINGTON_PUBLIC_SOURCE_INVENTORY,
  WASHINGTON_PUBLIC_SOURCE_INVENTORY_GENERATED_AT,
  WASHINGTON_PUBLIC_SOURCE_INVENTORY_LIMITATION,
} from '../washingtonPublicSourceInventory';

describe('Washington public-source inventory projection', () => {
  it('maps all 39 canonical Washington counties to unique HTTPS official sources', () => {
    expect(WASHINGTON_PUBLIC_SOURCE_INVENTORY).toHaveLength(39);
    expect(new Set(
      WASHINGTON_PUBLIC_SOURCE_INVENTORY.map((entry) => entry.county.toLowerCase()),
    ).size).toBe(39);

    for (const county of WASHINGTON_COUNTIES) {
      const source = getWashingtonPublicSourceInventory(county.name);
      expect(source, `${county.name} public-source inventory`).not.toBeNull();
      expect(source!.countyCode).toBe(county.code);
      expect(new URL(source!.officialAssessorBaseUrl).protocol).toBe('https:');
      expect(source!.primarySalesSource.length).toBeGreaterThan(0);
      expect(source!.fallbackSource === null || source!.fallbackSource.length > 0).toBe(true);
      expect(source!.acquisitionFamily.length).toBeGreaterThan(0);
      expect(source!.gisMapSurface === null || source!.gisMapSurface.length > 0).toBe(true);
      expect(['adapter-ready', 'researched']).toContain(source!.status);
    }
  });

  it('matches canonical workflow guidance for Counties HUB search', () => {
    const spokane = getWashingtonPublicSourceInventory('Spokane');
    const adams = getWashingtonPublicSourceInventory('Adams');

    expect(matchesWashingtonPublicSourceQuery(spokane, ' SCOUT Sales Search ')).toBe(true);
    expect(matchesWashingtonPublicSourceQuery(spokane, 'scout map')).toBe(true);
    expect(matchesWashingtonPublicSourceQuery(adams, 'MapSifter/parcel detail')).toBe(true);
    expect(matchesWashingtonPublicSourceQuery(adams, 'invented workflow')).toBe(false);
    expect(matchesWashingtonPublicSourceQuery(null, 'SCOUT')).toBe(false);
    expect(matchesWashingtonPublicSourceQuery(spokane, '   ')).toBe(false);
  });

  it('matches the canonical core evidence fields consumed by the product', () => {
    expect(WASHINGTON_PUBLIC_SOURCE_INVENTORY_GENERATED_AT).toBe(coverageProof.generatedAtUtc);
    expect(WASHINGTON_PUBLIC_SOURCE_INVENTORY_LIMITATION).toBe(coverageProof.limitations[1]);

    const canonicalByCounty = new Map(
      coverageProof.counties.map((entry) => [entry.county, entry] as const),
    );
    for (const projected of WASHINGTON_PUBLIC_SOURCE_INVENTORY) {
      expect(projected).toEqual(expect.objectContaining({
        county: canonicalByCounty.get(projected.county)?.county,
        officialAssessorBaseUrl:
          canonicalByCounty.get(projected.county)?.officialAssessorBaseUrl,
        primarySalesSource: canonicalByCounty.get(projected.county)?.primarySalesSource,
        fallbackSource: canonicalByCounty.get(projected.county)?.fallbackSource,
        acquisitionFamily: canonicalByCounty.get(projected.county)?.acquisitionFamily,
        gisMapSurface: canonicalByCounty.get(projected.county)?.gisMapSurface,
        status: canonicalByCounty.get(projected.county)?.status,
      }));
    }
  });

  it('retains the evidence limitation instead of claiming runtime availability', () => {
    expect(WASHINGTON_PUBLIC_SOURCE_INVENTORY_LIMITATION).toMatch(
      /does not prove statewide ingestion, normalization, geometry, or endpoint runtime coverage/i,
    );
  });

  it('binds Kitsap to the current official assessor origin used by the public package', () => {
    expect(getWashingtonPublicSourceInventory('Kitsap')?.officialAssessorBaseUrl).toBe(
      'https://www.kitsap.gov/assessor/',
    );
  });
});
