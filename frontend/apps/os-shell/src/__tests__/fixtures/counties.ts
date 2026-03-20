/**
 * counties.ts — County test fixtures for multi-county isolation tests.
 *
 * Provides canonical AuthContextValue shapes for Benton and Cowlitz counties.
 * Use these in tests instead of inline county objects to keep test data DRY.
 *
 * @see auth/useAuthContext.ts (AuthContextValue)
 */
import type { AuthContextValue } from '../../auth/useAuthContext';

/** Benton County — primary assessor user (WA FIPS 005) */
export const BENTON_AUTH: AuthContextValue = {
  isAuthenticated: true,
  userId: 'benton-assessor-001',
  countyId: 'benton',
  roles: ['assessor'],
  token: 'fake-benton-token',
};

/** Benton County parcel GeoIDs */
export const BENTON_PARCEL_IDS = {
  residential: '1-0001-010-0010-000',
  commercial: '1-0200-100-0001-000',
  agricultural: '1-0500-200-0001-000',
} as const;

/** Cowlitz County — second county for isolation tests (WA FIPS 015) */
export const COWLITZ_AUTH: AuthContextValue = {
  isAuthenticated: true,
  userId: 'cowlitz-assessor-001',
  countyId: 'cowlitz',
  roles: ['assessor'],
  token: 'fake-cowlitz-token',
};

/** Cowlitz County parcel GeoIDs */
export const COWLITZ_PARCEL_IDS = {
  residential: '2-0001-010-0010-000',
  commercial: '2-0200-100-0001-000',
} as const;

/**
 * Mock pacsService responses keyed by countyId.
 * Use in vi.mock() factories to return county-appropriate data.
 */
export const PACS_RESPONSES_BY_COUNTY: Record<string, { items: object[]; totalCount: number }> = {
  benton: {
    items: [
      {
        geoId: BENTON_PARCEL_IDS.residential,
        address: '123 TULIP LN KENNEWICK WA 99336',
        assessedValue: 285000,
        marketValue: 310000,
        propertyType: 'Residential',
      },
    ],
    totalCount: 89247,
  },
  cowlitz: {
    items: [
      {
        geoId: COWLITZ_PARCEL_IDS.residential,
        address: '456 SPIRIT LAKE HWY CASTLE ROCK WA 98611',
        assessedValue: 198000,
        marketValue: 215000,
        propertyType: 'Residential',
      },
    ],
    totalCount: 44000, // approximate Cowlitz parcel count
  },
};
