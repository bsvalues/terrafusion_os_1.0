import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dossier/ParcelEvidencePacket.tsx';

registerLeakGuard(targetFile, 'ParcelEvidencePacket.tsx');