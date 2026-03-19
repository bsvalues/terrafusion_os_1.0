/**
 * Phase 22 — Shell Chrome + Windowing Contract
 *
 * Enforces:
 *   1. Zero hardcoded z-depth Tailwind classes in governed shell files
 *   2. Suite windows open near-full-stage (not maximized)
 *   3. Property Workbench opens maximized
 *   4. OS feature windows open near-full-stage
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getModuleWindowSize } from '@/stores/desktopStore';

function readShellFile(relativePath: string): string {
  const fullPath = path.resolve(__dirname, '../..', relativePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

const Z_REGEX = /\bz-\d+\b|z-\[\d+\]/g;

describe('Phase 22: Shell Chrome Contract', () => {
  describe('Z-index enforcement', () => {
    const GOVERNED_FILES = [
      'shell/desktop/GenericModuleHost.tsx',
      'shell/desktop/Window.tsx',
      'shell/desktop/Taskbar.tsx',
      'shell/desktop/Desktop.tsx',
    ];

    it.each(GOVERNED_FILES)('%s has zero hardcoded z-depth classes', (file) => {
      const src = readShellFile(file);
      const matches = src.match(Z_REGEX) || [];
      expect(matches).toEqual([]);
    });
  });

  describe('Suite window sizing', () => {
    const SUITE_IDS = ['suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier', 'suite-gpt'];

    it.each(SUITE_IDS)('%s opens near-full-stage (not maximized)', (id) => {
      const result = getModuleWindowSize(id);
      expect(result.maximized).not.toBe(true);
      expect(result.size.width).toBeGreaterThan(0);
      expect(result.size.height).toBeGreaterThan(0);
    });
  });

  describe('Workbench sizing', () => {
    it('property-workbench opens maximized', () => {
      const result = getModuleWindowSize('property-workbench');
      expect(result.maximized).toBe(true);
      expect(result.size.width).toBeGreaterThan(0);
      expect(result.size.height).toBeGreaterThan(0);
    });
  });

  describe('OS feature sizing', () => {
    const OS_IDS = ['os-pilot', 'os-trace', 'os-canon'];

    it.each(OS_IDS)('%s opens near-full-stage', (id) => {
      const result = getModuleWindowSize(id);
      expect(result.maximized).not.toBe(true);
      expect(result.size.width).toBeGreaterThan(0);
      expect(result.size.height).toBeGreaterThan(0);
    });
  });
});
