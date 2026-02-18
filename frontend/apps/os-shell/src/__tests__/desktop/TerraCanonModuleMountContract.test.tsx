/**
 * Phase 50 / 50.1 — TerraCanon Module Mount Contract
 *
 * Contract: CanonModuleHost mounts a WorkspaceModule deterministically:
 *   - mount called exactly once per workspaceId
 *   - unmount called on workspace change (before new mount)
 *   - unmount called on host unmount (cleanup)
 *   - mount receives full ModuleContext (workspaceId, storageNamespace, guard)
 *   - no leaks: every mount has a matching unmount
 *
 * Phase 50.1: Tightened to assert guard + storageNamespace passthrough.
 *
 * @see Phase 50: TerraCanon Module Host + Layout Persistence
 * @see Phase 50.1: Convergence Patch
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { CanonModuleHost } from '../../canon/CanonModuleHost';
import type {
  WorkspaceModule,
  GuardRequest,
  GuardDecision,
} from '../../../../../../os-platform/core/types/workspaceModule';

describe('Phase 50/50.1 contract: TerraCanon module mount/unmount determinism', () => {
  it('mounts once per workspaceId, passes full ModuleContext, unmounts on change + host unmount', async () => {
    let mounts = 0;
    let unmounts = 0;
    let receivedCtx: any = null;

    const guard = (req: GuardRequest): GuardDecision => ({ allow: true });

    const mod: WorkspaceModule = {
      id: 'canon.test.module',
      title: () => 'Test Module',
      mount: async (ctx) => {
        receivedCtx = ctx;
        mounts += 1;
        return () => {
          unmounts += 1;
        };
      },
      routes: [{ id: 'home', path: 'home', label: 'Home' }],
    };

    const { rerender, unmount } = render(
      <CanonModuleHost
        workspaceId='w1'
        storageNamespace='canon:w1'
        module={mod}
        guard={guard}
      />
    );

    // flush mount effect
    await waitFor(() => {
      expect(mounts).toBe(1);
    });
    expect(unmounts).toBe(0);

    // Phase 50.1: assert full ModuleContext was passed
    expect(receivedCtx).not.toBeNull();
    expect(receivedCtx.workspaceId).toBe('w1');
    expect(receivedCtx.storageNamespace).toBe('canon:w1');
    expect(typeof receivedCtx.guard).toBe('function');

    // guard must be callable and return a valid decision
    const decision = receivedCtx.guard({ actionId: 'test', mutates: false });
    expect(decision.allow).toBe(true);

    // workspace change -> must unmount previous and mount new
    rerender(
      <CanonModuleHost
        workspaceId='w2'
        storageNamespace='canon:w2'
        module={mod}
        guard={guard}
      />
    );

    await waitFor(() => {
      expect(mounts).toBe(2);
    });
    expect(unmounts).toBe(1);

    // Phase 50.1: new workspace context
    expect(receivedCtx.workspaceId).toBe('w2');
    expect(receivedCtx.storageNamespace).toBe('canon:w2');

    // host unmount -> must unmount active
    unmount();
    expect(unmounts).toBe(2);
  });
});
