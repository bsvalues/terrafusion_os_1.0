import { LatticeLayoutResult, LatticeNodeLayout, SovereignObject } from '../types';

// Configuration derived from Tokens (injected to ensure purity)
export interface LayoutConfig {
  ringStepPx: number; // e.g., 260px (derived from space-xxl * phi)
  zDepthStep: number; // e.g., 100px per ring
  maxRings: number; // Cap at 3 for v1 performance
}

// Injected configuration to prevent Magic Numbers
export interface LatticeRenderConfig {
  voxelSizeVar: string; // "var(--tf-voxel-size)"
  baseScale: number;
  scaleFalloff: number; // e.g., 0.2 per ring
  baseOpacity: number;
  opacityFalloff: number;
  baseBlur: number;
  blurFalloff: number; // e.g., 5px per ring
  baseZIndex: number;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  ringStepPx: 261.8, // Derived: 100 * Phi^2 approx
  zDepthStep: 1,
  maxRings: 3,
};

export const DEFAULT_RENDER_CONFIG: LatticeRenderConfig = {
  voxelSizeVar: 'var(--tf-voxel-size)',
  baseScale: 1.0,
  scaleFalloff: 0.2,
  baseOpacity: 1.0,
  opacityFalloff: 0.3,
  baseBlur: 0,
  blurFalloff: 4,
  baseZIndex: 100,
};

export interface ComputeConfig {
  layout: LayoutConfig;
  render: LatticeRenderConfig;
}

/**
 * Deterministic Lattice Layout
 * Algorithm: Radial BFS (Rings)
 * Enforces: Single Sovereign Focus
 */
export function computeLatticeLayout(
  objects: Map<string, SovereignObject>,
  focusId: string | null,
  config: ComputeConfig = { layout: DEFAULT_LAYOUT_CONFIG, render: DEFAULT_RENDER_CONFIG }
): LatticeLayoutResult {
  const results: LatticeNodeLayout[] = [];
  const edges: { from: string; to: string; opacity: number }[] = [];

  if (!focusId || !objects.has(focusId)) {
    return { nodes: [], edges: [] };
  }

  // 1. BFS Traversal to assign Rings
  const visited = new Set<string>();
  const queue: { id: string; ring: number }[] = [{ id: focusId, ring: 0 }];
  const ringGroups = new Map<number, string[]>(); // ringIndex -> objectIds[]

  visited.add(focusId);

  while (queue.length > 0) {
    const { id, ring } = queue.shift()!;

    // Grouping
    if (!ringGroups.has(ring)) ringGroups.set(ring, []);
    ringGroups.get(ring)?.push(id);

    // Stop expansion if at max rings
    if (ring >= config.layout.maxRings) continue;

    const obj = objects.get(id);
    if (obj) {
      obj.relations.forEach((neighborId) => {
        if (!visited.has(neighborId) && objects.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, ring: ring + 1 });

          // Record Edge (only forward edges in BFS capture structure)
          edges.push({
            from: id,
            to: neighborId,
            opacity: 1 - ring * 0.3, // Fades as it gets deeper
          });
        }
      });
    }
  }

  // 2. Deterministic Positioning
  ringGroups.forEach((ids, ring) => {
    const isCenter = ring === 0;
    const count = ids.length;
    const radius = ring * config.layout.ringStepPx;

    // Sort IDs to ensure determinism (A->Z)
    ids.sort();

    ids.forEach((id, index) => {
      let x = 0,
        y = 0;

      if (!isCenter) {
        // Distribute evenly along the ring circle
        // Starting angle -90deg (top) for first item
        const angleStep = (2 * Math.PI) / count;
        const angle = -Math.PI / 2 + index * angleStep;

        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      }

      // Deterministic Render Calculation
      const zDepth = ring === 0 ? 0 : -ring * config.layout.zDepthStep;

      results.push({
        id,
        x,
        y,
        z: zDepth,
        ring,

        // Render Props (Calculated here, not in Component)
        scale: Math.max(0, config.render.baseScale - ring * config.render.scaleFalloff),
        opacity: Math.max(0, config.render.baseOpacity - ring * config.render.opacityFalloff),
        blurPx: config.render.baseBlur + ring * config.render.blurFalloff,
        zIndex: config.render.baseZIndex - ring,

        width: config.render.voxelSizeVar,
        height: config.render.voxelSizeVar,
      });
    });
  });

  return { nodes: results, edges };
}
