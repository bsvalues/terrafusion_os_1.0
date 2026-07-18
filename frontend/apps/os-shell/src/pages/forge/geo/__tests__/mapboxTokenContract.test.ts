import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { describe, expect, it } from 'vitest';

const CANONICAL_TOKEN = 'VITE_MAPBOX_ACCESS_TOKEN';
const LEGACY_TOKEN = 'VITE_MAPBOX_TOKEN';

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

function readGeoForgeSource(relativePath: string): string {
  return readFileSync(
    resolveRepoFile(`frontend/apps/os-shell/src/pages/forge/geo/${relativePath}`),
    'utf8'
  );
}

describe('GeoForge Mapbox token contract', () => {
  it('uses only the canonical browser token in live lookup and guidance', () => {
    const v1 = readGeoForgeSource('GeoForgeMap.tsx');
    const v2 = readGeoForgeSource('v2/GeoForgeV2Map.tsx');
    const source = `${v1}\n${v2}`;

    expect(v1.match(new RegExp(`\\b${CANONICAL_TOKEN}\\b`, 'g'))).toHaveLength(2);
    expect(v2.match(new RegExp(`\\b${CANONICAL_TOKEN}\\b`, 'g'))).toHaveLength(2);
    expect(source.match(/import\.meta\.env\.VITE_MAPBOX_ACCESS_TOKEN/g)).toHaveLength(2);
    expect(source).not.toMatch(new RegExp(`\\b${LEGACY_TOKEN}\\b`));
  });
});
