import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dais/AppealNoticePanel.tsx';

registerLeakGuard(targetFile, 'AppealNoticePanel.tsx');