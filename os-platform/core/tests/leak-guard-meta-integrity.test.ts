import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 200 — Guard the guards.
 *
 * Asserts that:
 * 1. The expected minimum number of leak-guard test files exists.
 * 2. Every guard imports assertNoRawColorLeaks from the canonical module.
 * 3. Every guard resolves a file path (via __dirname or process.cwd()).
 *
 * This prevents silent erosion: deleting guards, rewriting them to skip
 * the assertion, or pointing them at the wrong file.
 */
describe('leak-guard meta-integrity', () => {
  const guardsDir = path.resolve(__dirname);
  const guardFiles = fs.readdirSync(guardsDir).filter(f => f.endsWith('-leak-guard.test.ts'));

  it('has at least 340 leak-guard test files', () => {
    expect(guardFiles.length).toBeGreaterThanOrEqual(340);
  });

  it('every guard imports assertNoRawColorLeaks', () => {
    const missing: string[] = [];
    for (const file of guardFiles) {
      const content = fs.readFileSync(path.join(guardsDir, file), 'utf8');
      if (!content.includes('assertNoRawColorLeaks')) {
        missing.push(file);
      }
    }
    expect(
      missing,
      `Guards missing assertNoRawColorLeaks import: ${missing.join(', ')}`
    ).toHaveLength(0);
  });

  it('every guard resolves a target file path', () => {
    const broken: string[] = [];
    for (const file of guardFiles) {
      const content = fs.readFileSync(path.join(guardsDir, file), 'utf8');
      const hasPathResolution =
        content.includes('path.resolve(') ||
        content.includes('path.join(') ||
        /\bresolve\s*\(/.test(content) ||
        /assertNoRawColorLeaks\s*\(\s*['"]/.test(content);
      if (!hasPathResolution) {
        broken.push(file);
      }
    }
    expect(broken, `Guards without path resolution: ${broken.join(', ')}`).toHaveLength(0);
  });
});
