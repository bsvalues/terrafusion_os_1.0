import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dossier/PacketFinalizationPanel.tsx';

registerLeakGuard(targetFile, 'PacketFinalizationPanel.tsx');