import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dais/AppealDeadlinePanel.tsx';

registerLeakGuard(targetFile, 'AppealDeadlinePanel.tsx');