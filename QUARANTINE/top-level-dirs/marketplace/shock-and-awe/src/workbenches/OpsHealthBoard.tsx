import React from 'react';

export const OpsHealthBoard: React.FC = () => {
  return (
    <div style={{ padding: 16 }}>
      <h2>Operations Health Board</h2>
      <ul>
        <li>Harris / Tyler / Aumentum sync status</li>
        <li>Agent swarm health & queues</li>
        <li>SLA & anomaly alerts</li>
      </ul>
    </div>
  );
};

export default OpsHealthBoard;
