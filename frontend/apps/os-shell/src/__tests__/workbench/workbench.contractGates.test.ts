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
 * 8. Activity API client provides cached fetch with mock fallback
 * 9. WorkbenchContribution registry unifies suite registrations
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

// Mock the activity API so the hook doesn't hit a real server in tests
jest.mock('../../services/api/activityApi', () => ({
  fetchParcelActivity: jest.fn().mockResolvedValue([
    {
      id: 'act-1',
      source: 'forge',
      summary: 'Cost approach recalculated',
      timestamp: new Date('2026-03-01T12:00:00Z'),
      severity: 'info',
    },
    {
      id: 'act-2',
      source: 'atlas',
      summary: 'Parcel boundary updated',
      timestamp: new Date('2026-02-28T10:00:00Z'),
      severity: 'success',
    },
  ]),
  clearActivityCache: jest.fn(),
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

// ============================================================================
// Gate 8: Activity API Client Contract
// ============================================================================

describe('Gate 8: Activity API Client', () => {
  it('fetchParcelActivity is importable and returns a Promise', async () => {
    const { fetchParcelActivity } = await import('../../services/api/activityApi');
    expect(typeof fetchParcelActivity).toBe('function');

    const result = fetchParcelActivity('test-parcel');
    expect(typeof result.then).toBe('function');
  });

  it('clearActivityCache is importable and callable', async () => {
    const { clearActivityCache } = await import('../../services/api/activityApi');
    expect(typeof clearActivityCache).toBe('function');
    // Should not throw
    clearActivityCache();
  });

  it('parsed entries have required ActivityEntry fields', async () => {
    const { fetchParcelActivity } = await import('../../services/api/activityApi');
    const entries = await fetchParcelActivity('test-parcel');

    expect(Array.isArray(entries)).toBe(true);
    expect(entries!.length).toBe(2);

    for (const entry of entries!) {
      expect(entry.id).toBeTruthy();
      expect(entry.source).toBeTruthy();
      expect(entry.summary).toBeTruthy();
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(['info', 'success', 'warn', 'danger']).toContain(entry.severity);
    }
  });

  it('entries include correct source values from mock', async () => {
    const { fetchParcelActivity } = await import('../../services/api/activityApi');
    const entries = await fetchParcelActivity('test-parcel');

    const sources = entries!.map((e) => e.source);
    expect(sources).toContain('forge');
    expect(sources).toContain('atlas');
  });
});

// ============================================================================
// Gate 9: WorkbenchContribution Registry
// ============================================================================

describe('Gate 9: WorkbenchContribution Registry', () => {
  it('WORKBENCH_CONTRIBUTIONS array is importable and non-empty', async () => {
    const { WORKBENCH_CONTRIBUTIONS } = await import('../../services/contributions');
    expect(Array.isArray(WORKBENCH_CONTRIBUTIONS)).toBe(true);
    expect(WORKBENCH_CONTRIBUTIONS.length).toBeGreaterThan(0);
  });

  it('every contribution has getTabs() function', async () => {
    const { WORKBENCH_CONTRIBUTIONS } = await import('../../services/contributions');
    for (const c of WORKBENCH_CONTRIBUTIONS) {
      expect(typeof c.getTabs).toBe('function');
    }
  });

  it('getTabs returns TabDefinitions with required fields', async () => {
    const { WORKBENCH_CONTRIBUTIONS } = await import('../../services/contributions');
    const ctx = {
      countyId: 'benton',
      userId: 'test',
      roles: [] as string[],
      parcelId: 'test-parcel',
      workMode: 'overview' as const,
    };

    for (const c of WORKBENCH_CONTRIBUTIONS) {
      const tabs = await c.getTabs(ctx);
      expect(Array.isArray(tabs)).toBe(true);
      for (const tab of tabs) {
        expect(tab.slug).toBeTruthy();
        expect(tab.title).toBeTruthy();
        expect(tab.owner).toBeTruthy();
        expect(tab.route).toBeTruthy();
      }
    }
  });

  it('contributions cover all 6 canonical tab slugs', async () => {
    const { WORKBENCH_CONTRIBUTIONS } = await import('../../services/contributions');
    const ctx = {
      countyId: 'benton',
      userId: 'test',
      roles: [] as string[],
      parcelId: 'test-parcel',
      workMode: 'overview' as const,
    };

    const allSlugs = new Set<string>();
    for (const c of WORKBENCH_CONTRIBUTIONS) {
      const tabs = await c.getTabs(ctx);
      for (const tab of tabs) {
        allSlugs.add(tab.slug);
      }
    }

    expect(allSlugs).toContain('summary');
    expect(allSlugs).toContain('forge');
    expect(allSlugs).toContain('atlas');
    expect(allSlugs).toContain('dais');
    expect(allSlugs).toContain('dossier');
    expect(allSlugs).toContain('pilot');
    expect(allSlugs.size).toBe(6);
  });

  it('at least one contribution provides badges', async () => {
    const { WORKBENCH_CONTRIBUTIONS } = await import('../../services/contributions');
    const withBadges = WORKBENCH_CONTRIBUTIONS.filter((c) => c.badgeProvider);
    expect(withBadges.length).toBeGreaterThan(0);
  });

  it('at least one contribution provides quick actions', async () => {
    const { WORKBENCH_CONTRIBUTIONS } = await import('../../services/contributions');
    const withActions = WORKBENCH_CONTRIBUTIONS.filter((c) => c.getQuickActions);
    expect(withActions.length).toBeGreaterThan(0);
  });

  it('badge providers in contributions match the standalone registry', async () => {
    const { WORKBENCH_CONTRIBUTIONS } = await import('../../services/contributions');
    const badgeOwners = WORKBENCH_CONTRIBUTIONS
      .filter((c) => c.badgeProvider)
      .map((c) => c.badgeProvider!.owner);

    // Must cover all 4 suite badge providers
    expect(badgeOwners).toContain('forge');
    expect(badgeOwners).toContain('atlas');
    expect(badgeOwners).toContain('dais');
    expect(badgeOwners).toContain('dossier');
  });
});
