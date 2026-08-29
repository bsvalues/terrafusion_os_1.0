import { describe, expect, it } from 'vitest';
import coverageProof from '../../../../../../os-platform/core/pilot/evidence/washington-39-county-coverage.latest.json';
import { WASHINGTON_COUNTIES } from '../../pages/forge/sales/washingtonLaunchApi';
import {
  getWashingtonPublicSourceInventory,
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
      expect(new URL(source!.officialAssessorBaseUrl).protocol).toBe('https:');
      expect(source!.acquisitionFamily.length).toBeGreaterThan(0);
      expect(['adapter-ready', 'researched']).toContain(source!.status);
    }
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
        acquisitionFamily: canonicalByCounty.get(projected.county)?.acquisitionFamily,
        status: canonicalByCounty.get(projected.county)?.status,
      }));
    }
  });

  it('retains the evidence limitation instead of claiming runtime availability', () => {
    expect(WASHINGTON_PUBLIC_SOURCE_INVENTORY_LIMITATION).toMatch(
      /does not prove statewide ingestion, normalization, geometry, or endpoint runtime coverage/i,
    );
  });
});
