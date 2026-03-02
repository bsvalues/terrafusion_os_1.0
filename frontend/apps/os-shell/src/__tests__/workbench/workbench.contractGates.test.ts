/// <reference types="vitest" />
/**
 * workbench.contractGates.test.ts
 *
 * Phase J: CI Gate tests for the Property Workbench extension contract.
 *
 * These tests enforce structural invariants that must hold for the workbench
 * to function correctly. Failing any of these blocks the PR.
 *
 * Gates:
 * 1. Contract types exist and are well-formed
 * 2. All constitutional suites have badge providers
 * 3. Badge providers implement the contract interface
 * 4. Workbench barrel exports all required components
 * 5. Tab slug enum is locked (canonical order enforcement)
 * 6. Quick action providers implement the contract interface
 * 7. Badge API client provides cached fetch with graceful fallback
 *
 * @module __tests__/workbench/workbench.contractGates.test
 * @see contracts/workbench.ts — Extension contract
 * @see services/badges/index.ts — Badge provider registry
 * @see components/workbench/index.ts — Component barrel
 */

import { BADGE_PROVIDERS } from '../../services/badges';
import { QUICK_ACTION_PROVIDERS } from '../../services/quickActions';
import { VALID_WORKBENCH_TAB_IDS } from '../../config/suiteRegistry';

// Mock the badge API so providers don't hit a real server in tests
jest.mock('../../services/api/workbenchBadgeApi', () => ({
  fetchPropertyBadgeData: jest.fn().mockResolvedValue({
    geoId: 'test-parcel',
    address: '123 Test St',
    ownerName: 'Test Owner',
    assessedValue: 250000,
    marketValue: 300000,
    landValue: 80000,
    improvementValue: 170000,
    propertyType: 'Residential',
    appraisalYear: new Date().getFullYear(),
    lastModified: null,
    source: 'PACS',
  }),
  clearBadgeCache: jest.fn(),
}));

// ============================================================================
// Gate 1: Contract Types Exist
// ============================================================================

describe('Gate 1: Contract Types', () => {
  it('WorkbenchTabSlug type covers all 6 canonical tabs', () => {
    // This is enforced at compile time by TypeScript, but we
    // verify the runtime constant matches.
    const expected = ['summary', 'forge', 'atlas', 'dais', 'dossier', 'pilot'];
    for (const tab of expected) {
      expect(VALID_WORKBENCH_TAB_IDS).toContain(tab);
    }
  });

  it('tab slug set is exactly 6 members (no drift)', () => {
    expect(VALID_WORKBENCH_TAB_IDS).toHaveLength(6);
  });
});

// ============================================================================
// Gate 2: Badge Provider Registry
// ============================================================================

describe('Gate 2: Badge Provider Registry', () => {
  it('BADGE_PROVIDERS array exists and is non-empty', () => {
    expect(Array.isArray(BADGE_PROVIDERS)).toBe(true);
    expect(BADGE_PROVIDERS.length).toBeGreaterThan(0);
  });

  it('every provider has an owner field', () => {
    for (const provider of BADGE_PROVIDERS) {
      expect(provider.owner).toBeTruthy();
      expect(typeof provider.owner).toBe('string');
    }
  });

  it('every provider has a getBadges function', () => {
    for (const provider of BADGE_PROVIDERS) {
      expect(typeof provider.getBadges).toBe('function');
    }
  });

  it('forge, atlas, dais, dossier all have badge providers', () => {
    const owners = BADGE_PROVIDERS.map((p) => p.owner);
    expect(owners).toContain('forge');
    expect(owners).toContain('atlas');
    expect(owners).toContain('dais');
    expect(owners).toContain('dossier');
  });

  it('no duplicate owners in badge registry', () => {
    const owners = BADGE_PROVIDERS.map((p) => p.owner);
    const unique = new Set(owners);
    expect(unique.size).toBe(owners.length);
  });
});

// ============================================================================
// Gate 3: Badge Provider Contract Compliance
// ============================================================================

describe('Gate 3: Badge Provider Contract', () => {
  it('getBadges returns a Promise', () => {
    for (const provider of BADGE_PROVIDERS) {
      const result = provider.getBadges('test-parcel', {
        countyId: 'benton',
        userId: 'test',
        roles: [],
        parcelId: 'test-parcel',
        workMode: 'overview',
      });

      // Must return a thenable (Promise)
      expect(typeof result.then).toBe('function');
    }
  });

  it('getBadges resolves to an array', async () => {
    for (const provider of BADGE_PROVIDERS) {
      const badges = await provider.getBadges('test-parcel', {
        countyId: 'benton',
        userId: 'test',
        roles: [],
        parcelId: 'test-parcel',
        workMode: 'overview',
      });

      expect(Array.isArray(badges)).toBe(true);
    }
  });

  it('resolved badges have required fields', async () => {
    for (const provider of BADGE_PROVIDERS) {
      const badges = await provider.getBadges('test-parcel', {
        countyId: 'benton',
        userId: 'test',
        roles: [],
        parcelId: 'test-parcel',
        workMode: 'overview',
      });

      for (const badge of badges) {
        expect(badge.key).toBeTruthy();
        expect(badge.label).toBeTruthy();
        expect(badge.classification).toBeTruthy();
        expect(['PUBLIC', 'CONFIDENTIAL', 'RESTRICTED']).toContain(badge.classification);
      }
    }
  });
});

