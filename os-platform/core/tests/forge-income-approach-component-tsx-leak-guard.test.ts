import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/IncomeApproachComponent.tsx';

registerLeakGuard(targetFile, 'IncomeApproachComponent.tsx');