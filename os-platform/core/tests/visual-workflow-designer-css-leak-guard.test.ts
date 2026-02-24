import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Phase 140 leak guard — VisualWorkflowDesigner.css
 */
describe('VisualWorkflowDesigner.css leak guard', () => {
  it('contains no raw color values', () => {
    const repoRoot = process.cwd();
    const rel =
      'frontend/apps/os-shell/src/applications/terra-levy/components/workflow/VisualWorkflowDesigner.css';

    const filePath = path.join(repoRoot, rel);
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'VisualWorkflowDesigner.css' });
  });
});
