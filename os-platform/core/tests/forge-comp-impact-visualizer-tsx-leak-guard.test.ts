import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/CompImpactVisualizer.tsx';

registerLeakGuard(targetFile, 'CompImpactVisualizer.tsx');