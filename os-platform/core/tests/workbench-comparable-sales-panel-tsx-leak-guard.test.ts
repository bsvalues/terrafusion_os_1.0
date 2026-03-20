import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/workbench/ComparableSalesPanel.tsx';

registerLeakGuard(targetFile, 'ComparableSalesPanel.tsx');