import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dais/CertRollPanel.tsx';

registerLeakGuard(targetFile, 'CertRollPanel.tsx');