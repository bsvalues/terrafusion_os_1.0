import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/EconomicIndicatorsDashboard.tsx';

registerLeakGuard(targetFile, 'EconomicIndicatorsDashboard.tsx');