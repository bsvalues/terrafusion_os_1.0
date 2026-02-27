import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
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
    const unmountA = jest.fn();
    const unmountB = jest.fn();
    const mount = jest
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

    view.unmount();

    expect(unmountB).toHaveBeenCalledTimes(1);
  });
});