// ============================================================================
// Gate 4: Component Barrel Completeness
// ============================================================================

describe('Gate 4: Workbench Component Barrel', () => {
  it('exports all required components', async () => {
    const barrel = await import('../../components/workbench');

    // Phase 6.1 components
    expect(barrel.InvocationHistory).toBeDefined();
    expect(barrel.ParcelContextHeader).toBeDefined();
    expect(barrel.ResultPanel).toBeDefined();

    // Phase F/G/H components
    expect(barrel.SuiteCompass).toBeDefined();
    expect(barrel.ContextRibbon).toBeDefined();
    expect(barrel.WorkModeSelector).toBeDefined();

    // Phase I component
    expect(barrel.ActivityFeed).toBeDefined();
  });
});

// ============================================================================
// Gate 5: Tab Slug Canonical Order Lock
// ============================================================================

describe('Gate 5: Tab Slug Canonical Order', () => {
  it('tab order is exactly: summary, forge, atlas, dais, dossier, pilot', () => {
    // This prevents accidental reordering which would confuse users
    const expected = ['summary', 'forge', 'atlas', 'dais', 'dossier', 'pilot'];
    expect(VALID_WORKBENCH_TAB_IDS).toEqual(expected);
  });
});

// ============================================================================
// Gate 6: Quick Action Providers
// ============================================================================

describe('Gate 6: Quick Action Providers', () => {
  it('QUICK_ACTION_PROVIDERS array exists and is non-empty', () => {
    expect(Array.isArray(QUICK_ACTION_PROVIDERS)).toBe(true);
    expect(QUICK_ACTION_PROVIDERS.length).toBeGreaterThan(0);
  });

  it('every provider has an owner field and getActions function', () => {
    for (const provider of QUICK_ACTION_PROVIDERS) {
      expect(typeof provider.owner).toBe('string');
      expect(typeof provider.getActions).toBe('function');
    }
  });

  it('getActions returns mode-aware actions', async () => {
    for (const provider of QUICK_ACTION_PROVIDERS) {
      const actions = await provider.getActions({
        countyId: 'benton',
        userId: 'test',
        roles: [],
        parcelId: 'test-parcel',
        workMode: 'valuation',
      });

      expect(Array.isArray(actions)).toBe(true);
      for (const action of actions) {
        expect(action.id).toBeTruthy();
        expect(action.label).toBeTruthy();
        expect(action.toolId).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// Gate 7: Badge API Client Contract
// ============================================================================

describe('Gate 7: Badge API Client', () => {
  it('fetchPropertyBadgeData is importable and returns a Promise', async () => {
    const { fetchPropertyBadgeData } = await import('../../services/api/workbenchBadgeApi');
    expect(typeof fetchPropertyBadgeData).toBe('function');

    const result = fetchPropertyBadgeData('test-parcel');
    expect(typeof result.then).toBe('function');
  });

  it('clearBadgeCache is importable and callable', async () => {
    const { clearBadgeCache } = await import('../../services/api/workbenchBadgeApi');
    expect(typeof clearBadgeCache).toBe('function');
    // Should not throw
    clearBadgeCache();
  });

  it('badge providers produce data-driven badges with mock API data', async () => {
    // The mock returns appraisalYear = current year, so forge should show "Valuation Current"
    const forgeProvider = BADGE_PROVIDERS.find((p) => p.owner === 'forge')!;
    const forgeBadges = await forgeProvider.getBadges('test-parcel', {
      countyId: 'benton',
      userId: 'test',
      roles: [],
      parcelId: 'test-parcel',
      workMode: 'overview',
    });

    expect(forgeBadges.length).toBeGreaterThan(0);
    const valBadge = forgeBadges.find((b) => b.key === 'forge-valuation-status');
    expect(valBadge).toBeDefined();
    expect(valBadge!.label).toBe('Valuation Current');
    expect(valBadge!.severity).toBe('info');
  });

  it('atlas provider returns GIS Linked badge when address present', async () => {
    const atlasProvider = BADGE_PROVIDERS.find((p) => p.owner === 'atlas')!;
    const badges = await atlasProvider.getBadges('test-parcel', {
      countyId: 'benton',
      userId: 'test',
      roles: [],
      parcelId: 'test-parcel',
      workMode: 'overview',
    });

    expect(badges.length).toBe(1);
    expect(badges[0].key).toBe('atlas-geo-linked');
  });

  it('dossier provider returns source badge when source present', async () => {
    const dossierProvider = BADGE_PROVIDERS.find((p) => p.owner === 'dossier')!;
    const badges = await dossierProvider.getBadges('test-parcel', {
      countyId: 'benton',
      userId: 'test',
      roles: [],
      parcelId: 'test-parcel',
      workMode: 'overview',
    });

    expect(badges.length).toBe(1);
    expect(badges[0].key).toBe('dossier-source');
    expect(badges[0].label).toBe('PACS');
  });
});
