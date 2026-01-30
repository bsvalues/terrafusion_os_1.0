import { useMemo } from 'react';
import { computeRelationArcs } from '../layout/RelationArcLayout';
import { LatticeLayoutResult, SovereignObject } from '../types';

interface Props {
  layout: LatticeLayoutResult;
  objects: Map<string, SovereignObject>;
}

export const AxiomFSRelationsLayer = ({ layout, objects }: Props) => {
  // Memoize geometry calculation to ensure 60fps performance
  const arcs = useMemo(() => computeRelationArcs(layout, objects), [layout, objects]);

  return (
    <svg
      className='absolute inset-0 h-full w-full pointer-events-none overflow-visible'
      style={{ zIndex: 0 }} // Explicitly below Voxels (which are z-index 100+)
      aria-hidden='true' // Purely decorative/relational, not interactive
    >
      {/* We use a centered coordinate system matching the Voxel Stage.
        Translate 50% 50% to align (0,0) with the layout center.
      */}
      <g transform='translate(50%, 50%)'>
        {arcs.map((arc) => (
          <line
            key={arc.id}
            x1={arc.x1}
            y1={arc.y1}
            x2={arc.x2}
            y2={arc.y2}
            stroke={arc.strokeColor}
            strokeOpacity={arc.strokeOpacity}
            strokeWidth={arc.strokeWidth}
            strokeLinecap='round'
          />
        ))}
      </g>
    </svg>
  );
};
