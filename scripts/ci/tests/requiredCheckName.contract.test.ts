import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const WORKFLOWS_DIR = path.join(__dirname, '../../../.github/workflows');

describe('Governance Required Check Name', () => {
  it('should have a stable workflow name for governance-proof', () => {
    const files = fs
      .readdirSync(WORKFLOWS_DIR)
      .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    let foundStableName = false;

    // We are looking for a workflow explicitly named 'governance-proof'
    // or a job named 'governance-proof' that matches our expectations.

    for (const file of files) {
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, file), 'utf8');

      // Check for workflow name
      if (/name:\s*['"]?governance-proof['"]?/.test(content)) {
        foundStableName = true;
        break;
      }
    }

    expect(foundStableName, 'No workflow found with strict name: governance-proof').toBe(true);
  });
});
