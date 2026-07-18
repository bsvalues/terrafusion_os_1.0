import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { describe, expect, it } from 'vitest';

import { createGeoForgePopupContent } from '../popupContent';

const HOSTILE_VALUES = [
  '<img src=x onerror=alert(1)>',
  '<script>throw new Error("executed")</script>',
  '<svg onload=alert(2)>N-101</svg>',
  '<a href="javascript:alert(3)">qualified</a>',
] as const;

function resolveRepoFile(relativePath: string): string {
  let directory = process.cwd();
  const root = parse(directory).root;

  while (directory !== root) {
    const candidate = join(directory, relativePath);
    if (existsSync(candidate)) return candidate;
    directory = dirname(directory);
  }

  const rootCandidate = join(root, relativePath);
  if (existsSync(rootCandidate)) return rootCandidate;

  throw new Error(`Unable to resolve repository file: ${relativePath}`);
}

describe('createGeoForgePopupContent', () => {
  it('renders hostile feature values as inert text', () => {
    const content = createGeoForgePopupContent({
      theme: 'legacy',
      minWidth: 170,
      rows: [
        {
          parts: [{ text: HOSTILE_VALUES[0] }],
          color: '#00FFFF',
          fontWeight: '700',
        },
        {
          parts: [
            { text: `Label ${HOSTILE_VALUES[1]} - Date ${HOSTILE_VALUES[2]} - Decision ` },
            { text: HOSTILE_VALUES[3], color: '#fbbf24', fontSize: '9px', fontWeight: '700' },
          ],
        },
      ],
    });

    for (const value of HOSTILE_VALUES) expect(content.textContent).toContain(value);
    expect(content.querySelector('img')).toBeNull();
    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('svg')).toBeNull();
    expect(content.querySelector('a')).toBeNull();
    expect(content.querySelector('[onerror]')).toBeNull();
    expect(content.querySelector('[onload]')).toBeNull();
    expect(content.querySelector('[href]')).toBeNull();
  });

  it('preserves static structure and text styling without HTML parsing', () => {
    const content = createGeoForgePopupContent({
      theme: 'v2',
      rows: [
        {
          parts: [{ text: 'Neighborhood N-101' }],
          color: 'hsl(var(--tf-muted))',
          fontWeight: '700',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        },
        {
          parts: [{ text: 'Grade A - med 1.000 - n=12' }],
          color: 'hsl(var(--tf-text))',
          fontFamily: 'var(--font-mono)',
          marginTop: '3px',
        },
      ],
    });

    expect(content.children).toHaveLength(2);
    expect(content.textContent).toBe('Neighborhood N-101Grade A - med 1.000 - n=12');
    expect((content.children[0] as HTMLElement).style.textTransform).toBe('uppercase');
  });
});

describe('GeoForge popup integration contract', () => {
  it('uses DOM content at every audited popup sink', () => {
    const v1 = readFileSync(
      resolveRepoFile('frontend/apps/os-shell/src/pages/forge/geo/GeoForgeMap.tsx'),
      'utf8'
    );
    const v2 = readFileSync(
      resolveRepoFile('frontend/apps/os-shell/src/pages/forge/geo/v2/GeoForgeV2Map.tsx'),
      'utf8'
    );
    const source = `${v1}\n${v2}`;

    expect(source).not.toContain('.setHTML(');
    expect(source.match(/\.setDOMContent\(/g)).toHaveLength(8);
    expect(source).not.toMatch(/innerHTML|outerHTML|DOMParser|dangerouslySetInnerHTML/);
  });
});
