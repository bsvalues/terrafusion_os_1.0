import { readFile } from 'node:fs/promises';
import type { CanonIndex, EngineeringWriteLaneIndex } from './types.js';

export async function loadCanonIndex(path = 'config/canon-index.json'): Promise<CanonIndex> {
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw) as CanonIndex;
  return {
    ...parsed,
    rules: parsed.rules.filter((rule) => rule.status === 'active')
  };
}

export async function loadEngineeringWriteLanes(path = 'config/engineering-write-lanes.json'): Promise<EngineeringWriteLaneIndex> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as EngineeringWriteLaneIndex;
}
