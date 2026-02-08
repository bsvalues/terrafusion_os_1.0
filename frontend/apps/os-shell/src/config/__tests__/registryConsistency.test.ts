import { MODULES } from '../modules';
import { ModuleRenderer } from '../moduleComponents';
import {
  CONSTITUTIONAL_SUITES,
  OS_FEATURES,
  getStandaloneSuites,
  getWorkbenchSuites,
  getQualifiedStandaloneSuites,
  isValidPrimaryAction,
  isValidWorkbenchTarget,
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
        expect(suite.id, `Suite missing id`).toBeTruthy();
        expect(suite.displayName, `Suite "${suite.id}" missing displayName`).toBeTruthy();
        expect(suite.shortName, `Suite "${suite.id}" missing shortName`).toBeTruthy();
        expect(suite.description, `Suite "${suite.id}" missing description`).toBeTruthy();
        expect(suite.iconName, `Suite "${suite.id}" missing iconName`).toBeTruthy();
        expect(suite.route, `Suite "${suite.id}" missing route`).toBeTruthy();
        expect(suite.color, `Suite "${suite.id}" missing color`).toBeTruthy();
        expect(['live', 'wip', 'planned']).toContain(suite.status);
      }
    });

    it('all workbench suites have valid workbenchTarget', () => {
      const workbenchSuites = getWorkbenchSuites();
      expect(workbenchSuites.length).toBeGreaterThan(0);

      for (const suite of workbenchSuites) {
        expect(suite.workbenchTab).toBe(true);
        expect(suite.workbenchTarget).toBeTruthy();
        expect(isValidWorkbenchTarget(suite.workbenchTarget)).toBe(true);
        expect(
          VALID_WORKBENCH_TAB_IDS,
          `Suite "${suite.id}" has invalid tabId: ${suite.workbenchTarget.tabId}`
        ).toContain(suite.workbenchTarget.tabId);
      }
    });
  });

  describe('OS features', () => {
    it('all OS features have required fields', () => {
      for (const feature of OS_FEATURES) {
        expect(feature.id, `Feature missing id`).toBeTruthy();
        expect(feature.displayName, `Feature "${feature.id}" missing displayName`).toBeTruthy();
        expect(feature.shortName, `Feature "${feature.id}" missing shortName`).toBeTruthy();
        expect(feature.description, `Feature "${feature.id}" missing description`).toBeTruthy();
        expect(feature.iconName, `Feature "${feature.id}" missing iconName`).toBeTruthy();
        expect(['live', 'wip', 'planned']).toContain(feature.status);
      }
    });

    it('live OS features with routes have homeMeta', () => {
      const liveWithRoute = OS_FEATURES.filter((f) => f.status === 'live' && f.route);

      for (const feature of liveWithRoute) {
        expect(feature.homeMeta, `Feature "${feature.id}" live with route but no homeMeta`).toBeTruthy();
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
        expect(suite.homeMeta.description, `Suite "${suite.id}" missing description`).toBeTruthy();
        expect(
          suite.homeMeta.primaryActions.length,
          `Suite "${suite.id}" must have >= 1 primary action`
        ).toBeGreaterThanOrEqual(1);

        // Each action should pass type guard
        for (const action of suite.homeMeta.primaryActions) {
          expect(isValidPrimaryAction(action), `Suite "${suite.id}" has invalid action`).toBe(true);
        }
      }
    });

    it('all current live standalone suites pass quality gate', () => {
      // CI gate: every live standalone must be qualified
      const standalones = getStandaloneSuites();
      const qualified = getQualifiedStandaloneSuites();

      // This is the CI enforcement: standalone count === qualified count
      expect(
        qualified.length,
        `${standalones.length - qualified.length} standalone suites fail quality gate`
      ).toBe(standalones.length);
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
        expect(suiteIds.has(id as any), `ID "${id}" exists in both suites and features`).toBe(false);
      }
    });
  });
});
