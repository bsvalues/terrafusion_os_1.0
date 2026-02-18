import type { WorkspaceModule } from '../../../../../../os-platform/core/types/workspaceModule';

export const BuiltinNoopModule: WorkspaceModule = {
  id: 'builtin-noop',
  title: () => 'Noop',
  async mount() {
    return () => {};
  },
};
