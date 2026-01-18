import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

// Replicating logic that will be in dependencyScopeQuarantine.mjs
const parseReport = (content: string) => {
  const lines = content.split('\n');
  const samples: any[] = [];
  const totals: Record<string, number> = {};

  let section = '';

  for (const line of lines) {
    if (line.startsWith('## Totals')) {
      section = 'totals';
      continue;
    }
    if (line.startsWith('## Top Evidence Samples')) {
      section = 'samples';
      continue;
    }

    if (section === 'totals' && line.trim().startsWith('- ')) {
      const parts = line.replace('- ', '').split(':');
      if (parts.length === 2) {
        totals[parts[0].trim()] = parseInt(parts[1].trim(), 10);
      }
    }

    if (section === 'samples' && line.trim().startsWith('- ')) {
      // Format: - Name -> Category (local=X; total=Y; wiring=Z)
      const match = line.match(/- (.*?) -> (.*?) \(local=(\d+); total=(\d+); wiring=(.*?)\)/);
      if (match) {
        samples.push({
          package: match[1],
          bucket: match[2],
          localUsage: parseInt(match[3], 10),
          totalUsage: parseInt(match[4], 10),
          wiring: match[5],
        });
      }
    }
  }
  return { totals, samples };
};

describe('Dependency Scope Quarantine Parser', () => {
  it('parses a standard report correctly', () => {
    const fixturePath = path.resolve(
      __dirname,
      '../../scripts/__fixtures__/dependency_scope_report_fixture.md'
    );
    const content = fs.readFileSync(fixturePath, 'utf-8');
    const result = parseReport(content);

    expect(result.totals['QUARANTINE']).toBe(4);
    expect(result.totals['CORE_OS_RUNTIME']).toBe(2);

    expect(result.samples).toHaveLength(6);

    const devCopy = result.samples.find((s: any) => s.package === 'Dev - Copy');
    expect(devCopy).toBeDefined();
    expect(devCopy.bucket).toBe('QUARANTINE');
    expect(devCopy.localUsage).toBe(5);
    expect(devCopy.totalUsage).toBe(7);
    expect(devCopy.wiring).toBe('none');
  });

  it('handles empty input gracefully', () => {
    const result = parseReport('');
    expect(result.totals).toEqual({});
    expect(result.samples).toEqual([]);
  });
});
