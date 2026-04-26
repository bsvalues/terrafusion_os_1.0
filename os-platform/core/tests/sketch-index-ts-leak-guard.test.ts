import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Leak guard for components/sketch/index.ts (Phase 203 strict-coverage backfill).
 *
 * Distinct from index-ts-leak-guard.test.ts which covers
 * components/field/index.ts — both index.ts files are eligible for
 * strict coverage and need their own guards.
 */
describe('components/sketch/index.ts leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/components/sketch/index.ts'
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    // mutation-resistance contract requires label === basename(target).
    assertNoRawColorLeaks(content, { label: 'index.ts' });
  });
});
