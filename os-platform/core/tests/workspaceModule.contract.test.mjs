/**
 * Phase 48: Workspace Module Contract Tests
 *
 * Validates the TerraCanon workspace module interface contract:
 * - Module shape correctness (id, title, mount, routes, permissions)
 * - Mount returns UnmountFn that is always safe to call
 * - Guard is callable and returns proper decisions
 * - Integration with commandGate and layoutEnvelope
 *
 * Run with: node --test os-platform/core/tests/workspaceModule.contract.test.mjs
 *
 * @see Phase 48: TerraCanon Core Contracts
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createCommandGate } from '../canon/commandGate.mjs';
import { defaultLayoutV1 } from '../canon/layoutEnvelope.mjs';

describe('Workspace Module – Shape Contract (WM1)', () => {
  it('WM1a — module object shape is minimally sane', async () => {
    const gate = createCommandGate(() => ({ allow: true }));
    const ctx = {
      workspaceId: 'w1',
      storageNamespace: 'canon:w1:mod:test',
      guard: (req) => gate.decide({ id: req.actionId, mutates: req.mutates, meta: req.meta }),
    };

    /** @type {import("../types/workspaceModule.ts").WorkspaceModule} */
    const mod = {
      id: 'test.module',
      title: () => 'Test Module',
      mount: async (c) => {
        // Guard must be callable; layout default must exist (sanity hook)
        const d = c.guard({ actionId: 'canon.workspace.inspect', mutates: false });
        assert.deepEqual(d, { allow: true });
        assert.ok(defaultLayoutV1().panels.main.visible);
        return () => {};
      },
      routes: [{ id: 'home', path: 'home', label: 'Home' }],
    };

    const unmount = await mod.mount(ctx);
    assert.equal(typeof unmount, 'function');
    unmount(); // must not throw
  });

  it('WM1b — module title is workspace-aware', () => {
    const mod = {
      id: 'ws-aware.module',
      title: (wsId) => `Module for ${wsId}`,
      mount: async () => () => {},
    };
    assert.equal(mod.title('workspace-42'), 'Module for workspace-42');
  });
});

describe('Workspace Module – Mount/Unmount Lifecycle (WM2)', () => {
  it('WM2a — mount resolves to an UnmountFn', async () => {
    const mod = {
      id: 'lifecycle.module',
      title: () => 'Lifecycle',
      mount: async (ctx) => {
        // Simulate setup
        const state = { active: true };
        return () => {
          state.active = false;
        };
      },
    };

    const gate = createCommandGate(() => ({ allow: true }));
    const unmount = await mod.mount({
      workspaceId: 'w1',
      storageNamespace: 'canon:w1:mod:lifecycle',
      guard: (req) => gate.decide({ id: req.actionId, mutates: req.mutates }),
    });

    assert.equal(typeof unmount, 'function');
    // Calling unmount twice must not throw
    unmount();
    unmount();
  });

  it('WM2b — mount receives correct context properties', async () => {
    let receivedCtx = null;
    const mod = {
      id: 'ctx.module',
      title: () => 'Context Check',
      mount: async (ctx) => {
        receivedCtx = ctx;
        return () => {};
      },
    };

    const gate = createCommandGate(() => ({ allow: true }));
    await mod.mount({
      workspaceId: 'workspace-99',
      storageNamespace: 'canon:workspace-99:mod:ctx',
      guard: (req) => gate.decide({ id: req.actionId, mutates: req.mutates }),
    });

    assert.equal(receivedCtx.workspaceId, 'workspace-99');
    assert.equal(receivedCtx.storageNamespace, 'canon:workspace-99:mod:ctx');
    assert.equal(typeof receivedCtx.guard, 'function');
  });
});

describe('Workspace Module – Guard Integration (WM3)', () => {
  it('WM3a — module guard denies mutating actions when policy says no', async () => {
    const gate = createCommandGate((req) => {
      if (req.mutates) return { allow: false, reason: 'Read-only workspace' };
      return { allow: true };
    });

    const mod = {
      id: 'guarded.module',
      title: () => 'Guarded',
      mount: async (ctx) => {
        // Read is allowed
        const readDecision = ctx.guard({ actionId: 'canon.inspect', mutates: false });
        assert.deepEqual(readDecision, { allow: true });

        // Write is denied
        const writeDecision = ctx.guard({ actionId: 'canon.workspace.close', mutates: true });
        assert.equal(writeDecision.allow, false);
        assert.equal(/** @type {{ reason: string }} */ (writeDecision).reason, 'Read-only workspace');

        return () => {};
      },
    };

    await mod.mount({
      workspaceId: 'w-readonly',
      storageNamespace: 'canon:w-readonly:mod:guarded',
      guard: (req) => gate.decide({ id: req.actionId, mutates: req.mutates, meta: req.meta }),
    });
  });
});

describe('Workspace Module – Optional Fields (WM4)', () => {
  it('WM4a — module without routes is valid', async () => {
    const mod = {
      id: 'no-routes.module',
      title: () => 'No Routes',
      mount: async () => () => {},
    };
    assert.equal(mod.routes, undefined);
    const unmount = await mod.mount({
      workspaceId: 'w1',
      storageNamespace: 'ns',
      guard: () => ({ allow: true }),
    });
    assert.equal(typeof unmount, 'function');
  });

  it('WM4b — module without permissions is valid', async () => {
    const mod = {
      id: 'no-perms.module',
      title: () => 'No Perms',
      mount: async () => () => {},
    };
    assert.equal(mod.permissions, undefined);
  });

  it('WM4c — module with routes and permissions has correct shapes', () => {
    const mod = {
      id: 'full.module',
      title: () => 'Full',
      mount: async () => () => {},
      routes: [
        { id: 'home', path: 'home', label: 'Home' },
        { id: 'settings', path: 'settings', label: 'Settings' },
      ],
      permissions: [
        { id: 'canon.read', description: 'Read workspace data' },
        { id: 'canon.write', description: 'Write workspace data' },
      ],
    };

    assert.equal(mod.routes.length, 2);
    assert.equal(mod.routes[0].id, 'home');
    assert.equal(mod.routes[1].path, 'settings');
    assert.equal(mod.permissions.length, 2);
    assert.equal(mod.permissions[0].id, 'canon.read');
  });
});

console.log('Workspace Module Contract Suite');
console.log('================================');
console.log(
  'Run with: node --test os-platform/core/tests/workspaceModule.contract.test.mjs'
);
