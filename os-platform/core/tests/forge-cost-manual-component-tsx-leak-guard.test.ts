import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/CostManualComponent.tsx';

registerLeakGuard(targetFile, 'CostManualComponent.tsx');