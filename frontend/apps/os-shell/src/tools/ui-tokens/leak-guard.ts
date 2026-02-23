/**
 * Shared Raw Color Leak Guard
 *
 * Centralised scanner that detects raw colour literals (#hex, rgb/rgba,
 * and raw numeric hsl/hsla) in any text content (CSS, TSX, MDX, etc.).
 *
 * Allows tokenised patterns:
 *   hsl(var(--tf-*) / alpha)
 *   var(--tf-*)
 *
 * Escape hatch: lines containing a `tf-allow-raw-color` comment are skipped.
 */

export type LeakGuardOptions = {
  /** Human-readable label shown in error messages */
  label?: string;
  /** Extra line-level ignore patterns (merged with defaults) */
  ignoreLinePatterns?: RegExp[];
};

export type LeakMatch = {
  /** 1-based line number */
  line: number;
  /** 1-based column number */
  column: number;
  /** The matched raw colour string */
  match: string;
  /** Classification of the leak */
  kind: 'hex' | 'rgb' | 'hsl_raw';
};

/** Lines matching any of these patterns are silently skipped. */
const DEFAULT_IGNORES: RegExp[] = [
  /tf-allow-raw-color\b/i,
];

// ── Regex arsenal ─────────────────────────────────────────────────

/** Hex colours: #rgb, #rgba, #rrggbb, #rrggbbaa */
const HEX_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

/** rgb() / rgba() — always contraband in Gen2 token contract */
const RGB_RE = /\brgba?\(\s*[^)]+\)/g;

/** hsl() / hsla() — need inner inspection to distinguish tokenised from raw */
const HSL_RE = /\bhsla?\(\s*([^)]+)\)/g;

/** Tokenised inner: var(--tf-*) present */
const TOKENISED_RE = /var\(--tf-[a-z0-9-]+\)/i;

// ── Core scanner ──────────────────────────────────────────────────

/**
 * Scan `content` for raw colour literals.
 *
 * Returns an array of matches. Empty array = clean.
 */
export function findRawColorLeaks(
  content: string,
  options: LeakGuardOptions = {},
): LeakMatch[] {
  const ignores = [...DEFAULT_IGNORES, ...(options.ignoreLinePatterns ?? [])];
  const lines = content.split(/\r?\n/);
  const leaks: LeakMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (ignores.some((re) => re.test(line))) continue;

    // ── HEX ──
    let m: RegExpExecArray | null;
    HEX_RE.lastIndex = 0;
    while ((m = HEX_RE.exec(line)) !== null) {
      const idx = m.index;
      // Skip SVG url(#id) false positives
      if (/url\(\s*$/.test(line.slice(0, idx))) continue;
      leaks.push({ line: i + 1, column: idx + 1, match: m[0], kind: 'hex' });
    }

    // ── RGB / RGBA ──
    RGB_RE.lastIndex = 0;
    while ((m = RGB_RE.exec(line)) !== null) {
      leaks.push({
        line: i + 1,
        column: (m.index ?? 0) + 1,
        match: m[0],
        kind: 'rgb',
      });
    }

    // ── HSL / HSLA ──
    HSL_RE.lastIndex = 0;
    while ((m = HSL_RE.exec(line)) !== null) {
      const inner = (m[1] ?? '').trim();

      // Tokenised: contains var(--tf-*) → allowed
      if (TOKENISED_RE.test(inner)) continue;

      // Only flag if the inner looks numeric (contains digits and isn't a
      // CSS function like calc() or env())
      const looksNumeric =
        /[\d.]/.test(inner) &&
        !/[a-zA-Z_]{2,}/.test(inner.replace(/%/g, ''));
      if (!looksNumeric) continue;

      leaks.push({
        line: i + 1,
        column: (m.index ?? 0) + 1,
        match: m[0],
        kind: 'hsl_raw',
      });
    }
  }

  return leaks;
}

// ── Assertion helper ──────────────────────────────────────────────

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '\u2026';
}

/**
 * Assert that `content` contains zero raw colour literals.
 *
 * Throws a descriptive Error on failure (Jest-friendly).
 */
export function assertNoRawColorLeaks(
  content: string,
  options: LeakGuardOptions = {},
): void {
  const leaks = findRawColorLeaks(content, options);
  if (leaks.length === 0) return;

  const label = options.label ? ` (${options.label})` : '';
  const preview = leaks
    .slice(0, 50)
    .map(
      (l) =>
        `  - [${l.kind}] line ${l.line}, col ${l.column}: ${truncate(l.match, 160)}`,
    )
    .join('\n');

  throw new Error(
    `Raw color leaks detected${label}:\n${preview}\n\n` +
      'Replace with var(--tf-*) tokens or tokenised hsl(var(--tf-*) / ...).\n',
  );
}
