import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Leak guard for SimplifiedQuantumDesktopShell.tsx (Phase 112).
 * Inline style literals: cyan alpha overlays + near-black system bar.
 */
describe('SimplifiedQuantumDesktopShell.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/shell/SimplifiedQuantumDesktopShell.tsx'
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'SimplifiedQuantumDesktopShell.tsx' });
  });
});
