import React from 'react';

export interface AIAssistantProps {
  className?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ className }) => (
  <section
    className={className}
    style={{
      border: '1px solid hsl(var(--tf-warning) / 0.35)',
      borderRadius: 12,
      padding: 20,
      background: 'hsl(var(--tf-warning) / 0.08)',
      color: 'hsl(var(--tf-fg))',
    }}
  >
    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>
      TerraLevy AI assistant unavailable
    </h3>
    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'hsl(var(--tf-fg) / 0.72)' }}>
      This experimental assistant surface is not connected to a governed TerraLevy
      backend contract. Use the live AI and Risk tab on the TerraLevy dashboard
      until a traced assistant lane is implemented.
    </p>
  </section>
);
