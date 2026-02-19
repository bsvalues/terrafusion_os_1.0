import fs from 'node:fs';
import path from 'node:path';
import { printTokenReport } from '../ui/printTokenReport';

const tmpFile = path.join(__dirname, '..', '..', '.tdc-report-test.json');

afterEach(() => {
  fs.rmSync(tmpFile, { force: true });
});

describe('printTokenReport', () => {
  it('prints top offending files when violations exist', () => {
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        contract: 'ui-token-compliance.contract.json',
        version: 'v1',
        ok: false,
        scannedFileCount: 10,
        violationCount: 3,
        violations: [
          { kind: 'RAW_HEX', file: 'A.tsx', line: 1, column: 1, excerpt: '#fff' },
          { kind: 'RAW_HEX', file: 'A.tsx', line: 2, column: 1, excerpt: '#000' },
          {
            kind: 'TAILWIND_ARBITRARY_COLOR',
            file: 'B.tsx',
            line: 1,
            column: 1,
            excerpt: 'bg-[#123]',
          },
        ],
        generatedAtIso: new Date().toISOString(),
      }),
      'utf8'
    );

    const out = printTokenReport(tmpFile);
    expect(out).toContain('❌ Token compliance FAILED');
    expect(out).toContain('3 violations');
    expect(out).toContain('2 files');
    expect(out).toContain('A.tsx');
    expect(out).toContain('B.tsx');
    expect(out).toContain('fix top offenders');
  });

  it('prints OK message when no violations', () => {
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        contract: 'ui-token-compliance.contract.json',
        version: 'v1',
        ok: true,
        scannedFileCount: 5,
        violationCount: 0,
        violations: [],
        generatedAtIso: new Date().toISOString(),
      }),
      'utf8'
    );

    const out = printTokenReport(tmpFile);
    expect(out).toContain('✅ Token compliance: OK');
  });

  it('sorts files by violation count descending', () => {
    const violations = [];
    for (let i = 0; i < 5; i++)
      violations.push({ kind: 'RAW_HEX', file: 'Many.tsx', line: i + 1, column: 1, excerpt: '#f' });
    violations.push({ kind: 'RAW_HEX', file: 'Few.tsx', line: 1, column: 1, excerpt: '#a' });

    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        contract: 'ui-token-compliance.contract.json',
        version: 'v1',
        ok: false,
        scannedFileCount: 2,
        violationCount: 6,
        violations,
        generatedAtIso: new Date().toISOString(),
      }),
      'utf8'
    );

    const out = printTokenReport(tmpFile);
    const manyIdx = out.indexOf('Many.tsx');
    const fewIdx = out.indexOf('Few.tsx');
    expect(manyIdx).toBeLessThan(fewIdx);
  });
});
