import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/suites/SuiteModuleGrid.tsx';

registerLeakGuard(targetFile, 'SuiteModuleGrid.tsx');