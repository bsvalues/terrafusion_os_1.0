/**
 * TerraFusion OS Standalone Homes Minimum Useful Modules Tests
 *
 * Enforces that every qualified standalone suite has a baseline set of modules:
 * - At least 2 modules per suite
 * - At least one module of kind 'info'
 * - At least one module of kind 'actions'
 *
 * Contract: CI fails if a live standalone suite doesn't meet minimum module bar.
 *
 * @module __tests__/standalone/standaloneHomes.modules.minimumUseful.test
 * @see Slice 14: Module Adoption v1 for Constitutional Suites
 */

import { describe, expect, it } from 'vitest';

import { MODULE_KINDS } from '../../components/standalone/standaloneHomeContracts';
import { getQualifiedStandaloneSuites, OS_FEATURES } from '../../config/suiteRegistry';

// ============================================================================
// Minimum Useful Modules Enforcement
// ============================================================================

describe('Standalone Homes Minimum Useful Modules', () => {
  describe('module count requirements', () => {
    it('all qualified standalone suites have >= 2 modules', () => {
      const suites = getQualifiedStandaloneSuites();

      // Ensure we have suites to test
      expect(suites.length).toBeGreaterThan(0);

      for (const suite of suites) {
        const modules = suite.homeMeta?.modules ?? [];
        expect(
          modules.length,
          `Suite "${suite.id}" must have at least 2 modules, has ${modules.length}`
        ).toBeGreaterThanOrEqual(2);
      }
    });

    it('live standalone suites all have modules defined', () => {
      const liveSuites = OS_FEATURES.filter((f) => f.status === 'live' && f.route && f.homeMeta);

      for (const suite of liveSuites) {
        expect(
          suite.homeMeta?.modules,
          `Live suite "${suite.id}" must define modules array`
        ).toBeDefined();
        expect(
          Array.isArray(suite.homeMeta?.modules),
          `Live suite "${suite.id}" modules must be an array`
        ).toBe(true);
      }
    });
  });

  describe('module kind requirements', () => {
    it('all qualified suites have at least one info module', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const modules = suite.homeMeta?.modules ?? [];
        const hasInfoModule = modules.some((m) => m.kind === 'info');

        expect(hasInfoModule, `Suite "${suite.id}" must have at least one 'info' module`).toBe(
          true
        );
      }
    });

    it('all qualified suites have at least one actions module', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const modules = suite.homeMeta?.modules ?? [];
        const hasActionsModule = modules.some((m) => m.kind === 'actions');

        expect(
          hasActionsModule,
          `Suite "${suite.id}" must have at least one 'actions' module`
        ).toBe(true);
      }
    });

    it('all modules have valid kind from MODULE_KINDS enum', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const modules = suite.homeMeta?.modules ?? [];

        for (const mod of modules) {
          expect(
            MODULE_KINDS.includes(mod.kind as (typeof MODULE_KINDS)[number]),
            `Suite "${suite.id}" module "${mod.id}" has invalid kind: ${mod.kind}`
          ).toBe(true);
        }
      }
    });
  });

  describe('module quality invariants', () => {
    it('all module ids are unique within each suite', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const modules = suite.homeMeta?.modules ?? [];
        const ids = modules.map((m) => m.id);
        const uniqueIds = new Set(ids);

        expect(
          uniqueIds.size,
          `Suite "${suite.id}" has duplicate module ids: ${ids.join(', ')}`
        ).toBe(ids.length);
      }
    });

    it('all module titles are non-empty', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const modules = suite.homeMeta?.modules ?? [];

        for (const mod of modules) {
          expect(mod.title, `Suite "${suite.id}" module "${mod.id}" missing title`).toBeTruthy();
          expect(
            mod.title.length,
            `Suite "${suite.id}" module "${mod.id}" has empty title`
          ).toBeGreaterThan(0);
        }
      }
    });

    it('all module ids are non-empty', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const modules = suite.homeMeta?.modules ?? [];

        for (const mod of modules) {
          expect(mod.id, `Suite "${suite.id}" has module with empty id`).toBeTruthy();
          expect(
            mod.id.length,
            `Suite "${suite.id}" has module with empty id string`
          ).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('module content baseline', () => {
    it('info modules provide meaningful overview', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const modules = suite.homeMeta?.modules ?? [];
        const infoModules = modules.filter((m) => m.kind === 'info');

        for (const mod of infoModules) {
          // Info modules should have stable, descriptive titles
          expect(
            mod.title.length,
            `Suite "${suite.id}" info module "${mod.id}" title too short`
          ).toBeGreaterThan(3);
        }
      }
    });

    it('actions modules provide actionable entry points', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const modules = suite.homeMeta?.modules ?? [];
        const actionsModules = modules.filter((m) => m.kind === 'actions');

        for (const mod of actionsModules) {
          // Actions modules should have clear titles
          expect(
            mod.title.length,
            `Suite "${suite.id}" actions module "${mod.id}" title too short`
          ).toBeGreaterThan(3);
        }
      }
    });
  });
});
