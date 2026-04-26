import React from 'react';
import './BudgetVisualization3D.css';

export const BudgetVisualization3D: React.FC = () => (
  <section
    className="budget-visualization-3d-unavailable"
    style={{
      border: '1px solid hsl(var(--tf-warning) / 0.35)',
      borderRadius: 12,
      padding: 20,
      background: 'hsl(var(--tf-warning) / 0.08)',
      color: 'hsl(var(--tf-fg))',
    }}
  >
    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>
      3D budget visualization unavailable
    </h3>
    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'hsl(var(--tf-fg) / 0.72)' }}>
      This immersive budget surface has no live TerraLevy data contract. Use the
      governed budget scenario and projection tabs until a traced 3D execution lane
      exists.
    </p>
  </section>
);
