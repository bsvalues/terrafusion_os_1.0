import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/atlas/GamaMap.tsx';

registerLeakGuard(targetFile, 'GamaMap.tsx');