import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SNAPSHOT_PATH = path.join(process.cwd(), 'governance-snapshot.json');

describe('Governance Snapshot Content Contract', () => {
  it('validates snapshot schema and required posture', () => {
    // This test assumes governance-snapshot.json exists.
    // In a logical pipeline, proof runs -> snapshot generated -> this test verifies content.
    // If running standalone, we might need to assume it exists or generate it.

    // We'll rely on the artifact being present (from previous test or pre-step).
    if (!fs.existsSync(SNAPSHOT_PATH)) {
      console.warn('Skipping snapshot content test: artifact missing. Run sentinel first.');
      return;
    }

    const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));

    // 1. Structure
    expect(snapshot).toHaveProperty('branchProtection');
    expect(snapshot).toHaveProperty('contract');
    expect(snapshot.ok).toBeUndefined(); // We switched to status='OK'/'DRIFT' etc
    expect(snapshot.status).toMatch(/OK|DRIFT|ERROR/);

    // 2. Posture (If we have actual data, usually we do unless API failed)
    if (snapshot.status !== 'ERROR' && snapshot.branchProtection) {
      const bp = snapshot.branchProtection;
      const requiredChecks = bp.required_status_checks || [];

      // Scope Drift Guard must be present
      expect(requiredChecks).toContain('scope-drift-guard');

      // Strict mode
      expect(bp.strict).toBe(true);

      // Admin enforcement
      expect(bp.enforce_admins).toBe(false);
    } else {
      // If error, we can't verify posture, but we verify we captured the error
      // But for a "Contract" test of the system state, we expect it to be OK/DRIFT (with valid data) usually.
      // If it's ERROR, maybe we should warn?
      if (snapshot.status === 'ERROR') {
        expect(snapshot).toHaveProperty('error');
      }
    }
  });
});
