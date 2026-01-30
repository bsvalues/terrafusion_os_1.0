import { useMemo } from 'react';
import { AxiomFSRelationsLayer } from './components/AxiomFSRelationsLayer';
import { GlassVoxel } from './components/GlassVoxel';
import {
  computeLatticeLayout,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_RENDER_CONFIG,
} from './layout/LatticeLayoutEngine';
import { useAxiomFsStore } from './store/axiomFsStore';

export const AxiomFSSurface = () => {
  const { objects, selectedId, selectObject } = useAxiomFsStore();

  // Deterministic Layout Computation
  // In production, we would use a ResizeObserver to update viewport center
  // For v1, we assume a centered stage (0,0) relative to this container
  const layoutResult = useMemo(() => {
    return computeLatticeLayout(objects, selectedId, {
      layout: DEFAULT_LAYOUT_CONFIG,
      render: DEFAULT_RENDER_CONFIG,
    });
  }, [objects, selectedId]);

  return (
    <div className='relative h-full w-full overflow-hidden' aria-label='Axiom File Lattice'>
      {/* The Centered Stage */}
      <div className='absolute left-1/2 top-1/2 h-0 w-0'>
        {/* PHASE C1: RELATION ARCS (Mounted Below Voxels) */}
        <AxiomFSRelationsLayer layout={layoutResult} objects={objects} />

        {layoutResult.nodes.map((nodeLayout) => {
          const object = objects.get(nodeLayout.id);
          if (!object) return null;

          return (
            <GlassVoxel
              key={nodeLayout.id}
              object={object}
              layout={nodeLayout}
              isSelected={selectedId === nodeLayout.id}
              onSelect={selectObject}
            />
          );
        })}
      </div>

      {/* Empty State / Instructional Overlay could go here */}
    </div>
  );
};
