import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Leak guard for EmergencyTerraFusionTest.tsx (Phase 117).
 * Test/diagnostic component with inline style cyan alphas — all HS-anchored.
 */
describe('EmergencyTerraFusionTest.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/components/emergency/EmergencyTerraFusionTest.tsx'
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'EmergencyTerraFusionTest.tsx' });
  });
});
