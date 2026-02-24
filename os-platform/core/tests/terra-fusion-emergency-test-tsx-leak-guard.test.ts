import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Phase 135 leak guard — TerraFusionEmergencyTest.tsx
 * Tests/demos often sneak in literal status colors and neutral alphas.
 */
describe('TerraFusionEmergencyTest.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const repoRoot = process.cwd();
    const rel = 'frontend/apps/os-shell/src/components/emergency/TerraFusionEmergencyTest.tsx';

    const filePath = path.join(repoRoot, rel);
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'TerraFusionEmergencyTest.tsx' });
  });
});
