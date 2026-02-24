import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../..');
const TOKENS_PATH = path.join(ROOT_DIR, 'frontend', 'apps', 'os-shell', 'src', 'styles', 'terrafusion-tokens.css');

const REQUIRED_HS_ANCHORS = [
  '--tf-hs-neutral:',
  '--tf-hs-primary:',
  '--tf-hs-success:',
  '--tf-hs-warning:',
  '--tf-hs-danger:',
  '--tf-hs-info:',
  '--tf-hs-accent:',
  '--tf-hs-muted:',
  '--tf-hs-surface:',
  '--tf-hs-border:',
  '--tf-hs-overlay:',
];

const REQUIRED_LIGHTNESS_STEPS = [
  '--tf-l-0:',
  '--tf-l-5:',
  '--tf-l-10:',
  '--tf-l-15:',
  '--tf-l-20:',
  '--tf-l-25:',
  '--tf-l-30:',
  '--tf-l-40:',
  '--tf-l-50:',
  '--tf-l-60:',
  '--tf-l-70:',
  '--tf-l-80:',
  '--tf-l-90:',
  '--tf-l-95:',
  '--tf-l-98:',
];

describe('Governance Contract: HS anchor foundation', () => {
  it('tokens file must exist', () => {
    expect(fs.existsSync(TOKENS_PATH), `Missing tokens file at ${TOKENS_PATH}`).toBe(true);
  });

  it('must include required HS anchor tokens', () => {
    const css = fs.readFileSync(TOKENS_PATH, 'utf-8');
    const missing = REQUIRED_HS_ANCHORS.filter((anchor) => !css.includes(anchor));
    expect(missing, `Missing HS anchors: ${missing.join(', ')}`).toEqual([]);
  });

  it('must include required lightness steps', () => {
    const css = fs.readFileSync(TOKENS_PATH, 'utf-8');
    const missing = REQUIRED_LIGHTNESS_STEPS.filter((step) => !css.includes(step));
    expect(missing, `Missing lightness steps: ${missing.join(', ')}`).toEqual([]);
  });
});
