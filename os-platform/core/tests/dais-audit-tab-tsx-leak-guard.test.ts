import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dais/AuditTab.tsx';

registerLeakGuard(targetFile, 'AuditTab.tsx');