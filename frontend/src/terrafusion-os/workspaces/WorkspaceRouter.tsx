import React from 'react';
import { useWorkspace } from '../core/state/WorkspaceContext';
import { HomeWorkspace } from './HomeWorkspace';
import { QuantumLabWorkspace } from './QuantumLabWorkspace';

export const WorkspaceRouter: React.FC = () => {
  const { activeWorkspaceId } = useWorkspace();

  switch (activeWorkspaceId) {
    case 'quantumLab':
      return <QuantumLabWorkspace />;

    case 'home':
    default:
      return <HomeWorkspace />;
  }
};
