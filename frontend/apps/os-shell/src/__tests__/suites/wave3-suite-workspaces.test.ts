/**
 * Wave 3 — Suite Workspace Classification Contract
 *
 * Proves that all 4 constitutional suites (Forge, Atlas, Dais, Dossier)
 * are classified as 'suite-workspace' in the object placement contract.
 *
 * These tests enforce the ledger finding: no suite needs to be rebuilt —
 * they are already correctly typed. Any future mis-classification will
 * cause these tests to fail before it ships.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { MODULE_OBJECT_TYPES } from '../../contracts/objectPlacement';

const CONSTITUTIONAL_SUITES = [
  'suite-forge',
  'suite-atlas',
  'suite-dais',
  'suite-dossier',
] as const;

describe('Wave 3 — Suite Workspace Classification', () => {
  it.each(CONSTITUTIONAL_SUITES)(
    '%s is classified as suite-workspace in objectPlacement contract',
    (moduleId) => {
      const entry = MODULE_OBJECT_TYPES[moduleId];
      expect(entry, `${moduleId} must exist in MODULE_OBJECT_TYPES`).toBeDefined();
      expect(entry.objectType).toBe('suite-workspace');
    },
  );
});
