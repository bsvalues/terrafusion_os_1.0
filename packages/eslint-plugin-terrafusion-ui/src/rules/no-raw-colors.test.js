/**
 * Tests for eslint-plugin-terrafusion-ui / no-raw-colors rule.
 *
 * Uses ESLint's built-in RuleTester to verify:
 *   - Token-based classes (hsl(var(--tf-*))) are allowed
 *   - Raw hex literals are rejected
 *   - Arbitrary Tailwind color classes (bg-[#...], text-[rgba(...)]) are rejected
 */

import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import rule from './no-raw-colors.js';

/**
 * Lightweight harness: ESLint's RuleTester doesn't always play nicely
 * with ESM + vitest, so we use Linter directly for maximum compatibility.
 */
function lint(code) {
  const linter = new Linter();
  linter.defineRule('terrafusion-ui/no-raw-colors', rule);
  return linter.verify(code, {
    rules: { 'terrafusion-ui/no-raw-colors': 'error' },
    parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  });
}

describe('no-raw-colors', () => {
  // ── Valid (should produce zero errors) ──────────────────────

  it('allows hsl(var(--tf-*)) token references in strings', () => {
    const messages = lint(`export const x = "bg-[hsl(var(--tf-surface)/0.8)]";`);
    expect(messages).toHaveLength(0);
  });

  it('allows hsl(var(--tf-*)) token references in JSX className', () => {
    const messages = lint(`<div className="border-[hsl(var(--tf-border)/0.9)]" />;`);
    expect(messages).toHaveLength(0);
  });

  it('allows standard Tailwind palette classes (no arbitrary values)', () => {
    const messages = lint(`export const cls = "bg-white text-gray-500";`);
    expect(messages).toHaveLength(0);
  });

  // ── Invalid (should report errors) ─────────────────────────

  it('rejects raw hex in string literal', () => {
    const messages = lint(`export const x = "color:#ff00ff";`);
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages[0].messageId).toBe('noRawHex');
  });

  it('rejects raw hex in arbitrary Tailwind class', () => {
    const messages = lint(`<div className="bg-[#0b0f1a]" />;`);
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages.some((m) => m.messageId === 'noRawHex')).toBe(true);
  });

  it('rejects arbitrary rgba() in Tailwind class', () => {
    const messages = lint(`<div className="text-[rgba(255,0,0,0.5)]" />;`);
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages.some((m) => m.messageId === 'noArbitraryColor')).toBe(true);
  });

  it('rejects raw hex in template literal', () => {
    const messages = lint('const cls = `border-color: #aabbcc`;');
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages[0].messageId).toBe('noRawHex');
  });
});
