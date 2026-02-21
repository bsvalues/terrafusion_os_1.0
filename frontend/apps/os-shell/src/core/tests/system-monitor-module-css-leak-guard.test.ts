/**
 * Leak-guard: SystemMonitor.module.css
 *
 * Uses the shared assertNoRawColorLeaks() helper to detect
 * raw #hex, rgb/rgba, and numeric hsl/hsla in the stylesheet.
 * Tokenised hsl(var(--tf-*) / ...) patterns are allowed.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { assertNoRawColorLeaks } from '../../tools/ui-tokens/leak-guard';

const TARGET = resolve(
  __dirname,
  '../../components/admin/SystemMonitor.module.css',
);

describe('SystemMonitor.module.css – token leak guard', () => {
  it('contains no raw color values', () => {
    const content = readFileSync(TARGET, 'utf-8');
    assertNoRawColorLeaks(content, { label: 'SystemMonitor.module.css' });
  });
});
