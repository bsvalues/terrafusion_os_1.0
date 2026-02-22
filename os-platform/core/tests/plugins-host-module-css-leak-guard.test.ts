import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('PluginsHost.module.css leak guard', () => {
  it('contains no raw color values (hex, rgba, or raw hsl without var())', () => {
    const file = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/components/core/PluginsHost.module.css'
    );
    const content = fs.readFileSync(file, 'utf8');
    assertNoRawColorLeaks(content, { label: 'PluginsHost.module.css' });
  });
});
