import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx';

registerLeakGuard(targetFile, 'TerraPilotPanel.tsx');