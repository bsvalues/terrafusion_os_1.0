/**
 * Phase 50 / 50.1: Canon Module Host
 *
 * Deterministic mount/unmount lifecycle for a single WorkspaceModule.
 * - Mounts exactly once per workspaceId
 * - Unmounts previous module on workspace change (before new mount)
 * - Unmounts on host unmount (React cleanup)
 * - Passes full ModuleContext: workspaceId, storageNamespace, guard
 * - Race-safe: if component unmounts during async mount, calls unmount immediately
 *
 * Phase 50.1: Restored canonical core-lane type imports and full ModuleContext.
 *
 * @module canon/CanonModuleHost
 * @see Phase 50: TerraCanon Module Host + Layout Persistence
 * @see Phase 50.1: Convergence Patch
 */

import React, { useEffect, useRef } from 'react';

// @ts-ignore — core-lane TS types
import type {
  WorkspaceModule,
  UnmountFn,
  GuardDecision,
  GuardRequest,
} from '../../../../../os-platform/core/types/workspaceModule';

export interface CanonModuleHostProps {
  workspaceId: string;
  storageNamespace: string;
  module: WorkspaceModule;
  guard: (req: GuardRequest) => GuardDecision;
}

export function CanonModuleHost(props: CanonModuleHostProps): React.ReactElement | null {
  const cleanupRef = useRef<UnmountFn | null>(null);

  useEffect(() => {
    let disposed = false;

    // Deterministic teardown of previous module
    const priorCleanup = cleanupRef.current;
    cleanupRef.current = null;
    if (priorCleanup) priorCleanup();

    (async () => {
      const unmount = await props.module.mount({
        workspaceId: props.workspaceId,
        storageNamespace: props.storageNamespace,
        guard: props.guard,
      });

      if (disposed) {
        // Component unmounted during async mount — call unmount immediately
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
  }, [props.module, props.workspaceId, props.storageNamespace, props.guard]);

  return null;
}
