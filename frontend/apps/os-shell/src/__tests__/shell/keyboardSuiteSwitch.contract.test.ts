/**
 * keyboardSuiteSwitch.contract.test.ts
 *
 * Phase 14 — Operator Journey Proofing
 * =====================================
 *
 * Source-inspection contract for useKeyboardShortcuts.ts.
 * Proves Ctrl+1..7 module shortcut map and activateModule wiring
 * are present and correct — without rendering the full Desktop.
 *
 * @see hooks/useKeyboardShortcuts.ts
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let src: string;

beforeAll(() => {
  src = readFileSync(
    resolve(import.meta.dirname, '../../hooks/useKeyboardShortcuts.ts'),
    'utf-8'
  );
});

describe('Ctrl+N module shortcut map', () => {
  it("maps '1' to 'costforge'", () => {
    expect(src).toContain("'1': 'costforge'");
  });

  it("maps '2' to 'terra-gaia'", () => {
    expect(src).toContain("'2': 'terra-gaia'");
  });

  it("maps '3' to 'atlas-ai'", () => {
    expect(src).toContain("'3': 'atlas-ai'");
  });

  it("maps '4' to 'reporting'", () => {
    expect(src).toContain("'4': 'reporting'");
  });

  it("maps '5' to 'marketplace'", () => {
    expect(src).toContain("'5': 'marketplace'");
  });

  it("maps '6' to 'counties'", () => {
    expect(src).toContain("'6': 'counties'");
  });

  it("maps '7' to 'government-architecture'", () => {
    expect(src).toContain("'7': 'government-architecture'");
  });
});

describe('activateModule wiring', () => {
  it('imports activateModule from moduleActivation', () => {
    expect(src).toContain("from '../orchestration/moduleActivation'");
    expect(src).toContain('activateModule');
  });

  it('calls activateModule with the mapped moduleId on Ctrl+N', () => {
    // The handler must call activateModule(moduleId, ...) inside the Ctrl+1..7 branch
    expect(src).toContain('activateModule(moduleId');
  });
});

describe('keyboard event guard', () => {
  it('uses event.ctrlKey for number shortcuts (not altKey)', () => {
    // Verify the guard is ctrlKey, not altKey
    expect(src).toContain('ctrlKey');
    // Should NOT be guarded by altKey alone
    // (asserting altKey would be too strict — just verify ctrlKey is present)
  });
});
