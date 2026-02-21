import { colors, tfHsl, withOpacity } from '../colors';

// ============================================================================
// tfHsl – canonical tokenized HSL helper
// ============================================================================

describe('tfHsl', () => {
  it('renders opaque hsl(var(--tf-*))', () => {
    expect(tfHsl('--tf-bg')).toBe('hsl(var(--tf-bg))');
  });

  it('renders alpha hsl(var(--tf-*) / a)', () => {
    expect(tfHsl('--tf-bg', 0.6)).toBe('hsl(var(--tf-bg) / 0.6)');
  });

  it('clamps alpha to 0', () => {
    expect(tfHsl('--tf-bg', -1)).toBe('hsl(var(--tf-bg) / 0)');
  });

  it('clamps alpha to 1', () => {
    expect(tfHsl('--tf-bg', 2)).toBe('hsl(var(--tf-bg) / 1)');
  });

  it('handles alpha = 0 (transparent)', () => {
    expect(tfHsl('--tf-accent', 0)).toBe('hsl(var(--tf-accent) / 0)');
  });

  it('handles alpha = 1 (fully opaque)', () => {
    expect(tfHsl('--tf-accent', 1)).toBe('hsl(var(--tf-accent) / 1)');
  });
});

// ============================================================================
// withOpacity – legacy hex-to-rgba (backward compat)
// ============================================================================

describe('withOpacity', () => {
  it('converts hex to rgba', () => {
    expect(withOpacity('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('handles hex without hash', () => {
    expect(withOpacity('00ff00', 0.8)).toBe('rgba(0, 255, 0, 0.8)');
  });
});

// ============================================================================
// Regression guard: no raw rgba() leaks in exported token objects
// ============================================================================

describe('no rgba() leaks in color tokens', () => {
  const RGBA_RE = /rgba?\(\d/;

  function collectStrings(obj: unknown, path = ''): Array<[string, string]> {
    const pairs: Array<[string, string]> = [];
    if (typeof obj === 'string') {
      pairs.push([path, obj]);
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'function') continue;
        pairs.push(...collectStrings(v, path ? `${path}.${k}` : k));
      }
    }
    return pairs;
  }

  // Collect all string values from the main exports, EXCLUDING utils (withOpacity is allowed)
  const entries = [
    ...collectStrings(colors.semantic, 'semantic'),
    ...collectStrings(colors.state, 'state'),
    ...collectStrings(colors.component, 'component'),
    ...collectStrings(colors.gradient, 'gradient'),
  ];

  it.each(entries)('%s = %s does not contain raw rgba()', (_path, value) => {
    expect(value).not.toMatch(RGBA_RE);
  });
});
