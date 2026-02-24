import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Phase 122 leak guard — SystemGptConsoleView.tsx
 * Console UIs regress fast (literal greens/cyans + neutral overlays).
 *
 * Policy: zero raw colors. Tokens only.
 */
describe('SystemGptConsoleView.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const repoRoot = process.cwd();
    const rel = 'frontend/apps/os-shell/src/features/gpt/SystemGptConsoleView.tsx';

    const filePath = path.join(repoRoot, rel);
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'SystemGptConsoleView.tsx' });
  });
});
