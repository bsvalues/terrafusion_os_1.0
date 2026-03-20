import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/RetrainStatusWidget.tsx';

registerLeakGuard(targetFile, 'RetrainStatusWidget.tsx');