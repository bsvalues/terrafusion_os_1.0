import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dossier/PacketNarrativeEditor.tsx';

registerLeakGuard(targetFile, 'PacketNarrativeEditor.tsx');