/**
 * W6A — TerraQueue Honesty Contract Tests
 *
 * Static source inspection for the TerraQueue fixture-disclosure lane.
 * Verifies:
 *   - queueStore requests real endpoints first and marks fixture mode explicitly
 *   - TerraQueue discloses fixture mode visually when backend queue endpoints fail
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Gate 1 — queueStore tracks explicit fixture mode', () => {
  const src = readSrc('stores/queueStore.ts');

  it('declares isFixture in QueueState', () => {
    expect(src).toContain('isFixture: boolean');
  });

  it('requests queue reads with throwOnError: true', () => {
    expect(src).toContain('getQueueItems({ throwOnError: true })');
    expect(src).toContain('getQueueMetrics({ throwOnError: true })');
    expect(src).toContain('getAppraiserProductivity({ throwOnError: true })');
  });

  it('falls back to explicit fixture datasets on fetch failure', () => {
    expect(src).toContain('items: QUEUE_ITEMS');
    expect(src).toContain('metrics: QUEUE_METRICS');
    expect(src).toContain('productivity: APPRAISER_PRODUCTIVITY');
    expect(src).toContain('isFixture: true');
  });
});

describe('Gate 2 — TerraQueue visibly discloses fixture mode', () => {
  const src = readSrc('pages/dais/TerraQueue.tsx');

  it('imports DemoDataBanner from governance', () => {
    expect(src).toMatch(/from\s+['"]@\/components\/governance\/DemoDataBanner['"]/);
  });

  it('renders DemoDataBanner when isFixture is true', () => {
    expect(src).toContain('isFixture && <DemoDataBanner module="TerraQueue" />');
  });

  it('renders a local-simulation disclosure note', () => {
    expect(src).toContain('data-testid="terra-queue-fixture-note"');
    expect(src).toContain('Assignments and review actions simulate locally in this session.');
  });
});