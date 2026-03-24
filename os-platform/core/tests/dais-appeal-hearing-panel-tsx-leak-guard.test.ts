import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/dais/AppealHearingPanel.tsx';

registerLeakGuard(targetFile, 'AppealHearingPanel.tsx');