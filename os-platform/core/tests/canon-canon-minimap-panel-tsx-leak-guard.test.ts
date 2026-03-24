import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/canon/CanonMinimapPanel.tsx';

registerLeakGuard(targetFile, 'CanonMinimapPanel.tsx');