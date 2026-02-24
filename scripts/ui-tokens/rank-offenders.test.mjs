#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGB = /\brgba?\(\s*[\d.\s,%]+\)/g;
const HSL = /\bhsla?\(\s*[\d.\s,%]+\)/g;
const TOKEN_HSL_VAR = /hsl\(\s*var\(--tf-[^)]+\)\s*[^)]*\)/g;
const TOKEN_VAR = /var\(--tf-[^)]+\)/g;

function countMatches(content, re) {
  const m = content.match(re);
  return m ? m.length : 0;
}

function scoreFile(content) {
  const scrubbed = content.replace(TOKEN_HSL_VAR, '').replace(TOKEN_VAR, '');
  const hex = countMatches(scrubbed, HEX);
  const rgb = countMatches(scrubbed, RGB);
  const hsl = countMatches(scrubbed, HSL);
  return { hex, rgb, hsl, total: hex + rgb + hsl };
}

test('does not count tokenized var() patterns as raw', () => {
  const css = `
    .a { color: hsl(var(--tf-primary-hs) 50%); }
    .b { background: var(--tf-surface); }
  `;
  const s = scoreFile(css);
  assert.equal(s.total, 0);
});

test('counts raw hex/rgb/hsl literals', () => {
  const css = `
    .a { color: #fff; }
    .b { color: rgba(0, 0, 0, 0.5); }
    .c { color: hsl(210 50% 40%); }
  `;
  const s = scoreFile(css);
  assert.equal(s.hex, 1);
  assert.equal(s.rgb, 1);
  assert.equal(s.hsl, 1);
  assert.equal(s.total, 3);
});
