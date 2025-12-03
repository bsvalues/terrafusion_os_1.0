import { createContext, ReactNode, useContext, useState } from 'react';

export type WorkspaceId =
  | 'home'
  | 'propertyWorkbench'
  | 'levyStudio'
  | 'gisWorkspace'
  | 'quantumLab';

interface WorkspaceState {
  activeWorkspaceId: WorkspaceId;
  setActiveWorkspaceId: (id: WorkspaceId) => void;
}

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceId>('home');

  return (
    <WorkspaceContext.Provider value={{ activeWorkspaceId, setActiveWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceState => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return ctx;
};
