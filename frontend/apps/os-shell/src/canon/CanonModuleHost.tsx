import React, { useEffect, useRef } from 'react';

export type UnmountFn = () => void;

export interface ModuleContext {
  workspaceId: string;
}

export interface WorkspaceModule {
  id: string;
  title(workspaceId: string): string;
  mount(ctx: ModuleContext): Promise<UnmountFn | void>;
}

interface CanonModuleHostProps {
  module: WorkspaceModule;
  workspaceId: string | null;
}

export function CanonModuleHost({ module, workspaceId }: CanonModuleHostProps): React.ReactElement | null {
  const cleanupRef = useRef<UnmountFn | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    let disposed = false;
    const priorCleanup = cleanupRef.current;
    cleanupRef.current = null;
    if (priorCleanup) priorCleanup();

    (async () => {
      const unmount = await module.mount({ workspaceId });
      if (disposed) {
        if (typeof unmount === 'function') unmount();
        return;
      }
      cleanupRef.current = typeof unmount === 'function' ? unmount : null;
    })();

    return () => {
      disposed = true;
      const mountedCleanup = cleanupRef.current;
      cleanupRef.current = null;
      if (mountedCleanup) mountedCleanup();
    };
  }, [module, workspaceId]);

  return null;
}
