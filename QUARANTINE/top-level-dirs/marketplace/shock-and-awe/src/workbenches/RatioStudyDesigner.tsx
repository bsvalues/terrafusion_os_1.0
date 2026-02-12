import React from 'react';

export interface RatioStudyDesignerProps {
  cohortId?: string;
}

export const RatioStudyDesigner: React.FC<RatioStudyDesignerProps> = ({ cohortId }) => {
  return (
    <div style={{ padding: 16 }}>
      <h2>IAAO Ratio Study Designer</h2>
      <p>Cohort: {cohortId ?? 'Select a cohort'}</p>
      <ul>
        <li>Configure trims/outliers</li>
        <li>Compute Median, COD, PRD</li>
        <li>Subgroup fairness diagnostics</li>
        <li>Bootstrap confidence intervals</li>
      </ul>
    </div>
  );
};

export default RatioStudyDesigner;
