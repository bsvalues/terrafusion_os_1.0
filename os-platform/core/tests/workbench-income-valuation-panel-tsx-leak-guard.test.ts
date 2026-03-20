import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/workbench/IncomeValuationPanel.tsx';

registerLeakGuard(targetFile, 'IncomeValuationPanel.tsx');