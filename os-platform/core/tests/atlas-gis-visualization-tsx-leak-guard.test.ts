import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/atlas/GisVisualization.tsx';

registerLeakGuard(targetFile, 'GisVisualization.tsx');