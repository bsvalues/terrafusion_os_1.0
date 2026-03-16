import { vi, describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="mock-monaco-editor" />,
  loader: { config: vi.fn() },
}));

vi.mock('monaco-editor', () => ({}));
vi.mock('monaco-editor/esm/vs/editor/editor.worker?worker', () => ({ default: class {} }));
vi.mock('monaco-editor/esm/vs/language/css/css.worker?worker', () => ({ default: class {} }));
vi.mock('monaco-editor/esm/vs/language/html/html.worker?worker', () => ({ default: class {} }));
vi.mock('monaco-editor/esm/vs/language/json/json.worker?worker', () => ({ default: class {} }));
vi.mock('monaco-editor/esm/vs/language/typescript/ts.worker?worker', () => ({ default: class {} }));

import { CanonModuleHost, type WorkspaceModule } from '../../canon/CanonModuleHost';

function Harness({ module }: { module: WorkspaceModule }) {
  const [workspaceId, setWorkspaceId] = React.useState('canon-workspace-1');
  return (
    <div>
      <button
        data-testid='switch-workspace'
        onClick={() => setWorkspaceId('canon-workspace-2')}
      >
        switch
      </button>
      <CanonModuleHost module={module} workspaceId={workspaceId} />
    </div>
  );
}

describe('Phase 50 contract: TerraCanon module host mount/unmount determinism', () => {
  afterEach(() => {
    cleanup();
  });

  it('mounts once per workspace and unmounts on switch + host unmount', async () => {
    const unmountA = vi.fn();
    const unmountB = vi.fn();
    const mount = vi
      .fn()
      .mockResolvedValueOnce(unmountA)
      .mockResolvedValueOnce(unmountB);

    const module: WorkspaceModule = {
      id: 'builtin-noop',
      title: () => 'Noop',
      mount,
    };

    const view = render(<Harness module={module} />);

    await waitFor(() => {
      expect(mount).toHaveBeenCalledTimes(1);
    });

    expect(mount).toHaveBeenNthCalledWith(1, { workspaceId: 'canon-workspace-1' });

    fireEvent.click(screen.getByTestId('switch-workspace'));

    await waitFor(() => {
      expect(mount).toHaveBeenCalledTimes(2);
    });

    expect(unmountA).toHaveBeenCalledTimes(1);
    expect(mount).toHaveBeenNthCalledWith(2, { workspaceId: 'canon-workspace-2' });

    // Wait for the second mount's promise to resolve so cleanupRef is set
    await waitFor(() => {
      expect(unmountB).not.toBeUndefined();
    });

    // Give async mount resolution time to store unmountB in cleanupRef
    await new Promise((r) => setTimeout(r, 0));

    view.unmount();

    await waitFor(() => {
      expect(unmountB).toHaveBeenCalledTimes(1);
    });
  });
});
