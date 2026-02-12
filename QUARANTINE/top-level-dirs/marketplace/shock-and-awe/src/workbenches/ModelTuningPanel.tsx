import React from 'react';

export interface ModelTuningPanelProps {
  modelId?: string;
}

export const ModelTuningPanel: React.FC<ModelTuningPanelProps> = ({ modelId }) => {
  return (
    <div style={{ padding: 16 }}>
      <h2>Model Tuning Panel</h2>
      <p>Model: {modelId ?? 'New/Select model'}</p>
      <ul>
        <li>Search: grid / random / Bayesian</li>
        <li>Explainability: SHAP/global/local</li>
        <li>Fairness metrics by subgroup</li>
        <li>Register to model registry</li>
      </ul>
    </div>
  );
};

export default ModelTuningPanel;
