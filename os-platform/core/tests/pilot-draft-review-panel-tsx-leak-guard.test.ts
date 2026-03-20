import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/pilot/DraftReviewPanel.tsx';

registerLeakGuard(targetFile, 'DraftReviewPanel.tsx');