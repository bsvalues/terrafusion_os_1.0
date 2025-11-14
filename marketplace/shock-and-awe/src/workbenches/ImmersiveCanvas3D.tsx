import React from 'react';

export interface ImmersiveCanvas3DProps {
  countyId?: string;
  squadFilter?: string[];
}

export const ImmersiveCanvas3D: React.FC<ImmersiveCanvas3DProps> = ({ countyId, squadFilter }) => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1a', color: '#9ccaff' }}>
      <div>
        <h2 style={{ marginBottom: 8 }}>Immersive Quantum Canvas</h2>
        <div>County: {countyId ?? '—'} | Squads: {squadFilter?.join(', ') ?? 'all'}</div>
        <div style={{ opacity: 0.75, marginTop: 12 }}>
          3D visualization placeholder. Hook Three.js scene here.
        </div>
      </div>
    </div>
  );
};

export default ImmersiveCanvas3D;
