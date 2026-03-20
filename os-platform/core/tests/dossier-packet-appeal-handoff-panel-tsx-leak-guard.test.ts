import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dossier/PacketAppealHandoffPanel.tsx';

registerLeakGuard(targetFile, 'PacketAppealHandoffPanel.tsx');