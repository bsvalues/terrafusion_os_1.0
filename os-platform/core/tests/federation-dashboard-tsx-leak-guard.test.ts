import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('FederationDashboard.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.resolve(
      __dirname,
      '../../..',
      'frontend/apps/os-shell/src/applications/federation-dashboard/FederationDashboard.tsx',
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'FederationDashboard.tsx' });
  });
});
