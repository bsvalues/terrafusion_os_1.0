import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

export function registerLeakGuard(targetFile: string, label: string): void {
  describe(`${label} leak guard`, () => {
    it('contains no raw color values', () => {
      const filePath = path.join(process.cwd(), targetFile);
      expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      assertNoRawColorLeaks(content, { label });
    });
  });
}