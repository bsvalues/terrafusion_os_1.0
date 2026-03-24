import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dossier/PacketProvenance.tsx';

registerLeakGuard(targetFile, 'PacketProvenance.tsx');