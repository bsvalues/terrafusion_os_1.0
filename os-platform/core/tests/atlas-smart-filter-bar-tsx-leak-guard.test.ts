import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/atlas/SmartFilterBar.tsx';

registerLeakGuard(targetFile, 'SmartFilterBar.tsx');