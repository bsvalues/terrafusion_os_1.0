export interface FederationNode {
  nodeId: string;
  region: string;
  status: 'active' | 'inactive' | 'degraded';
  latency: number;
  coordinates: { x: number; y: number }; // For visualization
}

export interface SwarmMission {
  id: string;
  objective: string;
  activeAgents: number;
  progress: number;
}
