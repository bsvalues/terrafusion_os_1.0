import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/AdvancedPropertyComparison.tsx';

registerLeakGuard(targetFile, 'AdvancedPropertyComparison.tsx');