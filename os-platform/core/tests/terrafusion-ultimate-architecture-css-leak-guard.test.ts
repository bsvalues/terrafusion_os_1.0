import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Leak guard for terrafusion-ultimate-architecture.css (Phase 131).
 * Legacy architecture theme must stay tokenized with no raw color literals.
 */
describe('terrafusion-ultimate-architecture.css leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/styles/terrafusion-ultimate-architecture.css'
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, {
      label: 'terrafusion-ultimate-architecture.css',
    });
  });
});
