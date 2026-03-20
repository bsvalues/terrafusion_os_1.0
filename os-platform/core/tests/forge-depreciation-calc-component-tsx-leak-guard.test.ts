import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/DepreciationCalcComponent.tsx';

registerLeakGuard(targetFile, 'DepreciationCalcComponent.tsx');