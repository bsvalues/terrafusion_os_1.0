import React from 'react';
import './ImmersiveDashboard.css';

export interface ImmersiveDashboardProps {
  userRole: 'levy-clerk' | 'revenue-dept' | 'county-budget' | 'quantum-ai';
  userId: string;
  workspaceId: string;
}

export const ImmersiveDashboard: React.FC<ImmersiveDashboardProps> = () => (
  <section
    className="immersive-dashboard-unavailable"
    style={{
      border: '1px solid hsl(var(--tf-warning) / 0.35)',
      borderRadius: 12,
      padding: 20,
      background: 'hsl(var(--tf-warning) / 0.08)',
      color: 'hsl(var(--tf-fg))',
    }}
  >
    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>
      Immersive dashboard unavailable
    </h3>
    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'hsl(var(--tf-fg) / 0.72)' }}>
      The immersive TerraLevy workspace is not connected to governed voice,
      gesture, 3D data, or AI overlay contracts. It remains unavailable until
      those services are wired to real execution and evidence paths.
    </p>
  </section>
);

export default ImmersiveDashboard;
