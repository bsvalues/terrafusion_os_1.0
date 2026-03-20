import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/datamining/EtlStatusPanel.tsx';

registerLeakGuard(targetFile, 'EtlStatusPanel.tsx');