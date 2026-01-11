export type SovereignObjectType = 'document' | 'policy' | 'entity' | 'ledger';
export type SovereignObjectStatus = 'verified' | 'pending' | 'anomaly';
export type ModuleContext =
  | 'identity'
  | 'finance'
  | 'justice'
  | 'defense'
  | 'infrastructure'
  | 'labor'
  | 'energy';

export interface SovereignObject {
  id: string;
  type: SovereignObjectType;
  label: string;
  tags: string[];
  relations: string[]; // Adjacency list (IDs)
  status: SovereignObjectStatus;
  module?: ModuleContext;
  // Metadata for "Earned Light" logic (e.g., last verified timestamp)
  lastVerified?: number;
}

export interface LatticeNodeLayout {
  id: string;
  // Physics (The Skeleton)
  x: number; // px relative to center
  y: number; // px relative to center
  z: number; // Depth scalar (0 = Focus, -1 = Ring 1, etc.)
  ring: number; // BFS distance

  // Render-Ready Props (The Skin - Pre-calculated)
  scale: number; // e.g., 1.0, 0.8...
  opacity: number; // e.g., 1.0, 0.5...
  blurPx: number; // e.g., 0, 10...
  zIndex: number; // e.g., 100, 90...

  // Dimensions (Token-derived)
  width: string; // e.g., "var(--tf-voxel-size)"
  height: string;
}

export interface LatticeLayoutResult {
  nodes: LatticeNodeLayout[];
  edges: { from: string; to: string; opacity: number }[];
}
