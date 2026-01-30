import { render } from '@testing-library/react';
import { computeRelationArcs } from '../../layout/RelationArcLayout';
import { LatticeLayoutResult, SovereignObject } from '../../types';
import { AxiomFSRelationsLayer } from '../AxiomFSRelationsLayer';

// Mock Data
const MOCK_LAYOUT: LatticeLayoutResult = {
  nodes: [
    {
      id: 'A',
      x: 0,
      y: 0,
      z: 0,
      ring: 0,
      opacity: 1,
      scale: 1,
      blurPx: 0,
      zIndex: 100,
      width: '0',
      height: '0',
    },
    {
      id: 'B',
      x: 100,
      y: 100,
      z: -1,
      ring: 1,
      opacity: 0.8,
      scale: 0.8,
      blurPx: 0,
      zIndex: 90,
      width: '0',
      height: '0',
    },
  ],
  edges: [{ from: 'A', to: 'B', opacity: 1 }],
};

const MOCK_OBJECTS = new Map<string, SovereignObject>([
  ['A', { id: 'A', status: 'verified', type: 'document', label: 'A', relations: ['B'], tags: [] }],
  ['B', { id: 'B', status: 'pending', type: 'document', label: 'B', relations: ['A'], tags: [] }],
]);

describe('AxiomFSRelationsLayer (Phase C1)', () => {
  test('Math: Computes coordinates between two nodes', () => {
    const arcs = computeRelationArcs(MOCK_LAYOUT, MOCK_OBJECTS);
    expect(arcs).toHaveLength(1);
    expect(arcs[0].x1).toBe(0);
    expect(arcs[0].x2).toBe(100);
  });

  test('Visual Law: Status drives stroke color', () => {
    // Target B is pending -> Default/Cyan
    const arcs = computeRelationArcs(MOCK_LAYOUT, MOCK_OBJECTS);
    expect(arcs[0].strokeColor).toContain('var(--tf-transcend-cyan)');

    // Change B to Verified -> Green
    const verifiedObjects = new Map(MOCK_OBJECTS);
    verifiedObjects.set('B', { ...verifiedObjects.get('B')!, status: 'verified' });

    const arcsVerified = computeRelationArcs(MOCK_LAYOUT, verifiedObjects);
    expect(arcsVerified[0].strokeColor).toContain('var(--tf-success-green)');
  });

  test('Render: SVG lines appear in DOM', () => {
    const { container } = render(
      <svg>
        <AxiomFSRelationsLayer layout={MOCK_LAYOUT} objects={MOCK_OBJECTS} />
      </svg>
    );
    // Note: We wrap in parent svg because the component renders internal group logic in this specific mock context
    // or just render the component itself if it includes the <svg> tag as defined above.
    // Based on implementation above, it renders the <svg> root.

    // Actually, AxiomFSRelationsLayer renders the <svg>, so wrapping it in another <svg> might be weird but valid SVG.
    // However, the component expects to be the root SVG.
    // Let's render it directly.
    const { container: containerDirect } = render(
      <AxiomFSRelationsLayer layout={MOCK_LAYOUT} objects={MOCK_OBJECTS} />
    );

    const line = containerDirect.querySelector('line');
    expect(line).toBeInTheDocument();
    expect(line).toHaveAttribute('x1', '0');
    expect(line).toHaveAttribute('x2', '100');
  });
});
