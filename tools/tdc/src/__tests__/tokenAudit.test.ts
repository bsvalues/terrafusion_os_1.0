import fs from 'node:fs';
import path from 'node:path';
import { computeScopeHash, runTokenAudit } from '../ui/tokenAudit';

const tmpRoot = path.join(__dirname, '..', '..', '.tdc-test-tmp');

beforeEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  fs.mkdirSync(tmpRoot, { recursive: true });
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('tdc ui audit --tokens (tokenAudit)', () => {
  it('flags raw hex colors', () => {
    fs.writeFileSync(
      path.join(tmpRoot, 'Bad.tsx'),
      `export function X(){ return <div style={{ color: "#ff00ff" }}>hi</div>; }`,
      'utf8'
    );

    const c = runTokenAudit(tmpRoot);
    expect(c.ok).toBe(false);
    expect(c.violationCount).toBeGreaterThan(0);
    expect(c.violations.some(v => v.kind === 'RAW_HEX')).toBe(true);
  });

  it('flags arbitrary Tailwind color classes', () => {
    fs.writeFileSync(
      path.join(tmpRoot, 'Slop.tsx'),
      `export function X(){ return <div className="bg-[#0b0f1a] text-[rgba(255,0,0,0.4)]">hi</div>; }`,
      'utf8'
    );

    const c = runTokenAudit(tmpRoot);
    expect(c.ok).toBe(false);
    expect(c.violations.some(v => v.kind === 'TAILWIND_ARBITRARY_COLOR')).toBe(true);
  });

  it('flags disallowed direct color functions', () => {
    fs.writeFileSync(
      path.join(tmpRoot, 'Direct.tsx'),
      `export const bg = "rgba(10, 20, 30, 0.5)";`,
      'utf8'
    );

    const c = runTokenAudit(tmpRoot);
    expect(c.ok).toBe(false);
    expect(c.violations.some(v => v.kind === 'DISALLOWED_COLOR_FUNCTION')).toBe(true);
  });

  it('allows TF token usage patterns (hsl(var(--tf-*)))', () => {
    fs.writeFileSync(
      path.join(tmpRoot, 'Good.tsx'),
      `export function X(){ return <div className="bg-[hsl(var(--tf-surface)/0.8)] border-[hsl(var(--tf-border)/0.9)]">ok</div>; }`,
      'utf8'
    );

    const c = runTokenAudit(tmpRoot);
    // Token patterns are allowed for arbitrary TW and color fn checks
    // Note: raw hex check won't fire here since there are no hex values
    expect(c.violations.filter(v => v.kind === 'TAILWIND_ARBITRARY_COLOR')).toHaveLength(0);
    expect(c.violations.filter(v => v.kind === 'DISALLOWED_COLOR_FUNCTION')).toHaveLength(0);
  });

  it('allows standard Tailwind palette classes (no violations)', () => {
    fs.writeFileSync(
      path.join(tmpRoot, 'Palette.tsx'),
      `export function X(){ return <div className="bg-white text-gray-500 border-cyan-700">ok</div>; }`,
      'utf8'
    );

    const c = runTokenAudit(tmpRoot);
    expect(c.ok).toBe(true);
    expect(c.violationCount).toBe(0);
  });

  it('emits correct contract structure', () => {
    fs.writeFileSync(path.join(tmpRoot, 'Any.tsx'), `export const x = 1;`, 'utf8');

    const c = runTokenAudit(tmpRoot);
    expect(c.contract).toBe('ui-token-compliance.contract.json');
    expect(c.version).toBe('v1');
    expect(typeof c.ok).toBe('boolean');
    expect(typeof c.scannedFileCount).toBe('number');
    expect(typeof c.violationCount).toBe('number');
    expect(Array.isArray(c.violations)).toBe(true);
    expect(typeof c.generatedAtIso).toBe('string');
  });

  it('skips node_modules directories', () => {
    const nmDir = path.join(tmpRoot, 'node_modules', 'bad-pkg');
    fs.mkdirSync(nmDir, { recursive: true });
    fs.writeFileSync(path.join(nmDir, 'index.js'), `const color = "#ff0000";`, 'utf8');

    const c = runTokenAudit(tmpRoot);
    expect(c.ok).toBe(true);
    expect(c.scannedFileCount).toBe(0);
  });
});

// ── Scoped scanning ──────────────────────────────────────────────

describe('tdc ui audit --tokens (scoped scanning)', () => {
  it('only includes specified directories', () => {
    const gen2 = path.join(tmpRoot, 'gen2');
    const legacy = path.join(tmpRoot, 'legacy');
    fs.mkdirSync(gen2, { recursive: true });
    fs.mkdirSync(legacy, { recursive: true });

    fs.writeFileSync(path.join(gen2, 'A.tsx'), 'const c = "#ff0000";', 'utf8');
    fs.writeFileSync(path.join(legacy, 'B.tsx'), 'const c = "#00ff00";', 'utf8');

    const c = runTokenAudit(tmpRoot, { include: ['gen2/**'] });
    expect(c.violationCount).toBeGreaterThan(0);
    expect(c.violations.every(v => v.file.startsWith('gen2'))).toBe(true);
  });

  it('skips excluded directories within included scope', () => {
    const src = path.join(tmpRoot, 'src');
    const tests = path.join(tmpRoot, 'src', '__tests__');
    fs.mkdirSync(tests, { recursive: true });

    fs.writeFileSync(path.join(src, 'A.tsx'), 'const c = "#ff0000";', 'utf8');
    fs.writeFileSync(path.join(tests, 'B.test.tsx'), 'const c = "#00ff00";', 'utf8');

    const c = runTokenAudit(tmpRoot, {
      include: ['src/**'],
      exclude: ['**/__tests__/**'],
    });
    expect(c.violations.some(v => v.file.includes('__tests__'))).toBe(false);
    expect(c.violations.some(v => v.file.includes('A.tsx'))).toBe(true);
  });

  it('handles non-existent include directories gracefully', () => {
    const c = runTokenAudit(tmpRoot, { include: ['does-not-exist/**'] });
    expect(c.ok).toBe(true);
    expect(c.scannedFileCount).toBe(0);
  });
});

// ── computeScopeHash ─────────────────────────────────────────────

describe('computeScopeHash', () => {
  it('is order-independent', () => {
    const h1 = computeScopeHash({ include: ['a/**', 'b/**'] });
    const h2 = computeScopeHash({ include: ['b/**', 'a/**'] });
    expect(h1).toBe(h2);
  });

  it('differs when scope changes', () => {
    const h1 = computeScopeHash({ include: ['a/**'] });
    const h2 = computeScopeHash({ include: ['a/**', 'b/**'] });
    expect(h1).not.toBe(h2);
  });

  it('returns a 16-char hex string', () => {
    const h = computeScopeHash({ include: ['x/**'] });
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });

  it('handles undefined scope', () => {
    const h = computeScopeHash(undefined);
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });
});
