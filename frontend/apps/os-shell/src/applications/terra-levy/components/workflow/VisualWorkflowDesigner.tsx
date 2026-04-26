import React from 'react';
import './VisualWorkflowDesigner.css';

export const VisualWorkflowDesigner: React.FC = () => (
  <section
    className="visual-workflow-designer-unavailable"
    style={{
      border: '1px solid hsl(var(--tf-warning) / 0.35)',
      borderRadius: 12,
      padding: 20,
      background: 'hsl(var(--tf-warning) / 0.08)',
      color: 'hsl(var(--tf-fg))',
    }}
  >
    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>
      Workflow designer unavailable
    </h3>
    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'hsl(var(--tf-fg) / 0.72)' }}>
      This workflow surface is not connected to governed TerraLevy execution. It
      remains unavailable until workflow definitions, actions, and audit trails are
      backed by real Pilot-governed services.
    </p>
  </section>
);
