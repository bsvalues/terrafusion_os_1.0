import React from 'react';
import LevyBenton from './LevyBenton';
import RatioStudyBenton from './RatioStudyBenton';

const card: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 12,
  background: 'white',
};

export const BentonDemo: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Benton — Ratio Study</h3>
        <RatioStudyBenton />
      </section>
      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Benton — Levy Forecast</h3>
        <LevyBenton />
      </section>
    </div>
  );
};

export default BentonDemo;
