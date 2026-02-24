import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../..');
const TOKENS_PATH = path.join(ROOT_DIR, 'frontend/apps/os-shell/src/styles/terrafusion-tokens.css');

/**
 * Governance contract: HS anchors must be centrally defined in terrafusion-tokens.css.
 * Without these anchors, any component using hsl(var(--tf-*-hs) L% / alpha)
 * will render as transparent.
 */
describe('Governance: HS Anchors Defined', () => {
  it('tokens file must exist', () => {
    expect(fs.existsSync(TOKENS_PATH), `Missing: ${TOKENS_PATH}`).toBe(true);
  });

  it('must include all required --tf-*-hs semantic anchors', () => {
    const css = fs.readFileSync(TOKENS_PATH, 'utf-8');
    const required = [
      '--tf-bg-surface-hs:',
      '--tf-surface-dark-hs:',
      '--tf-text-primary-hs:',
      '--tf-text-secondary-hs:',
      '--tf-success-hs:',
      '--tf-error-hs:',
      '--tf-warning-hs:',
      '--tf-info-hs:',
      '--tf-network-blue-hs:',
      '--tf-transcend-cyan-hs:',
      '--tf-neutral-hs:',
      '--tf-tokens-black-hs:',
    ];

    const missing = required.filter((anchor) => !css.includes(anchor));
    expect(missing, `Missing HS anchors in terrafusion-tokens.css:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  it('must define lightness step variables (--tf-l-*)', () => {
    const css = fs.readFileSync(TOKENS_PATH, 'utf-8');
    const requiredSteps = [
      '--tf-l-0:',
      '--tf-l-10:',
      '--tf-l-25:',
      '--tf-l-50:',
      '--tf-l-80:',
      '--tf-l-100:',
    ];

    const missing = requiredSteps.filter((step) => !css.includes(step));
    expect(missing, `Missing lightness steps:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  it('must define at least one derived token referencing HS anchors', () => {
    const css = fs.readFileSync(TOKENS_PATH, 'utf-8');
    const hasLuminBridge = /hsl\(var\(--tf-[a-z-]+\)\s*\//.test(css);
    const hasHsConsumer = /hsl\(var\(--tf-[a-z-]+-hs\)/.test(css);
    expect(hasLuminBridge || hasHsConsumer).toBe(true);
  });

  it('HS anchor values must follow H S% format', () => {
    const css = fs.readFileSync(TOKENS_PATH, 'utf-8');
    const hsPattern = /--tf-[a-z-]+-hs:\s*(\d+)\s+(\d+)%/g;
    let match: RegExpExecArray | null;
    let count = 0;

    while ((match = hsPattern.exec(css)) !== null) {
      const hue = parseInt(match[1], 10);
      const saturation = parseInt(match[2], 10);
      expect(hue, `Hue out of range: ${match[0]}`).toBeGreaterThanOrEqual(0);
      expect(hue, `Hue out of range: ${match[0]}`).toBeLessThanOrEqual(360);
      expect(saturation, `Saturation out of range: ${match[0]}`).toBeGreaterThanOrEqual(0);
      expect(saturation, `Saturation out of range: ${match[0]}`).toBeLessThanOrEqual(100);
      count += 1;
    }

    expect(count, 'No HS anchor declarations found').toBeGreaterThanOrEqual(5);
  });
});
