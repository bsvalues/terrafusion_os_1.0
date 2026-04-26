/**
 * Consciousness plumbing truth contract
 *
 * @vitest-environment jsdom
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Consciousness plumbing truth contract', () => {
  it('signalRClient no longer points swarm traffic at a retired consciousness hub', () => {
    const src = readSrc('services/signalRClient.ts');

    expect(src).not.toContain('/hubs/consciousness');
    expect(src).not.toContain('VITE_CONSCIOUSNESS_URL');
    expect(src).toContain('Governed swarm SignalR hub unavailable');
  });

  it('HealthCheckService no longer probes a dead consciousness-parameters health endpoint', () => {
    const src = readSrc('services/monitoring/HealthCheckService.ts');

    expect(src).not.toContain('/api/consciousness-parameters/health');
    expect(src).not.toContain("name: 'consciousnessParameter'");
  });
});
