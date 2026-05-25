/**
 * Phase 25 — Anti-Drift Verification + Governance Hardening
 *
 * Non-duplicative governance proofs:
 * - Launch/surface truth table (4 module types)
 * - Ownership contracts (dock, top bar, workbench)
 * - Registration completeness
 * - 2 canonical 3-clicks-to-value paths
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import { MODULE_OBJECT_TYPES } from '@/contracts/objectPlacement';
import { evaluateSpawnIntent, getModuleWindowSize } from '@/stores/desktopStore';
import { CONSTITUTIONAL_SUITES, OS_FEATURES, VALID_WORKBENCH_TAB_IDS } from '@/config/suiteRegistry';
import { isModuleRegistered, MODULE_REGISTRY } from '@/config/moduleComponents';

describe('Phase 25: Shell Anti-Drift Governance', () => {
  // =====================================================================
  // Launch/Surface Truth Table
  // =====================================================================
  describe('Launch/surface truth table', () => {
    it('suite-forge: opens standalone, near-full-stage', () => {
      const verdict = evaluateSpawnIntent('suite-forge');
      expect(verdict.decision).toBe('open');
      const size = getModuleWindowSize('suite-forge');
      expect(size.maximized).not.toBe(true);
    });

    it('property-workbench: opens standalone as a priority window', () => {
      const verdict = evaluateSpawnIntent('property-workbench');
      expect(verdict.decision).toBe('open');
      const size = getModuleWindowSize('property-workbench');
      expect(size.maximized).not.toBe(true);
    });

    it('os-pilot: opens standalone, near-full-stage', () => {
      const verdict = evaluateSpawnIntent('os-pilot');
      expect(verdict.decision).toBe('open');
      const size = getModuleWindowSize('os-pilot');
      expect(size.maximized).not.toBe(true);
    });

    it('forge (parcel-scoped): routes to workbench', () => {
      const verdict = evaluateSpawnIntent('forge');
      expect(verdict.decision).toBe('route-to-workbench');
    });
  });

  // =====================================================================
  // Ownership Contracts
  // =====================================================================
  describe('Ownership contracts', () => {
    it('dock has exactly 5 constitutional suites', () => {
      expect(CONSTITUTIONAL_SUITES).toHaveLength(5);
      const ids = CONSTITUTIONAL_SUITES.map((s) => s.id);
      expect(ids).toEqual(['forge', 'atlas', 'dais', 'dossier', 'gpt']);
    });

    it('workbench has exactly 11 tab IDs', () => {
      expect(VALID_WORKBENCH_TAB_IDS).toHaveLength(11);
      const expected = ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot', 'trace', 'current-use'];
      expect([...VALID_WORKBENCH_TAB_IDS].sort()).toEqual([...expected].sort());
    });

    it('top bar renders Clock, SentinelChip, NotificationBell', () => {
      const src = fs.readFileSync(
        path.resolve(__dirname, '../../shell/desktop/Desktop.tsx'), 'utf-8'
      );
      expect(src).toContain('SentinelChip');
      expect(src).toContain('Clock');
      expect(src).toMatch(/NotificationBell|TopBarNotifications/);
    });
  });

  // =====================================================================
  // Registration Completeness
  // =====================================================================
  describe('Registration completeness', () => {
    it.each(CONSTITUTIONAL_SUITES.map((s) => s.id))('suite-%s is registered', (id) => {
      expect(isModuleRegistered(`suite-${id}`)).toBe(true);
    });

    it.each(OS_FEATURES.map((f) => f.id))('os-%s is registered', (id) => {
      expect(isModuleRegistered(`os-${id}`)).toBe(true);
    });

    it('property-workbench is registered', () => {
      expect(isModuleRegistered('property-workbench')).toBe(true);
    });

    it('registry has >= 40 entries', () => {
      // MODULE_REGISTRY is a Set — use .size
      expect(MODULE_REGISTRY.size).toBeGreaterThanOrEqual(40);
    });
  });

  // =====================================================================
  // 3-Clicks-to-Value: Canonical Path Tests
  // =====================================================================
  describe('3-clicks-to-value canonical paths', () => {
    it('Path A: Dock -> Suite -> Workbench (exact payload: tabId=forge)', () => {
      // Click 1: Forge in dock -> opens suite
      const suiteVerdict = evaluateSpawnIntent('suite-forge');
      expect(suiteVerdict.decision).toBe('open');

      // Click 2+3: parcel-scoped forge -> routes to workbench
      const parcelVerdict = evaluateSpawnIntent('forge');
      expect(parcelVerdict.decision).toBe('route-to-workbench');

      // Verify forge is a valid workbench tab target
      expect(VALID_WORKBENCH_TAB_IDS).toContain('forge');

      // Verify workbench classification
      const wbEntry = MODULE_OBJECT_TYPES['property-workbench'];
      expect(wbEntry).toBeDefined();
      expect(wbEntry.objectType).toBe('tier0-workbench');
      expect(wbEntry.defaultPlacement).toBe('near-full-stage');
      expect(wbEntry.mustRemainMaximized).toBe(false);
    });

    it('Path B: Home -> Recent Parcel -> Workbench (OS-managed priority window)', () => {
      // Recent parcel click -> opens workbench
      const verdict = evaluateSpawnIntent('property-workbench');
      expect(verdict.decision).toBe('open');

      // Tier-0 defines operational importance, not immovable fullscreen behavior.
      const size = getModuleWindowSize('property-workbench');
      expect(size.maximized).not.toBe(true);

      const wbEntry = MODULE_OBJECT_TYPES['property-workbench'];
      expect(wbEntry.movable).toBe(true);
      expect(wbEntry.resizable).toBe(true);
      expect(wbEntry.restorable).toBe(true);
      expect(wbEntry.canMaximize).toBe(true);
      expect(wbEntry.mustRemainMaximized).toBe(false);

      // Verify default landing tab exists
      expect(VALID_WORKBENCH_TAB_IDS).toContain('summary');
    });
  });
});
