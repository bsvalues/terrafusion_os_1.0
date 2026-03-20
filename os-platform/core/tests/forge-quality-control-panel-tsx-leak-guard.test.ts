import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/QualityControlPanel.tsx';

registerLeakGuard(targetFile, 'QualityControlPanel.tsx');