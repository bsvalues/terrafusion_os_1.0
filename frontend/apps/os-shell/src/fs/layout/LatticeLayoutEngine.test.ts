import { SovereignObject } from '../types';
import { computeLatticeLayout, DEFAULT_RENDER_CONFIG } from './LatticeLayoutEngine';

const MOCK_DB = new Map<string, SovereignObject>([
  [
    'A',
    { id: 'A', label: 'Core', relations: ['B', 'C'], type: 'entity', tags: [], status: 'verified' },
  ],
  [
    'B',
    {
      id: 'B',
      label: 'Rel 1',
      relations: ['A', 'D'],
      type: 'document',
      tags: [],
      status: 'pending',
    },
  ],
  [
    'C',
    { id: 'C', label: 'Rel 2', relations: ['A'], type: 'policy', tags: [], status: 'verified' },
  ],
  [
    'D',
    { id: 'D', label: 'Deep Rel', relations: ['B'], type: 'ledger', tags: [], status: 'anomaly' },
  ],
  [
    'Z',
    { id: 'Z', label: 'Unrelated', relations: [], type: 'document', tags: [], status: 'verified' },
  ],
]);

describe('LatticeLayoutEngine (AxiomFS)', () => {
  test('Determinism: Same input produces identical coordinates', () => {
    const run1 = computeLatticeLayout(MOCK_DB, 'A');
    const run2 = computeLatticeLayout(MOCK_DB, 'A');
    expect(run1).toEqual(run2);
  });

  test('Ring Logic: Focus is at (0,0) Ring 0', () => {
    const { nodes } = computeLatticeLayout(MOCK_DB, 'A');
    const core = nodes.find((n) => n.id === 'A');
    expect(core).toMatchObject({ x: 0, y: 0, ring: 0, z: 0 });
  });

  test('Relationship depth: Direct neighbors are Ring 1', () => {
    const { nodes } = computeLatticeLayout(MOCK_DB, 'A');
    const nodeB = nodes.find((n) => n.id === 'B');
    const nodeC = nodes.find((n) => n.id === 'C');
    expect(nodeB?.ring).toBe(1);
    expect(nodeC?.ring).toBe(1);
  });

  test('Relationship depth: Friends of friends are Ring 2', () => {
    const { nodes } = computeLatticeLayout(MOCK_DB, 'A');
    const nodeD = nodes.find((n) => n.id === 'D'); // A -> B -> D
    expect(nodeD?.ring).toBe(2);
  });

  test('Isolation: Unrelated nodes are excluded from the bloom', () => {
    const { nodes } = computeLatticeLayout(MOCK_DB, 'A');
    const nodeZ = nodes.find((n) => n.id === 'Z');
    expect(nodeZ).toBeUndefined();
  });

  test('Configuration: Ring radius respects token input', () => {
    const customConfig = {
      layout: { ringStepPx: 500, zDepthStep: 1, maxRings: 3 },
      render: DEFAULT_RENDER_CONFIG,
    };
    const { nodes } = computeLatticeLayout(MOCK_DB, 'A', customConfig);
    const nodeB = nodes.find((n) => n.id === 'B');

    // B is in Ring 1, so distance from center should be approx 500
    const distance = Math.sqrt(nodeB!.x ** 2 + nodeB!.y ** 2);
    expect(Math.abs(distance - 500)).toBeLessThan(0.1);
  });

  test('Render Props: Scale and Opacity falloff', () => {
    const { nodes } = computeLatticeLayout(MOCK_DB, 'A');
    const core = nodes.find((n) => n.id === 'A');
    const ring1 = nodes.find((n) => n.id === 'B');
    const ring2 = nodes.find((n) => n.id === 'D');

    // Core: Scale 1.0, Opacity 1.0
    expect(core?.scale).toBe(1.0);
    expect(core?.opacity).toBe(1.0);

    // Ring 1: Scale 0.8, Opacity 0.7 (Default falloffs: 0.2, 0.3)
    expect(ring1?.scale).toBeCloseTo(0.8);
    expect(ring1?.opacity).toBeCloseTo(0.7);

    // Ring 2: Scale 0.6, Opacity 0.4
    expect(ring2?.scale).toBeCloseTo(0.6);
    expect(ring2?.opacity).toBeCloseTo(0.4);
  });
});
