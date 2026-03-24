import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dais/NoticeBatchQueuePanel.tsx';

registerLeakGuard(targetFile, 'NoticeBatchQueuePanel.tsx');