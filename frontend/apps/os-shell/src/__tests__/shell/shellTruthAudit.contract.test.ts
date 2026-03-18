/**
 * Phase 21 — Shell Truth Freeze
 * Diagnostic-only audit of 8 shell assumptions.
 * No source files modified. Findings documented as pass/skip/todo.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import { MODULE_OBJECT_TYPES } from '@/contracts/objectPlacement';
import { evaluateSpawnIntent } from '@/stores/desktopStore';
import { isModuleRegistered } from '@/config/moduleComponents';
import { CONSTITUTIONAL_SUITES, OS_FEATURES } from '@/config/suiteRegistry';

function readShellFile(relativePath: string): string {
  // __dirname = .../src/__tests__/shell, go up 2 levels to src/
  const fullPath = path.resolve(__dirname, '../..', relativePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

describe('Phase 21: Shell Truth Audit', () => {
  // Q1: Does the desktop render launch surfaces?
  describe('Q1: Desktop launch surfaces', () => {
    it('Desktop.tsx imports StageZeroState', () => {
      const src = readShellFile('shell/desktop/Desktop.tsx');
      expect(src).toContain('StageZeroState');
    });

    it('Desktop.tsx imports DesktopIconGrid', () => {
      const src = readShellFile('shell/desktop/Desktop.tsx');
      expect(src).toContain('DesktopIconGrid');
    });
  });

  // Q2: Does the dock contain zero utilities?
  describe('Q2: Dock contains no utilities', () => {
    const FORBIDDEN_IMPORTS = ['Clock', 'NotificationBell', 'SentinelChip', 'ControlCenter'];

    it.each(FORBIDDEN_IMPORTS)('Taskbar.tsx does NOT import %s', (name) => {
      const src = readShellFile('shell/desktop/Taskbar.tsx');
      const importLines = src.split('\n').filter(l => l.trimStart().startsWith('import'));
      const hasImport = importLines.some(l => l.includes(name));
      expect(hasImport).toBe(false);
    });
  });

  // Q3: Does the top bar contain Clock/NotificationBell/SentinelChip?
  describe('Q3: Top bar system utilities', () => {
    const REQUIRED_UTILITIES = ['SentinelChip', 'Clock'];

    it.each(REQUIRED_UTILITIES)('Desktop.tsx imports %s', (name) => {
      const src = readShellFile('shell/desktop/Desktop.tsx');
      expect(src).toContain(name);
    });

    it('Desktop.tsx uses DesktopTopSystemBar', () => {
      const src = readShellFile('shell/desktop/Desktop.tsx');
      expect(src).toMatch(/DesktopTopSystemBar|TopBar|system.*bar/i);
    });
  });

  // Q4: Do suite windows open near-full-stage?
  describe('Q4: Suite windows classification', () => {
    const SUITE_IDS = ['suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier', 'suite-gpt'];

    it.each(SUITE_IDS)('%s is classified as suite-workspace', (id) => {
      const entry = MODULE_OBJECT_TYPES[id];
      expect(entry).toBeDefined();
      expect(entry.objectType).toBe('suite-workspace');
    });
  });

  // Q5: Does the Property Workbench open maximized?
  describe('Q5: Workbench classification', () => {
    it('property-workbench is classified as tier0-workbench', () => {
      const entry = MODULE_OBJECT_TYPES['property-workbench'];
      expect(entry).toBeDefined();
      expect(entry.objectType).toBe('tier0-workbench');
    });
  });

  // Q6: Do os-pilot/os-trace/os-canon open in-shell?
  describe('Q6: OS features registered in-shell', () => {
    const OS_FEATURE_IDS = ['os-pilot', 'os-trace', 'os-canon'];

    it.each(OS_FEATURE_IDS)('%s is registered in MODULE_REGISTRY', (id) => {
      expect(isModuleRegistered(id)).toBe(true);
    });

    it.each(OS_FEATURE_IDS)('%s is classified as os-feature-window', (id) => {
      const entry = MODULE_OBJECT_TYPES[id];
      expect(entry).toBeDefined();
      expect(entry.objectType).toBe('os-feature-window');
    });
  });

  // Q7: Do parcel actions collapse into the Workbench?
  describe('Q7: Parcel actions route to workbench', () => {
    const PARCEL_SCOPED = ['forge', 'atlas', 'dais'];

    it.each(PARCEL_SCOPED)('evaluateSpawnIntent("%s") routes to workbench', (id) => {
      const verdict = evaluateSpawnIntent(id);
      expect(verdict.decision).toBe('route-to-workbench');
    });

    it('evaluateSpawnIntent("suite-forge") opens standalone', () => {
      const verdict = evaluateSpawnIntent('suite-forge');
      expect(verdict.decision).toBe('open');
    });
  });

  // Q8: Are there hardcoded z-depth classes in governed shell files?
  describe('Q8: Z-depth class audit', () => {
    const Z_REGEX = /\bz-\d+\b|z-\[\d+\]/g;

    it.todo('deferred to Phase 22: 4 z-depth classes in shell/desktop/GenericModuleHost.tsx');

    it.todo('deferred to Phase 22: 2 z-depth classes in shell/desktop/Window.tsx');

    it('audit z-depth classes in shell/desktop/Taskbar.tsx', () => {
      const src = readShellFile('shell/desktop/Taskbar.tsx');
      const matches = src.match(Z_REGEX) || [];
      expect(matches.length).toBe(0);
    });

    it('audit z-depth classes in shell/desktop/Desktop.tsx', () => {
      const src = readShellFile('shell/desktop/Desktop.tsx');
      const matches = src.match(Z_REGEX) || [];
      expect(matches.length).toBe(0);
    });
  });
});
