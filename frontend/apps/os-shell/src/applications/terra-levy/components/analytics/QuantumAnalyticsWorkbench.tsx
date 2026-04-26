import React from 'react';
import './QuantumAnalyticsWorkbench.css';

export interface QuantumAnalyticsWorkbenchProps {
  userId: string;
  departmentId: string;
  analysisMode: 'predictive' | 'statistical' | 'quantum' | 'research';
  targetAccuracy: number;
}

export const QuantumAnalyticsWorkbench: React.FC<QuantumAnalyticsWorkbenchProps> = () => (
  <section
    className="quantum-analytics-workbench-unavailable"
    style={{
      border: '1px solid hsl(var(--tf-warning) / 0.35)',
      borderRadius: 12,
      padding: 20,
      background: 'hsl(var(--tf-warning) / 0.08)',
      color: 'hsl(var(--tf-fg))',
    }}
  >
    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>
      Quantum analytics workbench unavailable
    </h3>
    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'hsl(var(--tf-fg) / 0.72)' }}>
      This analytics workbench has no governed TerraLevy compute, model, or evidence
      contract. It remains unavailable until its execution lane is backed by real
      services and auditability.
    </p>
  </section>
);

export default QuantumAnalyticsWorkbench;
