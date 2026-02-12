import React from 'react';

export interface LevyScenarioBoardProps {
  districtId?: string;
}

export const LevyScenarioBoard: React.FC<LevyScenarioBoardProps> = ({ districtId }) => {
  return (
    <div style={{ padding: 16 }}>
      <h2>Levy Scenario Board</h2>
      <p>District: {districtId ?? 'Select a district'}</p>
      <ul>
        <li>Levy rate sliders and caps</li>
        <li>Exemption sensitivity controls</li>
        <li>Revenue forecast with uncertainty bands</li>
        <li>Scenario compare and export</li>
      </ul>
    </div>
  );
};

export default LevyScenarioBoard;
