import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/suites/OperationalQueue.tsx';

registerLeakGuard(targetFile, 'OperationalQueue.tsx');