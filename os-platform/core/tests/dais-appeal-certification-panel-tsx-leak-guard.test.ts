import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dais/AppealCertificationPanel.tsx';

registerLeakGuard(targetFile, 'AppealCertificationPanel.tsx');