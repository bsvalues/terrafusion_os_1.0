import { ModuleRenderer } from '../moduleComponents';
import { MODULES } from '../modules';
import {
    CONSTITUTIONAL_SUITES,
    getQualifiedStandaloneSuites,
    getStandaloneSuites,
    getWorkbenchSuites,
    isValidPrimaryAction,
    isValidWorkbenchTarget,
    OS_FEATURES,
    VALID_WORKBENCH_TAB_IDS,
} from '../suiteRegistry';

describe('registry consistency', () => {
  it('every module has an entry', () => {
    for (const module of MODULES) {
      expect(module.id).toBeTruthy();
      expect(module.entry).toBeTruthy();
    }
  });

  it('renderer accepts module without throwing', () => {
    expect(() => ModuleRenderer({ module: MODULES[0] })).not.toThrow();
  });
});

// ============================================================================
// Slice 12: Suite Registry Quality Invariants
// ============================================================================

describe('suiteRegistry quality invariants', () => {
  describe('constitutional suites', () => {
    it('all constitutional suites have required fields', () => {
      for (const suite of CONSTITUTIONAL_SUITES) {
        if (!suite.id) throw new Error(`Suite missing id`);
        expect(suite.id).toBeTruthy();
        if (!suite.displayName) throw new Error(`Suite "${suite.id}" missing displayName`);
        expect(suite.displayName).toBeTruthy();
        if (!suite.shortName) throw new Error(`Suite "${suite.id}" missing shortName`);
        expect(suite.shortName).toBeTruthy();
        if (!suite.description) throw new Error(`Suite "${suite.id}" missing description`);
        expect(suite.description).toBeTruthy();
        if (!suite.iconName) throw new Error(`Suite "${suite.id}" missing iconName`);
        expect(suite.iconName).toBeTruthy();
        if (!suite.route) throw new Error(`Suite "${suite.id}" missing route`);
        expect(suite.route).toBeTruthy();
        if (!suite.color) throw new Error(`Suite "${suite.id}" missing color`);
        expect(suite.color).toBeTruthy();
        expect(['live', 'queued', 'unavailable']).toContain(suite.status);
      }
    });

    it('all workbench suites have valid workbenchTarget', () => {
      const workbenchSuites = getWorkbenchSuites();
      expect(workbenchSuites.length).toBeGreaterThan(0);

      for (const suite of workbenchSuites) {
        expect(suite.workbenchTab).toBe(true);
        expect(suite.workbenchTarget).toBeTruthy();
        expect(isValidWorkbenchTarget(suite.workbenchTarget)).toBe(true);
        if (!VALID_WORKBENCH_TAB_IDS.includes(suite.workbenchTarget.tabId)) {
          throw new Error(`Suite "${suite.id}" has invalid tabId: ${suite.workbenchTarget.tabId}`);
        }
        expect(VALID_WORKBENCH_TAB_IDS).toContain(suite.workbenchTarget.tabId);
      }
    });
  });

  describe('OS features', () => {
    it('all OS features have required fields', () => {
      for (const feature of OS_FEATURES) {
        if (!feature.id) throw new Error(`Feature missing id`);
        expect(feature.id).toBeTruthy();
        if (!feature.displayName) throw new Error(`Feature "${feature.id}" missing displayName`);
        expect(feature.displayName).toBeTruthy();
        if (!feature.shortName) throw new Error(`Feature "${feature.id}" missing shortName`);
        expect(feature.shortName).toBeTruthy();
        if (!feature.description) throw new Error(`Feature "${feature.id}" missing description`);
        expect(feature.description).toBeTruthy();
        if (!feature.iconName) throw new Error(`Feature "${feature.id}" missing iconName`);
        expect(feature.iconName).toBeTruthy();
        expect(['live', 'queued', 'unavailable']).toContain(feature.status);
      }
    });

    it('live OS features with routes have homeMeta', () => {
      const liveWithRoute = OS_FEATURES.filter((f) => f.status === 'live' && f.route);

      for (const feature of liveWithRoute) {
        if (!feature.homeMeta) {
          throw new Error(`Feature "${feature.id}" live with route but no homeMeta`);
        }
        expect(feature.homeMeta).toBeTruthy();
      }
    });
  });

  describe('standalone suite quality gate', () => {
    it('getStandaloneSuites returns only live features with route and homeMeta', () => {
      const standalones = getStandaloneSuites();

      for (const suite of standalones) {
        expect(suite.status).toBe('live');
        expect(suite.route).toBeTruthy();
        expect(suite.homeMeta).toBeTruthy();
        expect(suite.homeMeta.title).toBeTruthy();
      }
    });

    it('getQualifiedStandaloneSuites returns suites with description and actions', () => {
      const qualified = getQualifiedStandaloneSuites();

      // Qualified must be subset of standalone
      const standalones = getStandaloneSuites();
      expect(qualified.length).toBeLessThanOrEqual(standalones.length);

      for (const suite of qualified) {
        if (!suite.homeMeta.description) {
          throw new Error(`Suite "${suite.id}" missing description`);
        }
        expect(suite.homeMeta.description).toBeTruthy();
        if (suite.homeMeta.primaryActions.length < 1) {
          throw new Error(`Suite "${suite.id}" must have >= 1 primary action`);
        }
        expect(suite.homeMeta.primaryActions.length).toBeGreaterThanOrEqual(1);

        // Each action should pass type guard
        for (const action of suite.homeMeta.primaryActions) {
          if (!isValidPrimaryAction(action)) {
            throw new Error(`Suite "${suite.id}" has invalid action`);
          }
          expect(isValidPrimaryAction(action)).toBe(true);
        }
      }
    });

    it('all current live standalone suites pass quality gate', () => {
      // CI gate: every live standalone must be qualified
      const standalones = getStandaloneSuites();
      const qualified = getQualifiedStandaloneSuites();

      // This is the CI enforcement: standalone count === qualified count
      if (qualified.length !== standalones.length) {
        throw new Error(`${standalones.length - qualified.length} standalone suites fail quality gate`);
      }
      expect(qualified.length).toBe(standalones.length);
    });
  });

  describe('unique identifiers', () => {
    it('all suite ids are unique', () => {
      const ids = CONSTITUTIONAL_SUITES.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all OS feature ids are unique', () => {
      const ids = OS_FEATURES.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('suite ids do not overlap with OS feature ids', () => {
      const suiteIds = new Set(CONSTITUTIONAL_SUITES.map((s) => s.id));
      const featureIds = new Set(OS_FEATURES.map((f) => f.id));

      for (const id of featureIds) {
        if (suiteIds.has(id as any)) {
          throw new Error(`ID "${id}" exists in both suites and features`);
        }
        expect(suiteIds.has(id as any)).toBe(false);
      }
    });
  });
});
