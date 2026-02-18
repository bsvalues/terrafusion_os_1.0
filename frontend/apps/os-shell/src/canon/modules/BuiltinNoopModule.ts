import type { WorkspaceModule } from '../CanonModuleHost';

export const BuiltinNoopModule: WorkspaceModule = {
  id: 'builtin-noop',
  title: () => 'Noop',
  async mount() {
    return () => {};
  },
};
