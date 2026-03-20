import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dais/WorkQueuePanel.tsx';

registerLeakGuard(targetFile, 'WorkQueuePanel.tsx');