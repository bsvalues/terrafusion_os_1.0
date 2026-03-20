import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/atlas/MapContainerWidget.tsx';

registerLeakGuard(targetFile, 'MapContainerWidget.tsx');