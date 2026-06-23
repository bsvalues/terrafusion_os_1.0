/**
 * CanonRuntimeStatusPanel — drift-proof contract.
 *
 * The panel displays STATIC copy mirroring the Canon runtime's source of truth.
 * Static copy that silently drifts from Canon law would undermine governance,
 * so this contract fails the build if the panel's listed canon-owned paths or
 * gates no longer match the runtime config/scripts on disk.
 *
 * Source of truth:
 *   - canon-owned paths: owners canon-runtime + canon-gates in
 *     os-platform/core/canon/engineering-write-lanes.json
 *   - gates: the gate scripts in os-platform/core/gates/
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CANON_OWNED_PATHS, GATES } from '../../canon/CanonRuntimeStatusPanel';

// repo root = six levels up from this test's dir
// (ui-observability → __tests__ → src → os-shell → apps → frontend → ROOT)
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');

describe('CanonRuntimeStatusPanel drift contract', () => {
  it('listed canon-owned paths match the write-lane source of truth', () => {
    const lanesPath = path.join(REPO_ROOT, 'os-platform/core/canon/engineering-write-lanes.json');
    const { lanes } = JSON.parse(fs.readFileSync(lanesPath, 'utf8'));
    const ownedFromSource = lanes
      .filter((l: { owner: string }) => l.owner === 'canon-runtime' || l.owner === 'canon-gates')
      .flatMap((l: { paths: string[] }) => l.paths)
      .sort();
    expect([...CANON_OWNED_PATHS].sort()).toEqual(ownedFromSource);
  });

  it('listed gates map to real gate scripts on disk', () => {
    const gatesDir = path.join(REPO_ROOT, 'os-platform/core/gates');
    const files = fs.readdirSync(gatesDir);
    const scriptForGate: Record<string, string> = {
      'write-lane': 'canon-write-lane-check.mjs',
      'protected-paths': 'check-protected-paths.mjs',
      'hardcoded-ports': 'check-hardcoded-ports.mjs',
    };
    for (const gate of GATES) {
      expect(scriptForGate[gate], `panel lists unknown gate "${gate}"`).toBeDefined();
      expect(files).toContain(scriptForGate[gate]);
    }
  });
});
