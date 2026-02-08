/**
 * TerraFusion OS Launcher Description Truth Tests
 *
 * Ensures launcher item descriptions are derived from the single source of truth:
 * - Constitutional suites: description from SuiteDefinition
 * - OS features: description from homeMeta.description (when standalone-ready)
 *
 * Contract: No duplicate strings. Registry is the truth.
 *
 * @module __tests__/launcher/launcher.descriptionTruth.test
 * @see Slice 13: Suite Home Modules v1 + Cross-Surface Description Truth
 */

import { describe, expect, it } from 'vitest';

import { getLauncherItems } from '../../components/launcher/launcherModel';
import { CONSTITUTIONAL_SUITES, OS_FEATURES, getStandaloneSuites } from '../../config/suiteRegistry';

describe('Launcher Description Truth', () => {
  describe('constitutional suites use registry description', () => {
    it('all suite launcher items have descriptions matching registry', () => {
      const launcherItems = getLauncherItems();

      for (const suite of CONSTITUTIONAL_SUITES) {
        const launcherItem = launcherItems.find((item) => item.id === suite.id);
        
        // All constitutional suites should appear in launcher
        expect(launcherItem, `Suite "${suite.id}" not found in launcher`).toBeDefined();
        
        // Description should match registry exactly (single source of truth)
        expect(
          launcherItem?.description,
          `Suite "${suite.id}" launcher description doesn't match registry`
        ).toBe(suite.description);
      }
    });
  });

  describe('standalone OS features use homeMeta description', () => {
    it('all standalone feature launcher items derive description from homeMeta', () => {
      const launcherItems = getLauncherItems();
      const standaloneSuites = getStandaloneSuites();

      for (const feature of standaloneSuites) {
        const launcherItem = launcherItems.find((item) => item.id === feature.id);
        
        expect(launcherItem, `Feature "${feature.id}" not found in launcher`).toBeDefined();
        
        // For standalone suites with homeMeta.description, that's the truth
        // The launcher should use the same description (no duplication)
        const expectedDescription = feature.homeMeta?.description ?? feature.description;
        expect(
          launcherItem?.description,
          `Feature "${feature.id}" launcher description doesn't match registry`
        ).toBe(expectedDescription);
      }
    });

    it('OS features fallback to base description when homeMeta.description missing', () => {
      const launcherItems = getLauncherItems();

      for (const feature of OS_FEATURES) {
        const launcherItem = launcherItems.find((item) => item.id === feature.id);
        
        if (!launcherItem) continue; // Skip non-routable features
        
        // Must have some description
        expect(
          launcherItem.description,
          `Feature "${feature.id}" missing description in launcher`
        ).toBeTruthy();
        expect(launcherItem.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('no hardcoded duplicate strings', () => {
    it('launcher descriptions are not hardcoded constants', () => {
      // This test ensures we're not duplicating strings in launcherModel.ts
      // The source of truth is suiteRegistry, not hardcoded values
      
      const launcherItems = getLauncherItems();
      
      // Collect all registry descriptions
      const registryDescriptions = new Set([
        ...CONSTITUTIONAL_SUITES.map((s) => s.description),
        ...OS_FEATURES.map((f) => f.description),
        ...OS_FEATURES.filter((f) => f.homeMeta?.description).map((f) => f.homeMeta!.description!),
      ]);
      
      // Every launcher item description should come from registry
      // (except system actions which are defined in launcherModel)
      const nonSystemItems = launcherItems.filter((i) => i.intent !== 'system');
      
      for (const item of nonSystemItems) {
        expect(
          registryDescriptions.has(item.description),
          `Launcher item "${item.id}" has description not from registry: "${item.description}"`
        ).toBe(true);
      }
    });
  });

  describe('description consistency across surfaces', () => {
    it('same feature has consistent description across launcher and shell', () => {
      const launcherItems = getLauncherItems();
      const standaloneSuites = getStandaloneSuites();

      for (const suite of standaloneSuites) {
        const launcherItem = launcherItems.find((i) => i.id === suite.id);
        const shellDescription = suite.homeMeta?.description;
        
        if (launcherItem && shellDescription) {
          // If the shell has a description and so does the launcher,
          // they should be derived from the same source
          expect(
            launcherItem.description,
            `Feature "${suite.id}" has inconsistent descriptions between launcher and shell`
          ).toBe(shellDescription);
        }
      }
    });
  });
});
