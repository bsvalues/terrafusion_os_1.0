import React from 'react';

export interface CohortLabProps {
  initialQuery?: string;
}

export const CohortLab: React.FC<CohortLabProps> = ({ initialQuery }) => {
  return (
    <div style={{ padding: 16 }}>
      <h2>Cohort Lab</h2>
      <p>Vector search query: {initialQuery ?? '—'}</p>
      <ul>
        <li>Create and pin cohorts</li>
        <li>Compare cohorts over time</li>
        <li>Send cohort to RatioStudy / Tuning</li>
      </ul>
    </div>
  );
};

export default CohortLab;
