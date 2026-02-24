/**
 * Centralized raw-color leak detection for TerraFusion UI token compliance.
 * Used by per-file guard tests (CSS/TSX/MDX) to keep detection policy consistent.
 */

export type LeakGuardOptions = {
  /** Human-friendly label for error messages. */
  label?: string;
  /** Lines matching ANY of these patterns will be ignored. */
  ignoreLinePatterns?: RegExp[];
  /** Entire file can be excluded by path pattern (rare). */
  ignoreFilePatterns?: RegExp[];
};

export type LeakMatch = {
  line: number;   // 1-based
  column: number; // 1-based
  match: string;
  kind: 'hex' | 'rgb' | 'hsl_raw';
};

const DEFAULT_IGNORE_LINE_PATTERNS: RegExp[] = [
  /^\s*\/[/*].*tf-allow-raw-color\b/i,
];

/**
 * Detect raw colors in source text.
 *
 * Allowed (not flagged):
 *   var(--tf-*), hsl(var(--tf-*)), hsl(var(--tf-*-hs) / …), currentColor
 *
 * Flagged:
 *   Hex (#rgb, #rgba, #rrggbb, #rrggbbaa)
 *   rgb() / rgba()
 *   hsl() / hsla() with numeric args (not tokenized via var(--tf-…))
 */
export function findRawColorLeaks(
  content: string,
  options: LeakGuardOptions = {},
): LeakMatch[] {
  const ignoreLinePatterns = [
    ...DEFAULT_IGNORE_LINE_PATTERNS,
    ...(options.ignoreLinePatterns ?? []),
  ];
  const ignoreFilePatterns = options.ignoreFilePatterns ?? [];

  const label = options.label ?? '';
  if (label && ignoreFilePatterns.some((re) => re.test(label))) return [];

  const lines = content.split(/\r?\n/);
  const leaks: LeakMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i] ?? '';
    if (ignoreLinePatterns.some((re) => re.test(lineText))) continue;

    // 1) HEX
    const hexRe = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
    collectMatches(leaks, hexRe, lineText, i, 'hex');

    // 2) RGB/RGBA — never allowed in our token contract
    const rgbRe = /\brgba?\(\s*[^)]+\)/g;
    collectMatches(leaks, rgbRe, lineText, i, 'rgb');

    // 3) RAW HSL/HSLA (numeric, not tokenized)
    const hslCalls = [...lineText.matchAll(/\bhsla?\(\s*([^)]+)\)/g)];
    for (const m of hslCalls) {
      const inner = (m[1] ?? '').trim();
      const isTokenized =
        /var\(--tf-[a-z0-9-]+\)/i.test(inner) ||
        /var\(--tf-[a-z0-9-]+-hs\)/i.test(inner);
      if (isTokenized) continue;

      const looksNumeric =
        /[\d.]/.test(inner) &&
        !/[a-zA-Z_-]{2,}/.test(inner.replace(/%/g, ''));

      if (looksNumeric) {
        leaks.push({
          line: i + 1,
          column: (m.index ?? 0) + 1,
          match: `hsl(${inner})`,
          kind: 'hsl_raw',
        });
      }
    }
  }

  return leaks;
}

/**
 * Throws a readable error if any raw color leaks exist.
 * Intended for use in guard tests.
 */
export function assertNoRawColorLeaks(
  content: string,
  options: LeakGuardOptions = {},
): void {
  const leaks = findRawColorLeaks(content, options);
  if (leaks.length === 0) return;

  const label = options.label ? ` (${options.label})` : '';
  const formatted = leaks
    .slice(0, 50)
    .map(
      (l) =>
        `- [${l.kind}] line ${l.line}, col ${l.column}: ${truncate(l.match, 140)}`,
    )
    .join('\n');
  const extra = leaks.length > 50 ? `\n… and ${leaks.length - 50} more` : '';

  throw new Error(
    `Raw color leaks detected${label}:\n${formatted}${extra}\n\n` +
      'Fix by replacing with var(--tf-*) tokens or tokenized hsl(var(--tf-*-hs) / ...).\n',
  );
}

function collectMatches(
  out: LeakMatch[],
  re: RegExp,
  lineText: string,
  lineIndex0: number,
  kind: LeakMatch['kind'],
) {
  for (const m of lineText.matchAll(re)) {
    const raw = m[0];
    const idx = m.index ?? -1;
    if (idx < 0) continue;

    if (kind === 'hex') {
      const before = idx > 0 ? lineText[idx - 1] : '';
      // Skip SVG url(#id) references
      if (/url\(\s*$/.test(lineText.slice(0, idx))) continue;
      // Skip if preceded by word char (CSS ID, not a color)
      if (before && /[A-Za-z0-9_-]/.test(before)) continue;
    }

    out.push({
      line: lineIndex0 + 1,
      column: idx + 1,
      match: raw,
      kind,
    });
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)) + '…';
}
