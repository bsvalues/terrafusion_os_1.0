import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/ModelDetailsComponent.tsx';

registerLeakGuard(targetFile, 'ModelDetailsComponent.tsx');