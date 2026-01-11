import { LatticeLayoutResult, LatticeNodeLayout, SovereignObject } from '../types';

export interface ArcRenderProp {
  id: string; // unique key (source-target)
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
}

/**
 * Pure function to derive arc visuals from layout physics.
 * Law: Arcs inherit the 'weakest' status of their endpoints (or simply flow from source).
 * Law: Arcs fade into the substrate as they move to deeper rings.
 */
export function computeRelationArcs(
  layout: LatticeLayoutResult,
  objects: Map<string, SovereignObject>
): ArcRenderProp[] {
  const nodeMap = new Map<string, LatticeNodeLayout>();
  layout.nodes.forEach((node) => nodeMap.set(node.id, node));

  return layout.edges
    .map((edge) => {
      const source = nodeMap.get(edge.from);
      const target = nodeMap.get(edge.to);

      // If either node was filtered out or doesn't exist in layout, no arc.
      if (!source || !target) return null;

      // Determine visual weight based on depth (Ring Logic)
      // Deeper rings = fainter lines.
      const maxRing = Math.max(source.ring, target.ring);
      const opacity = Math.max(0.1, 1 - maxRing * 0.4);

      // Determine color based on Target Status (The destination of the relationship)
      // If target is Verified, the link is solid (Green/Cyan). If Anomaly, it warns (Amber).
      const targetObj = objects.get(edge.to);
      let color = 'var(--tf-transcend-cyan)'; // Default Logic

      if (targetObj?.status === 'verified') color = 'var(--tf-success-green)';
      if (targetObj?.status === 'anomaly') color = 'var(--tf-signal-amber)';

      return {
        id: `${edge.from}-${edge.to}`,
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y,
        strokeColor: color,
        strokeOpacity: opacity,
        strokeWidth: maxRing === 0 ? 2 : 1, // Focus arcs are thicker
      };
    })
    .filter((arc): arc is ArcRenderProp => arc !== null);
}
