import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Governance Sentinel Resilience', () => {
  // We execute the actual script with a forced failpoint
  // This ensures that the try/catch blocks in `main` correctly catch the error
  // and write the artifact even when the core logic explodes.

  it('writes snapshot with error when FAILPOINT is triggered', () => {
    // Run in a temp directory to avoid race conditions with other tests/artifacts
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-sentinel-test-'));
    const snapshotAbs = path.join(tempDir, 'governance-snapshot.json');
    const scriptPath = path.join(__dirname, '../governanceSentinel.js');

    try {
      // execute script with FAILPOINT env var
      const result = spawnSync('node', [scriptPath], {
        cwd: tempDir, // Script writes to CWD
        env: { ...process.env, TF_GOV_FAILPOINT: '1' },
        encoding: 'utf-8',
      });

      // 1. Exit code should be non-zero (ERROR => 2)
      expect(result.status).toBe(2);

      // 2. Stdout/Stderr should reflect error
      const output = (result.stdout || '') + (result.stderr || '');
      expect(output).toContain('FAILPOINT: forced failure for contract test');

      // 3. Artifact MUST be written
      expect(fs.existsSync(snapshotAbs)).toBe(true);

      // 4. Content verification
      const snapshot = JSON.parse(fs.readFileSync(snapshotAbs, 'utf-8'));
      expect(snapshot.status).toBe('ERROR');
      expect(snapshot.error).toContain('FAILPOINT');
      expect(snapshot.timestamp).toBeDefined();
    } finally {
      // Cleanup
      try {
        if (fs.existsSync(snapshotAbs)) fs.unlinkSync(snapshotAbs);
        fs.rmdirSync(tempDir);
      } catch (e) {
        console.error('Failed to clean up temp dir:', e);
      }
    }
  });
});
