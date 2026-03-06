import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('motion.ts leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.resolve(
      __dirname,
      '../../..',
      'frontend/apps/os-shell/src/design-system/tokens/motion.ts'
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, {
      label: 'motion.ts',
      knownViolationBaseline: 2, // Design system: keyframe glow animation rgba() values
    });
  });
});
