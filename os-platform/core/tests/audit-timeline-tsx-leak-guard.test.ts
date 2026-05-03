import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Leak guard for AuditTimeline.tsx (Phase 203 strict-coverage backfill).
 */
describe('AuditTimeline.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/components/workbench/AuditTimeline.tsx'
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'AuditTimeline.tsx' });
  });
});
