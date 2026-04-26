import React from 'react';

export interface DataScienceLabProps {
  className?: string;
}

export const DataScienceLaboratory: React.FC<DataScienceLabProps> = ({ className }) => (
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
      TerraLevy data science laboratory unavailable
    </h3>
    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'hsl(var(--tf-fg) / 0.72)' }}>
      The laboratory workbench has no governed notebook, compute, or evidence
      contract in the current TerraLevy release. It remains intentionally
      unavailable until those execution lanes are wired to real services.
    </p>
  </section>
);
